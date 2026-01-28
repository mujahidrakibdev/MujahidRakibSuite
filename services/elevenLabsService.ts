export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  preview_url?: string;
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

export const generateAudio = async (
  text: string,
  voiceId: string,
  apiKey: string,
  stability: number,
  similarityBoost: number,
  modelId: string = 'eleven_monolingual_v1'
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
        stability: stability,
        similarity_boost: similarityBoost,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail?.message || "Failed to generate audio");
  }

  return await response.blob();
};