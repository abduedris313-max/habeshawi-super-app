/**
 * @file VoiceSettingsSheet.tsx
 * @description Settings configuration sheet for Habeshawi Voice Live (Voice selection, Persona, Language).
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, Check, Volume2, Sparkles, Languages, Sliders, Shield } from 'lucide-react';
import { GeminiVoiceName, VoicePersona } from '../types';

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'habeshawi-companion',
    name: 'Habeshawi Cultural Companion',
    description: 'Knowledgeable in Ethiopian & Eritrean history, coffee ceremonies, Ge’ez poetry, and culture.',
    systemInstruction:
      'You are Habeshawi Voice, a warm and cultured conversational assistant in the Habeshawi Super App ecosystem. You understand Ethiopian and Eritrean culture, Ge’ez heritage, and speak with warmth and conciseness.',
    defaultVoice: 'Zephyr',
    icon: '☕',
  },
  {
    id: 'polyglot-translator',
    name: 'Multilingual Polyglot',
    description: 'Instant translation and conversational practice in English, Amharic, Oromo, Tigrinya, and Arabic.',
    systemInstruction:
      'You are a multilingual voice translator. Help the user translate, practice pronunciation, and speak naturally across English, Amharic, Tigrinya, Afaan Oromoo, and Arabic.',
    defaultVoice: 'Kore',
    icon: '🌍',
  },
  {
    id: 'tech-copilot',
    name: 'Engineering & Tech Copilot',
    description: 'Fast, precise reasoning for coding, full-stack architectures, algorithms, and system design.',
    systemInstruction:
      'You are a senior staff engineer voice copilot. Provide crisp, technical, architectural guidance in spoken form.',
    defaultVoice: 'Puck',
    icon: '💻',
  },
  {
    id: 'mindful-coach',
    name: 'Mindful Focus & Solfeggio Guide',
    description: 'Calm, gentle pacing for breathing exercises, study pomodoros, and daily reflection.',
    systemInstruction:
      'You are a calm, mindful voice coach. Guide the user with soothing tones, encouraging words, and thoughtful pacing.',
    defaultVoice: 'Fenrir',
    icon: '🌿',
  },
];

const AVAILABLE_VOICES: { name: GeminiVoiceName; description: string; pitch: string }[] = [
  { name: 'Zephyr', description: 'Warm, natural & balanced (Default)', pitch: 'Medium' },
  { name: 'Kore', description: 'Bright, articulate & soothing', pitch: 'Higher' },
  { name: 'Puck', description: 'Energetic, witty & engaging', pitch: 'Medium-High' },
  { name: 'Charon', description: 'Deep, resonant & authoritative', pitch: 'Low' },
  { name: 'Fenrir', description: 'Calm, warm & steady', pitch: 'Medium-Low' },
];

interface VoiceSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: GeminiVoiceName;
  onSelectVoice: (voice: GeminiVoiceName) => void;
  selectedPersona: VoicePersona;
  onSelectPersona: (persona: VoicePersona) => void;
}

export const VoiceSettingsSheet: React.FC<VoiceSettingsSheetProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  selectedPersona,
  onSelectPersona,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-5 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold">Voice & Persona Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voice Selection (Gemini Prebuilt Voices) */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            Gemini 3.8 Live Voice
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_VOICES.map((v) => (
              <button
                key={v.name}
                onClick={() => onSelectVoice(v.name)}
                className={`flex items-start justify-between p-3 rounded-2xl border text-left transition-all ${
                  selectedVoice === v.name
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-xs'
                    : 'bg-neutral-800/60 border-neutral-700/80 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    {v.name}
                    {selectedVoice === v.name && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{v.description}</div>
                </div>
                {selectedVoice === v.name && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Persona Selection */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Conversational Persona
          </label>
          <div className="space-y-2">
            {VOICE_PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPersona(p);
                  onSelectVoice(p.defaultVoice);
                }}
                className={`w-full flex items-start justify-between p-3 rounded-2xl border text-left transition-all ${
                  selectedPersona.id === p.id
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-xs'
                    : 'bg-neutral-800/60 border-neutral-700/80 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <div className="font-bold text-xs">{p.name}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{p.description}</div>
                  </div>
                </div>
                {selectedPersona.id === p.id && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-1" />}
              </button>
            ))}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/30 transition-all"
        >
          Save & Apply Settings
        </button>
      </motion.div>
    </div>
  );
};
