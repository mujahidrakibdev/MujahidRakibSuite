export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export interface Model {
  model_id: string;
  name: string;
  description: string;
  can_do_text_to_speech: boolean;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

const API_BASE = 'https://api.elevenlabs.io/v1';

export const fetchVoices = async (apiKey: string): Promise<Voice[]> => {
  const response = await fetch(`${API_BASE}/voices`, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail?.message || "Failed to fetch voices");
  }

  const data = await response.json();
  return data.voices;
};

export const fetchModels = async (apiKey: string): Promise<Model[]> => {
  const response = await fetch(`${API_BASE}/models`, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    // Fallback models if API fails or key is invalid initially
    return [
      { model_id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2', description: 'Best for lifelike speech', can_do_text_to_speech: true },
      { model_id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5', description: 'Fastest model', can_do_text_to_speech: true },
      { model_id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1', description: 'Reliable English', can_do_text_to_speech: true },
    ];
  }

  const data = await response.json();
  return data.filter((m: Model) => m.can_do_text_to_speech);
};

export const generateAudio = async (
  text: string,
  voiceId: string,
  apiKey: string,
  modelId: string,
  settings: VoiceSettings
): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: settings.use_speaker_boost
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail?.message || "Failed to generate audio");
  }

  return await response.blob();
};