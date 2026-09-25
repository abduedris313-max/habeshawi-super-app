/**
 * @file LiveVoiceOrb.tsx
 * @description Apple iOS HIG inspired fluid glowing voice orb with audio waveform visualizers,
 * multi-color radiance, status badges, and interactive tactile touch controls.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, Square, Sparkles, Radio } from 'lucide-react';
import { GeminiVoiceName } from '../types';

interface LiveVoiceOrbProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
  inputVolume: number;
  outputVolume: number;
  voiceName: GeminiVoiceName;
  onToggleSession: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
}

export const LiveVoiceOrb: React.FC<LiveVoiceOrbProps> = ({
  isConnected,
  isConnecting,
  isSpeaking,
  isListening,
  isMuted,
  inputVolume,
  outputVolume,
  voiceName,
  onToggleSession,
  onToggleMute,
  onInterrupt,
}) => {
  // Determine dominant volume to scale the glow
  const activeVolume = isSpeaking ? outputVolume : isListening && !isMuted ? inputVolume : 0;
  const pulseScale = 1 + activeVolume * 0.45;

  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4 select-none">
      {/* Background ambient radial glow */}
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none transition-all duration-300 blur-3xl opacity-35"
        style={{
          background: isSpeaking
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, rgba(245, 158, 11, 0.4) 50%, transparent 70%)'
            : isConnected
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.6) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(148, 163, 184, 0.25) 0%, transparent 70%)',
          transform: `scale(${pulseScale * 1.2})`,
        }}
      />

      {/* Main Interactive Orb Button */}
      <div className="relative flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60 my-2">
        {/* Outer concentric pulsing acoustic rings */}
        {isConnected && (
          <>
            <motion.div
              animate={{
                scale: [1, 1.25, 1.35],
                opacity: [0.5, 0.2, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full border border-cyan-400/40 pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [1, 1.45, 1.6],
                opacity: [0.4, 0.15, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                delay: 0.6,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-full border border-amber-400/30 pointer-events-none"
            />
          </>
        )}

        {/* Dynamic Glowing Sphere */}
        <motion.button
          onClick={onToggleSession}
          whileTap={{ scale: 0.94 }}
          animate={{
            scale: isConnecting ? [1, 1.05, 1] : pulseScale,
          }}
          transition={{
            scale: isConnecting
              ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
              : { type: 'spring', stiffness: 300, damping: 20 },
          }}
          className={`relative w-44 h-44 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center p-4 shadow-2xl transition-all border ${
            isSpeaking
              ? 'bg-gradient-to-tr from-rose-600 via-amber-500 to-red-500 border-amber-300/60 shadow-rose-500/40 ring-4 ring-rose-400/30'
              : isConnected
              ? isMuted
                ? 'bg-gradient-to-tr from-slate-700 via-neutral-800 to-stone-900 border-neutral-600 shadow-cyan-950/40'
                : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 border-cyan-300/50 shadow-cyan-500/30 ring-4 ring-cyan-400/20'
              : 'bg-gradient-to-tr from-neutral-800 via-neutral-900 to-black border-neutral-700 shadow-black/60 hover:border-amber-400/50'
          }`}
        >
          {/* Glass highlight sheen */}
          <div className="absolute top-2 inset-x-6 h-16 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-[1px] pointer-events-none" />

          {/* Icon inside orb */}
          <div className="relative z-10 flex flex-col items-center justify-center text-white drop-shadow-md">
            {isConnecting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-3 border-white/30 border-t-white"
              />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-pulse" />
            ) : isConnected ? (
              isMuted ? (
                <MicOff className="w-11 h-11 text-neutral-400" />
              ) : (
                <Mic className="w-11 h-11 text-white" />
              )
            ) : (
              <Radio className="w-11 h-11 text-amber-400 group-hover:scale-110 transition-transform" />
            )}

            <span className="mt-2 text-xs font-semibold tracking-wide uppercase drop-shadow">
              {isConnecting
                ? 'Connecting...'
                : isSpeaking
                ? 'Gemini Speaking'
                : isConnected
                ? isMuted
                  ? 'Mic Muted'
                  : 'Listening...'
                : 'Tap to Start'}
            </span>
          </div>
        </motion.button>
      </div>

      {/* Real-time Frequency Waveform Bars */}
      <div className="flex items-center justify-center gap-1.5 h-10 my-2 px-4 py-1 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-inner">
        {[0.3, 0.6, 0.9, 0.4, 0.8, 1.0, 0.7, 0.5, 0.85, 0.45, 0.65].map((multiplier, i) => {
          const barHeight = isConnected
            ? Math.max(6, (isSpeaking ? outputVolume : isListening && !isMuted ? inputVolume : 0.05) * 36 * multiplier)
            : 4;

          return (
            <motion.div
              key={i}
              animate={{ height: `${barHeight}px` }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`w-1 rounded-full transition-colors ${
                isSpeaking
                  ? 'bg-gradient-to-t from-red-500 to-amber-400 shadow-xs shadow-amber-400/50'
                  : isConnected && !isMuted
                  ? 'bg-gradient-to-t from-cyan-400 to-blue-500 shadow-xs shadow-cyan-400/50'
                  : 'bg-neutral-600'
              }`}
              style={{ minHeight: '4px' }}
            />
          );
        })}
      </div>

      {/* Model & Voice Status Pill */}
      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 font-mono text-[11px] text-neutral-300">
          <Sparkles className="w-3 h-3 text-amber-400" />
          gemini-3.8-live
        </span>
        <span className="px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 font-mono text-[11px] text-cyan-300">
          Voice: {voiceName}
        </span>
      </div>

      {/* Control Buttons when Connected (Mute, Barge-in Interrupt, End) */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mt-4"
        >
          {/* Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-xs ${
              isMuted
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isMuted ? 'Unmute Mic' : 'Mute Mic'}
          </button>

          {/* Barge-in Stop (Interrupt model speech) */}
          {isSpeaking && (
            <button
              onClick={onInterrupt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/20 border border-rose-500/50 text-rose-300 text-xs font-medium hover:bg-rose-600/30 transition-colors shadow-xs animate-pulse"
            >
              <Square className="w-3 h-3 fill-rose-300" />
              Interrupt
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onToggleSession}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-colors"
          >
            End Call
          </button>
        </motion.div>
      )}
    </div>
  );
};
