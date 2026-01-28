export interface VideoData {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
  publishedAt: string;
  duration: string; // ISO 8601 format
  channelTitle: string;
  channelId?: string;
  tags?: string[];
  description?: string;
  categoryId?: string;
  transcript?: string; // Placeholder for future feature
  
  // Computed for Analysis
  engagementRate?: number;
  viralityScore?: number;
  rank?: number;
}

export type ScrapeMode = 
  | 'single-video' 
  | 'multi-channel' 
  | 'single-channel'
  | 'analyze-single'
  | 'analyze-multi';

export type VideoType = 'video' | 'short' | 'any';

export type TranscriptProvider = 'rapid-api' | 'supadata';

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