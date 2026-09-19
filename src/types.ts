/**
 * @file types.ts
 * @description Core TypeScript type definitions for Harmony OS Super App ecosystem.
 */

export interface MiniAppConfig {
  id: string;
  name: string;
  tagline: string;
  iconName: string; // Lucide icon identifier
  iconCdnUrl: string; // Lucide CDN SVG URL
  colorGradient: string; // Tailwind gradient
  bgHex: string;
  deployedUrl: string;
  repoUrl: string;
  description: string;
  badge?: string;
  version?: string;
  author?: string;
  size?: string;
  category?: 'productivity' | 'utilities' | 'finance' | 'audio' | 'ai' | 'developer' | 'health';
  rating?: number;
  downloadsCount?: number;
  isSystemApp?: boolean;
  repositoryId?: string;
  permissions?: string[];
  installedAt?: string;
}

export interface HarmonyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'Personal' | 'Work' | 'Ideas' | 'Drafts';
  tags: string[];
  pinned?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface HarmonyDoc {
  id: string;
  userId: string;
  title: string;
  content: string;
  wordCount: number;
  readingTimeMinutes: number;
  category: string;
  updatedAt: string;
  createdAt: string;
}

export interface HarmonyWritingDraft {
  id: string;
  userId: string;
  title: string;
  content: string;
  targetWordCount: number;
  currentWordCount: number;
  typewriterSound: boolean;
  theme: 'paper' | 'twilight' | 'cyber' | 'sepia';
  updatedAt: string;
  createdAt: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string; // audio source or synthetic synth audio
  genre: string;
}

export interface HarmonyPlaylist {
  id: string;
  userId: string;
  name: string;
  tracks: Track[];
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface HarmonyAiChat {
  id: string;
  userId: string;
  docTitle: string;
  messages: AiChatMessage[];
  updatedAt: string;
}

export interface HarmonyCalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  location?: string;
  // Gregorian anchor ISO date (YYYY-MM-DD)
  gregorianDate: string;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  allDay: boolean;
  color?: string;
  category?: 'Personal' | 'Work' | 'Religious' | 'Holiday' | 'Other';
  // Cached tri-calendar dates
  hijriDate?: string;
  ethiopianDate?: string;
  // Google Calendar integration
  googleEventId?: string;
  syncedToGoogle?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemePreset = 
  | 'habeshawi-gold'
  | 'axum-emerald'
  | 'sheba-crimson'
  | 'lalibela-stone'
  | 'birana-parchment'
  | 'slate' 
  | 'oled' 
  | 'sunset' 
  | 'emerald' 
  | 'lavender';
export type LauncherIconStyle = 'vibrant' | 'tinted' | 'dark-glass' | 'monochrome';
export type LauncherGridDensity = 'spacious' | 'standard' | 'compact';
export type WidgetSize = 'small' | 'medium' | 'large';

export type SystemFontFamily = 'system' | 'ethiopic' | 'sans' | 'geometric' | 'serif' | 'mono' | 'rounded';
export type FontSizeScale = 'compact' | 'standard' | 'large' | 'xlarge';
export type DisplayScale = 'compact' | 'standard' | 'expanded';
export type ColorTemperature = 'standard' | 'warm' | 'cool';

export interface SystemSettings {
  isDarkMode: boolean;
  themeMode?: ThemeMode;
  themePreset?: ThemePreset;
  volume: number;
  brightness: number;
  typewriterSounds: boolean;
  hapticFeedback: boolean;
  defaultViewMode: 'native' | 'iframe'; // 'iframe' loads GitHub Pages deployment, 'native' loads Firebase cloud version
  accentColor: string;
  focusMode: boolean; // Focus Mode: suppresses notifications and mutes non-essential system sounds
  // Dock Configuration
  dockAppIds?: string[]; // Ordered list of app IDs pinned to the dock
  dockMaxSmallScreen?: number; // Maximum apps on small screen (<640px, default: 5)
  dockMaxLargeScreen?: number; // Maximum apps on large screen (>=640px, default: 7)
  // Launcher & Home Screen Personalization
  launcherIconStyle?: LauncherIconStyle;
  launcherGridDensity?: LauncherGridDensity;
  launcherIconArrangement?: 'bottom' | 'top';
  launcherShowLabels?: boolean;
  launcherShowPageDots?: boolean;
  launcherJiggleOnLongPress?: boolean;
  widgetSizes?: Record<string, WidgetSize>;
  // Global Typography & Font Settings
  fontFamily?: SystemFontFamily;
  fontSizeScale?: FontSizeScale;
  boldText?: boolean;
  // Global Display & Visual Accessibility Settings
  displayScale?: DisplayScale;
  nightShift?: boolean;
  colorTemperature?: ColorTemperature;
  highContrast?: boolean;
  reduceTransparency?: boolean;
  reduceMotion?: boolean;
  updatedAt?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  appName?: string;
  icon?: string;
  suppressedByFocus?: boolean;
}

export interface SystemUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface AppRepositorySource {
  id: string;
  name: string;
  url: string;
  description: string;
  isOfficial: boolean;
  appsCount: number;
  lastFetchedAt?: string;
  isEnabled: boolean;
}

export type AppDownloadStatus = 'idle' | 'downloading' | 'installing' | 'installed' | 'error';

