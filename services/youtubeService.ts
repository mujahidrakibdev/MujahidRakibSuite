import { VideoData, VideoType } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const TRANSCRIPT_API_HOST = 'youtube-transcriptor.p.rapidapi.com';
const TRANSCRIPT_API_URL = `https://${TRANSCRIPT_API_HOST}/transcript`;

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
    viewCount: item.statistics.viewCount,
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails.duration,
    channelTitle: item.snippet.channelTitle,
    transcript: '', 
  }));
};

// Helper: Fetch Transcript from RapidAPI
export const fetchTranscript = async (videoId: string, rapidApiKey: string): Promise<string> => {
  if (!rapidApiKey) return "Error: No RapidAPI Key provided";

  // Use URLSearchParams for safe encoding
  const params = new URLSearchParams();
  params.append('video_id', videoId);
  params.append('lang', 'en'); 

  const url = `${TRANSCRIPT_API_URL}?${params.toString()}`;
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': TRANSCRIPT_API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    
    // Attempt to parse JSON first
    const contentType = response.headers.get("content-type");
    let result: any = null;
    let textBody = "";

    if (contentType && contentType.includes("application/json")) {
      try {
        result = await response.json();
      } catch (e) {
        textBody = "Failed to parse JSON response";
      }
    } else {
      textBody = await response.text();
    }

    if (!response.ok) {
      // Return specific error details
      const errorMsg = result 
        ? (result.message || result.error || result.description || JSON.stringify(result)) 
        : textBody;
      return `Error: ${response.status} - ${errorMsg}`;
    }
    
    // Success Case
    if (result) {
        // CRITICAL FIX: The API returns an array [ { ... } ], so we must check if it's an array and get the first item.
        const data = Array.isArray(result) ? result[0] : result;

        if (!data) return "Error: Empty data received from API";

        if (data.transcriptionAsText) {
            return data.transcriptionAsText;
        } 
        
        if (data.error) {
            return `API Error: ${data.error}`;
        }
        
        // Sometimes valid but no subtitles
        if (data.transcription && Array.isArray(data.transcription) && data.transcription.length === 0) {
            return "No subtitles found for this video";
        }

        return "Error: Valid response but no 'transcriptionAsText' field found.";
    }

    return "Error: Empty response from API";

  } catch (error: any) {
    return `Request Failed: ${error.message}`;
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