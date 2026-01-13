export interface VideoData {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
  duration: string; // ISO 8601 format
  channelTitle: string;
  transcript?: string; // Placeholder for future feature
}

export type ScrapeMode = 'single-channel' | 'multi-channel' | 'single-video';

export type VideoType = 'video' | 'short' | 'any';

export interface ScrapeSettings {
  mode: ScrapeMode;
  input: string; // URL or Handle or List of URLs
  limit: number;
  videoType: VideoType;
}

export interface ApiError {
  message: string;
  code?: number;
}
