export type SermonType = 'video' | 'audio';
export type SermonStatus = 'draft' | 'published' | 'archived';

export interface Speaker {
  id: string;
  name: string;
  bio?: string;
  photoUrl?: string;
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  text?: string;
}

export interface SermonSeries {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  startDate: Date;
  endDate?: Date;
}

export interface SermonResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'document';
  url: string;
}

export interface Sermon {
  id: string;
  title: string;
  description: string;
  type: SermonType;
  
  // Media
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  
  // Metadata
  speaker: Speaker;
  date: Date;
  seriesId?: string;
  series?: SermonSeries;
  scriptureReferences: ScriptureReference[];
  tags: string[];
  
  // Resources
  resources: SermonResource[];
  
  // Engagement
  viewCount: number;
  favoriteCount: number;
  status: SermonStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface SermonNote {
  id: string;
  userId: string;
  sermonId: string;
  content: string;
  timestamp?: number; // playback position in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface SermonProgress {
  userId: string;
  sermonId: string;
  position: number; // in seconds
  completed: boolean;
  lastWatchedAt: Date;
}

export interface SermonFavorite {
  userId: string;
  sermonId: string;
  createdAt: Date;
}

export interface SermonDownload {
  sermonId: string;
  userId: string;
  filePath: string;
  fileSize: number;
  quality: 'high' | 'medium' | 'low';
  downloadedAt: Date;
}

// Filter & Sort types
export type SermonFilter = 'all' | 'video' | 'audio' | 'recent' | 'series';
export type SermonSort = 'newest' | 'oldest' | 'popular' | 'alphabetical';

export interface SermonFilters {
  filter: SermonFilter;
  sort: SermonSort;
  seriesId?: string;
  speakerId?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
