import { VideoData, VideoType, TranscriptProvider } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const RAPID_API_HOST = 'youtube-transcripts.p.rapidapi.com';
const SUPADATA_API_URL = 'https://api.supadata.ai/v1';

// Helper: Parse ISO 8601 duration to seconds
export const parseDurationToSeconds = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1] || '0')) * 3600;
  const minutes = (parseInt(match[2] || '0')) * 60;
  const seconds = parseInt(match[3] || '0');

  return hours + minutes + seconds;
};

// Helper: Extract Video ID from various URL formats including Shorts
export const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  // Regex to handle standard watch, shorts, embed, youtu.be, and mobile URLs
  // Captures the 11-character ID
  const pattern = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([\w-]{11})/;
  const match = cleanUrl.match(pattern);
  
  if (match && match[1]) return match[1];
  
  // Fallback: checks if the input is just the ID itself (11 chars, safe characters)
  if (/^[\w-]{11}$/.test(cleanUrl)) return cleanUrl;

  // Fallback for older formats with query params like &v=
  const legacyMatch = cleanUrl.match(/[?&]v=([\w-]{11})/);
  if (legacyMatch && legacyMatch[1]) return legacyMatch[1];
  
  return null;
};

// Helper: Extract Channel ID/Handle
const resolveChannelId = async (input: string, apiKey: string): Promise<string> => {
  const cleanInput = input.trim();
  // If it looks like a channel ID (UC...)
  if (cleanInput.startsWith('UC') && cleanInput.length === 24) return cleanInput;

  // If it's a handle (@name) or custom URL part
  let handle = cleanInput;
  if (cleanInput.includes('youtube.com/')) {
    const parts = cleanInput.split('/');
    // Handle scenarios like youtube.com/@handle or youtube.com/c/name
    handle = parts.find(p => p.startsWith('@')) || parts[parts.length - 1];
    if (!handle && parts.includes('channel')) {
         handle = parts[parts.indexOf('channel') + 1];
    }
  }
  
  if (!handle) throw new Error("Invalid channel URL or handle");

  // Search for the channel to get ID
  const response = await fetch(`${BASE_URL}/search?part=snippet&type=channel&q=${handle}&key=${apiKey}`);
  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error(`Channel not found for handle: ${handle}`);
  }

  return data.items[0].snippet.channelId;
};

// Fetch details for a list of video IDs
export const getVideoDetails = async (videoIds: string[], apiKey: string): Promise<VideoData[]> => {
  if (videoIds.length === 0) return [];

  // API limit is 50 per call
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  let allVideos: any[] = [];

  for (const chunk of chunks) {
    const response = await fetch(`${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${chunk.join(',')}&key=${apiKey}`);
    const data = await response.json();
    if (data.items) {
      allVideos = [...allVideos, ...data.items];
    }
  }

  return allVideos.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
    viewCount: item.statistics.viewCount || '0',
    likeCount: item.statistics.likeCount || '0',
    commentCount: item.statistics.commentCount || '0',
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails.duration,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    tags: item.snippet.tags || [],
    description: item.snippet.description || '',
    categoryId: item.snippet.categoryId,
    transcript: '', 
  }));
};

// Helper: normalize transcript content to plain text
const normalizeTranscriptText = (content: any): string => {
  if (!content) return "";
  
  // If it's already a string, return it
  if (typeof content === 'string') {
      return content.replace(/\s+/g, ' ').trim();
  }

  // If it's an array of segments (common structure: [{text: "...", ...}])
  if (Array.isArray(content)) {
    return content
      .map((item: any) => item.text || item.snippet || "")
      .join(" ")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // If it's an object, try to find a known text field or recurse
  if (typeof content === 'object') {
    if (content.text && typeof content.text === 'string') return content.text;
    if (content.transcript) return normalizeTranscriptText(content.transcript);
    // Last resort: stringify if it looks like unknown JSON
    return JSON.stringify(content); 
  }

  return String(content);
};

// Helper: Safe JSON Parse from Fetch Response
const safeJsonFetch = async (response: Response, errorPrefix: string): Promise<any> => {
    const text = await response.text();
    
    // Check for HTTP Errors first to give better messages
    if (response.status === 401) throw new Error(`${errorPrefix}: Unauthorized (401) - Check API Key`);
    if (response.status === 403) throw new Error(`${errorPrefix}: Forbidden (403) - Quota or Key issue`);
    if (response.status === 404) throw new Error(`${errorPrefix}: Not Found (404)`);
    if (response.status === 500) throw new Error(`${errorPrefix}: Server Error (500)`);
    if (response.status === 502) throw new Error(`${errorPrefix}: Bad Gateway (502) - Service overloaded`);

    try {
        return JSON.parse(text);
    } catch (e) {
        // If parsing fails, it's likely an HTML error page (e.g. <!DOCTYPE...)
        // We trim the text to avoid flooding logs with full HTML
        const snippet = text.slice(0, 100).replace(/\n/g, ' ');
        throw new Error(`${errorPrefix}: Invalid JSON response. Raw: "${snippet}..."`);
    }
};

// Implementation: RapidAPI (Veritoolz / youtube-transcripts)
const fetchTranscriptRapid = async (videoId: string, apiKey: string): Promise<string> => {
    // Veritoolz usually uses the youtube-transcripts.p.rapidapi.com endpoint
    const url = `https://${RAPID_API_HOST}/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': RAPID_API_HOST
        }
    };

    const response = await fetch(url, options);
    const data = await safeJsonFetch(response, "RapidAPI");

    if (!response.ok) {
        throw new Error(data.message || `RapidAPI Error ${response.status}`);
    }

    // Parse Response
    if (data.content && Array.isArray(data.content)) {
        return normalizeTranscriptText(data.content);
    }
    
    if (Array.isArray(data)) {
         return normalizeTranscriptText(data);
    }

    return "Unexpected response format from RapidAPI";
}

// Implementation: Supadata AI
const fetchTranscriptSupadata = async (videoId: string, apiKey: string): Promise<string> => {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const apiUrl = `${SUPADATA_API_URL}/transcript?url=${encodeURIComponent(videoUrl)}&text=true&mode=auto&lang=en`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'x-api-key': apiKey
        }
    });

    // Handle Async Processing (HTTP 202)
    if (response.status === 202) {
        const data = await safeJsonFetch(response, "Supadata (Async)");
        if (!data.jobId) throw new Error("Received 202 but no jobId from Supadata.");
        return await pollSupadataJob(data.jobId, apiKey);
    }

    const data = await safeJsonFetch(response, "Supadata");

    if (!response.ok) {
        throw new Error(data.message || data.error || `Supadata Error ${response.status}`);
    }

    if (data.content !== undefined && data.content !== null) {
        return normalizeTranscriptText(data.content);
    }

    throw new Error("Unexpected response format from Supadata.");
};

// Helper: Poll Supadata Job Status
const pollSupadataJob = async (jobId: string, apiKey: string): Promise<string> => {
    const pollUrl = `${SUPADATA_API_URL}/transcript/${jobId}`;
    let attempts = 0;
    const maxAttempts = 30; // ~60 seconds timeout (2s interval)

    while (attempts < maxAttempts) {
        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch(pollUrl, {
            headers: { 'x-api-key': apiKey }
        });
        
        const data = await safeJsonFetch(response, "Supadata Poll");

        if (data.status === 'completed') {
            return normalizeTranscriptText(data.content);
        }
        
        if (data.status === 'failed') {
            throw new Error(data.error || "Supadata transcription job failed.");
        }

        // If 'queued' or 'active', continue loop
        attempts++;
    }

    throw new Error("Supadata transcription timed out.");
};

// Main Fetch Transcript Function (Router)
export const fetchTranscript = async (
    videoId: string, 
    provider: TranscriptProvider, 
    apiKey?: string
): Promise<string> => {
  try {
    let result: unknown;
    if (provider === 'rapid-api') {
        if (!apiKey) throw new Error("RapidAPI Key is required.");
        result = await fetchTranscriptRapid(videoId, apiKey);
    } else if (provider === 'supadata') {
        if (!apiKey) throw new Error("Supadata API Key is required.");
        result = await fetchTranscriptSupadata(videoId, apiKey);
    } else {
        throw new Error("Invalid Transcription Provider selected.");
    }

    // Explicitly strict string return
    return typeof result === 'string' ? result : String(result || '');

  } catch (error: any) {
    return `Error: ${error.message}`;
  }
};

// Main function to fetch channel videos based on criteria
export const fetchChannelVideos = async (
  channelInput: string,
  limit: number,
  videoType: VideoType,
  apiKey: string,
  onProgress?: (msg: string) => void
): Promise<VideoData[]> => {
  if (onProgress) onProgress(`Resolving channel ID for ${channelInput}...`);
  const channelId = await resolveChannelId(channelInput, apiKey);
  
  if (onProgress) onProgress(`Channel ID resolved: ${channelId}. Searching for videos...`);

  // We fetch more than the limit initially because we might need to filter out shorts/longs
  const searchLimit = Math.min(50, Math.max(limit * 3, 20)); 

  const searchUrl = `${BASE_URL}/search?part=id&channelId=${channelId}&order=viewCount&type=video&maxResults=${searchLimit}&key=${apiKey}`;
  
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (searchData.error) {
    throw new Error(searchData.error.message);
  }

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  const videoIds = searchData.items.map((item: any) => item.id.videoId);
  
  if (onProgress) onProgress(`Found ${videoIds.length} candidate videos. Fetching details...`);
  
  const detailedVideos = await getVideoDetails(videoIds, apiKey);

  // Filter based on type
  if (onProgress) onProgress(`Filtering videos by type: ${videoType}...`);
  const filtered = detailedVideos.filter(video => {
    const seconds = parseDurationToSeconds(video.duration);
    if (videoType === 'short') return seconds <= 60; // Approx definition of Short
    if (videoType === 'video') return seconds > 60;
    return true;
  });

  return filtered.slice(0, limit);
};

// Batch fetch from specific URLs
export const fetchBatchVideos = async (urls: string[], apiKey: string, onProgress?: (msg: string) => void): Promise<VideoData[]> => {
  if (onProgress) onProgress(`Processing ${urls.length} inputs...`);
  
  const ids = urls.map(url => extractVideoId(url)).filter(id => id !== null) as string[];
  const uniqueIds = Array.from(new Set(ids));
  
  if (uniqueIds.length === 0) {
    throw new Error("No valid YouTube video IDs found. Check your links (Supports: watch, shorts, share links).");
  }

  if (onProgress) onProgress(`Found ${uniqueIds.length} unique video IDs. Fetching data from API...`);
  
  return getVideoDetails(uniqueIds, apiKey);
};