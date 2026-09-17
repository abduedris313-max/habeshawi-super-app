/**
 * @file HabeshawiLoadingScreen.tsx
 * @description Universal Global Loading Screen & Overlay with authentic Habeshawi aesthetics.
 * Features rotating Lalibela solar halo, Tibeb woven ribbons, Ge'ez numerals,
 * and adaptive Light/Dark styling.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HabeshawiSpinner, HabeshawiTibebBorder, HabeshawiCrossWatermark } from './HabeshawiIcons';
import { Sparkles, X } from 'lucide-react';

export interface HabeshawiLoadingScreenProps {
  isOpen?: boolean;
  title?: string;
  subtitle?: string;
  amharicText?: string;
  progress?: number; // 0 to 100 (optional)
  isFullScreen?: boolean;
  isDarkMode?: boolean;
  onCancel?: () => void;
}

export const HabeshawiLoadingScreen: React.FC<HabeshawiLoadingScreenProps> = ({
  isOpen = true,
  title = 'Habeshawi OS Processing',
  subtitle = 'Synchronizing with Imperial Mesh...',
  amharicText = 'እባክዎ ትንሽ ይጠብቁ...',
  progress,
  isFullScreen = true,
  isDarkMode = true,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`${
          isFullScreen 
            ? 'fixed inset-0 z-[99] flex items-center justify-center p-4 backdrop-blur-xl' 
            : 'w-full h-full min-h-[300px] flex items-center justify-center p-4'
        } select-none ${
          isFullScreen 
            ? (isDarkMode ? 'bg-black/75' : 'bg-stone-900/40') 
            : ''
        }`}
      >
        {/* Main Floating Habeshawi Card */}
        <motion.div
          initial={{ scale: 0.92, y: 12, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 12, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-sm rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center border shadow-2xl overflow-hidden ${
            isDarkMode
              ? 'bg-[#120f0c]/95 border-amber-500/30 text-amber-50 shadow-amber-950/50'
              : 'bg-[#fcfaf4]/98 border-amber-400/60 text-stone-900 shadow-stone-400/30'
          }`}
        >
          {/* Top Decorative Tibeb Ribbon */}
          <div className="absolute top-0 left-0 right-0">
            <HabeshawiTibebBorder height={8} className="w-full opacity-90" />
          </div>

          {/* Background Cross Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <HabeshawiCrossWatermark
              className="w-56 h-56"
              opacity={isDarkMode ? 0.05 : 0.04}
            />
          </div>

          {/* Optional Dismiss/Cancel Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
                isDarkMode 
                  ? 'text-stone-400 hover:text-white hover:bg-white/10' 
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Animated Solar Lalibela Spinner */}
          <div className="my-3 z-10 relative">
            <div className="absolute -inset-3 rounded-full bg-amber-500/20 blur-lg animate-pulse" />
            <HabeshawiSpinner size={64} isDark={isDarkMode} />
          </div>

          {/* Text Information */}
          <div className="space-y-1.5 z-10 mt-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-500 uppercase tracking-widest font-mono">
              <Sparkles className="w-3 h-3" />
              <span>{amharicText}</span>
            </div>

            <h3 className={`text-base sm:text-lg font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}>
              {title}
            </h3>

            <p className={`text-xs font-medium leading-relaxed max-w-[260px] ${
              isDarkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              {subtitle}
            </p>
          </div>

          {/* Optional Progress Bar */}
          {typeof progress === 'number' && (
            <div className="w-full space-y-1.5 mt-5 z-10">
              <div className={`w-full h-2 rounded-full overflow-hidden p-0.5 border ${
                isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-stone-200 border-stone-300'
              }`}>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-500 font-bold">
                <span>ሂደት (Progress)</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Bottom Micro Tibeb Accent */}
          <div className="w-full pt-4 mt-2 border-t border-amber-500/10 flex items-center justify-center gap-2 text-[10px] text-stone-500 font-medium z-10">
            <span>፩</span>
            <span>•</span>
            <span>Habeshawi Core Engine</span>
            <span>•</span>
            <span>፪</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HabeshawiLoadingScreen;
