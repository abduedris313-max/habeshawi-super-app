/**
 * @file MusicWidget.tsx
 * @description iOS Smart Stack widget displaying the active track, playback controls & ambient soundscapes with S/M/L modes.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Disc, ChevronRight, Play, Pause, SkipForward, SkipBack, Sparkles, Volume2, Radio } from 'lucide-react';
import { Track } from '../../types';
import { WidgetSize } from './types';
import { WidgetSizeSelector } from './WidgetSizeSelector';
import { soundManager } from '../../lib/soundManager';

interface MusicWidgetProps {
  currentTrack: Track | null;
  isPlayingMusic: boolean;
  onTogglePlayMusic: () => void;
  onOpenApp: (appId: string) => void;
  isDarkMode?: boolean;
  size?: WidgetSize;
  onResize?: (size: WidgetSize) => void;
}

const AMBIENT_PRESETS = [
  { id: 'focus', name: 'Deep Focus', genre: 'Alpha Waves 432Hz', emoji: '🧠', gradient: 'from-indigo-600 to-blue-700' },
  { id: 'lofi', name: 'Lo-Fi Chill', genre: 'Vinyl Cafe Beats', emoji: '☕', gradient: 'from-amber-600 to-orange-700' },
  { id: 'rain', name: 'Rainy Studio', genre: 'Gentle Rain & Thunder', emoji: '🌧️', gradient: 'from-teal-600 to-emerald-700' },
  { id: 'synth', name: 'Midnight Synth', genre: 'Retrowave Dreams', emoji: '🌃', gradient: 'from-fuchsia-600 to-purple-800' },
];

export const MusicWidget: React.FC<MusicWidgetProps> = ({
  currentTrack,
  isPlayingMusic,
  onTogglePlayMusic,
  onOpenApp,
  isDarkMode = true,
  size = 'small',
  onResize
}) => {
  const [activeMood, setActiveMood] = useState<string>('focus');

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.01 }}
      className={`p-2.5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
        size === 'large' 
          ? 'min-h-[210px] sm:min-h-[230px]' 
          : size === 'medium'
            ? 'min-h-[96px] sm:min-h-[110px]'
            : 'min-h-[96px] sm:min-h-[110px]'
      } ${
        isDarkMode
          ? 'bg-[#161b22] border-[#30363d] hover:border-fuchsia-500/60 shadow-black/40'
          : 'bg-white/90 border-neutral-200 hover:border-fuchsia-400 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 text-fuchsia-500 font-semibold text-[10px] sm:text-[11px] tracking-wide">
          <Disc className={`w-3.5 h-3.5 ${isPlayingMusic ? 'animate-spin-slow' : ''}`} />
          <span className="font-bold">HABESHAWI AUDIO</span>
        </div>

        <div className="flex items-center gap-1.5">
          <WidgetSizeSelector size={size} onResize={onResize} isDarkMode={isDarkMode} />
          <button
            onClick={() => onOpenApp('harmony-music-player')}
            className={`text-[10px] flex items-center gap-0.5 transition-colors font-medium ${
              isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Open <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* ================= SMALL SIZE ================= */}
      {size === 'small' && (
        <>
          <div className="my-1 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 border border-white/20">
              🎵
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-[11px] truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                {currentTrack ? currentTrack.title : 'Ambient Study Waves'}
              </p>
              <p className={`text-[9px] truncate ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {currentTrack ? currentTrack.artist : 'Harmony Studio'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClickSound();
                onTogglePlayMusic();
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              {isPlayingMusic ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>
          </div>

          <div className={`px-2 py-0.5 rounded-lg border text-[8px] flex items-center justify-between ${
            isDarkMode ? 'bg-[#0d1117] border-[#30363d] text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
          }`}>
            <span className="truncate">Lossless 24-bit</span>
            <span className={isPlayingMusic ? 'text-fuchsia-400 font-bold' : 'text-neutral-400'}>
              {isPlayingMusic ? '● Playing' : '○ Paused'}
            </span>
          </div>
        </>
      )}

      {/* ================= MEDIUM SIZE ================= */}
      {size === 'medium' && (
        <>
          <div className="my-1 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 border border-white/20">
              🎵
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-xs truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                {currentTrack ? currentTrack.title : 'Ambient Study Waves'}
              </p>
              <p className={`text-[10px] truncate ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {currentTrack ? currentTrack.artist : 'Harmony Studio'} • Spatial Audio
              </p>

              {/* Animated waveform bars */}
              <div className="flex items-center gap-0.5 mt-1 h-3">
                {[40, 75, 55, 90, 65, 80, 45, 100, 70, 50, 85, 60].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlayingMusic ? 'bg-fuchsia-500 animate-pulse' : 'bg-neutral-500/30'
                    }`}
                    style={{ height: isPlayingMusic ? `${h}%` : '20%' }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playClickSound();
                  onTogglePlayMusic();
                }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                {isPlayingMusic ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
            </div>
          </div>

          <div className={`px-2 py-0.5 rounded-lg border text-[9px] flex items-center justify-between ${
            isDarkMode ? 'bg-[#0d1117] border-[#30363d] text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
          }`}>
            <span className="flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-fuchsia-400" />
              <span>Hi-Res Lossless 96kHz</span>
            </span>
            <span className={isPlayingMusic ? 'text-fuchsia-400 font-bold' : 'text-neutral-400'}>
              {isPlayingMusic ? 'Now Streaming' : 'Ready to Play'}
            </span>
          </div>
        </>
      )}

      {/* ================= LARGE SIZE ================= */}
      {size === 'large' && (
        <div className="flex-1 flex flex-col justify-between gap-2 mt-1">
          {/* Active Track Banner */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
            isDarkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-md shrink-0 border border-white/20">
              🎵
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-xs sm:text-sm truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                {currentTrack ? currentTrack.title : 'Ambient Study Waves'}
              </p>
              <p className={`text-[10px] truncate ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {currentTrack ? currentTrack.artist : 'Harmony Studio'} • 24-bit Lossless
              </p>
              
              {/* Animated waveform bars */}
              <div className="flex items-center gap-0.5 mt-1.5 h-3.5">
                {[30, 80, 50, 95, 60, 85, 40, 100, 75, 45, 90, 65, 35, 70, 85, 50, 90, 40].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlayingMusic ? 'bg-fuchsia-500 animate-pulse' : 'bg-neutral-500/30'
                    }`}
                    style={{ height: isPlayingMusic ? `${h}%` : '20%' }}
                  />
                ))}
              </div>
            </div>

            {/* Playback Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClickSound();
                onTogglePlayMusic();
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              {isPlayingMusic ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
          </div>

          {/* Quick Ambient Soundscape Moods */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 px-0.5">
              <span>Quick Ambient Moods</span>
              <span className="text-[9px] text-fuchsia-400 font-semibold">1-Tap Stream</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {AMBIENT_PRESETS.map((preset) => {
                const isCurrent = activeMood === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      soundManager.playClickSound();
                      setActiveMood(preset.id);
                      if (!isPlayingMusic) onTogglePlayMusic();
                    }}
                    className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isCurrent
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-400'
                        : isDarkMode ? 'bg-[#0d1117] border-[#30363d] hover:border-neutral-600' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-sm">{preset.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate">{preset.name}</p>
                      <p className="text-[8px] text-neutral-400 truncate">{preset.genre}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
