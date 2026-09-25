/**
 * @file types.ts
 * @description Types for Habeshawi Voice Live mini app (Gemini 3.8 Live, Gemini 3.5 Transcribe, Gemini 3.8 Flash).
 */

export type VoiceMode = 'live' | 'transcribe' | 'history';

export type GeminiVoiceName = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

export interface VoiceConversationTurn {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  audioDurationSeconds?: number;
  modelUsed?: 'gemini-3.8-live' | 'gemini-3.5-transcribe' | 'gemini-3.8-flash';
}

export interface VoiceSession {
  id: string;
  title: string;
  createdAt: string;
  mode: VoiceMode;
  voiceName: GeminiVoiceName;
  turns: VoiceConversationTurn[];
  totalDurationSeconds: number;
}

export interface VoicePersona {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  defaultVoice: GeminiVoiceName;
  icon: string;
}

export interface VoiceTranscriptionResult {
  id: string;
  audioBlobUrl?: string;
  transcript: string;
  detectedLanguage?: string;
  durationSeconds: number;
  createdAt: string;
  title: string;
  summary?: string;
  actionItems?: string[];
}
