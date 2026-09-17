/**
 * Harmony Music Player - Core Type Definitions
 */

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl?: string; // URL or Blob URL
  audioFreq?: number; // fallback synthesizer frequency if pure tone
  isLocal?: boolean;
  fileId?: string; // Key in IndexedDB
  addedAt: number;
  genre?: string;
  sizeBytes?: number;
}

export interface PlaylistData {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type ViewTab = 'player' | 'library' | 'playlists' | 'equalizer' | 'upload';

export type VisualizerMode = 'bars' | 'wave' | 'pulse' | 'none';

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 5 bands: [60Hz, 230Hz, 910Hz, 4kHz, 14kHz]
}
