/**
 * @file HabeshawiSplashScreen.tsx
 * @description Authentic Habeshawi Boot & Splash Screen for Habeshawi SuperApp OS.
 * Features an animated golden Lalibela cross with radiant sunburst aura,
 * traditional Tibeb woven progress thread, Amharic Ge'ez typography, and audio-haptic feedback.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Volume2, ShieldCheck, Sun, Moon } from 'lucide-react';
import { HabeshawiBrandEmblem, HabeshawiTibebBorder, HabeshawiCrossWatermark } from './HabeshawiIcons';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';

interface HabeshawiSplashScreenProps {
  onComplete: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const HabeshawiSplashScreen: React.FC<HabeshawiSplashScreenProps> = ({
  onComplete,
  isDarkMode = true,
  onToggleTheme
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('በመጫን ላይ... (Initializing Habeshawi Kernel)');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Play subtle soft boot audio chime
    soundManager.playAppLaunchSound();
    triggerHaptic('medium');

    const statusStages = [
      { p: 20, t: 'የላሊበላ ስነ-ስርዓት በመጫን ላይ... (Loading Lalibela Framework)' },
      { p: 45, t: 'የአክሱም ውሂብ ዝውውር በማስተካከል ላይ... (Connecting Axum Data Mesh)' },
      { p: 70, t: 'የብራና ማከማቻ በማመሳሰል ላይ... (Syncing Birana Storage Engine)' },
      { p: 90, t: 'የጥበብ ስነ-ንድፍ በማዘጋጀት ላይ... (Applying Tibeb Visual Engine)' },
      { p: 100, t: 'እንኳን ደህና መጡ! (Welcome to Habeshawi OS)' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < statusStages.length) {
        setProgress(statusStages[currentStage].p);
        setStatusText(statusStages[currentStage].t);
        currentStage++;
        if (currentStage === statusStages.length) {
          setIsReady(true);
          triggerHaptic('success');
        }
      } else {
        clearInterval(interval);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    soundManager.playHapticClick();
    triggerHaptic('light');
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden ${
        isDarkMode
          ? 'bg-[#0a0806] text-amber-50'
          : 'bg-[#fcfaf4] text-stone-900'
      }`}
    >
      {/* Background Decorative Cross Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <HabeshawiCrossWatermark
          className="w-[500px] h-[500px] sm:w-[700px] sm:h-[700px]"
          opacity={isDarkMode ? 0.04 : 0.06}
        />
      </div>

      {/* Radiant Background Ambient Gold Aura */}
      <div 
        className={`absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${
          isDarkMode 
            ? 'bg-amber-500/15' 
            : 'bg-amber-400/20'
        }`}
      />

      {/* Top Header Row with Theme Toggle & Status Badge */}
      <div className="w-full max-w-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-colors shadow-xs ${
          isDarkMode 
            ? 'bg-stone-900/80 border-amber-500/20 text-amber-300/90' 
            : 'bg-white/80 border-amber-700/20 text-stone-700'
        }">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>v2.4 Imperial Edition</span>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-full border transition-all cursor-pointer backdrop-blur-md ${
              isDarkMode
                ? 'bg-stone-900/80 border-stone-800 text-amber-400 hover:bg-stone-800'
                : 'bg-white/80 border-stone-200 text-stone-700 hover:bg-stone-100 shadow-xs'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Main Animated Center Emblem & Typography */}
      <div className="flex flex-col items-center text-center max-w-md z-10 my-auto space-y-6">
        {/* Glowing Lalibela Sunburst Emblem */}
        <motion.div
          initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.9, type: 'spring', bounce: 0.4 }}
          className="relative group cursor-pointer"
        >
          {/* Outer Sunburst Pulse Ring */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-600/20 blur-xl animate-pulse" />
          
          <div className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-3 flex items-center justify-center border shadow-2xl ${
            isDarkMode
              ? 'bg-gradient-to-br from-stone-900 via-[#181410] to-[#0d0a08] border-amber-500/40 shadow-amber-950/40'
              : 'bg-gradient-to-br from-white via-amber-50/50 to-amber-100/40 border-amber-400/60 shadow-amber-600/10'
          }`}>
            <HabeshawiBrandEmblem className="w-full h-full drop-shadow-lg" />
          </div>
        </motion.div>

        {/* Title and Ge'ez Fidel Greeting */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-widest font-mono">
              ✦ ሐበሻዊ ✦
            </span>
          </div>

          <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${
            isDarkMode ? 'text-white' : 'text-stone-900'
          }`}>
            Habeshawi <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">OS</span>
          </h1>

          <p className={`text-xs sm:text-sm font-medium max-w-xs mx-auto leading-relaxed ${
            isDarkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>
            የተቀናጀ የዲጂታል ሥነ-ምህዳር • Imperial SuperApp Ecosystem
          </p>
        </motion.div>
      </div>

      {/* Bottom Progress & Launch Action Area */}
      <div className="w-full max-w-md z-10 flex flex-col items-center space-y-4">
        {/* Tibeb Top Border Accent */}
        <div className="w-full px-4">
          <HabeshawiTibebBorder height={10} className="w-full opacity-80" />
        </div>

        {/* Progress Bar with Gold Glowing Head */}
        <div className="w-full space-y-2 px-2">
          <div className={`w-full h-2 rounded-full overflow-hidden p-0.5 border ${
            isDarkMode
              ? 'bg-stone-900/90 border-stone-800'
              : 'bg-stone-200/90 border-stone-300'
          }`}>
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-sm"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Status Subtitle & Percentage */}
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className={`truncate max-w-[280px] ${
              isDarkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              {statusText}
            </span>
            <span className="font-bold text-amber-500">{progress}%</span>
          </div>
        </div>

        {/* Enter Button or Auto-loading Indicator */}
        <AnimatePresence mode="wait">
          {isReady ? (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleEnter}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-98 transition-all cursor-pointer border border-amber-300"
            >
              <span>ወደ ሥርዓቱ ይግቡ • Enter Habeshawi</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <div className="h-12 flex items-center justify-center">
              <span className={`text-xs flex items-center gap-2 ${
                isDarkMode ? 'text-stone-500' : 'text-stone-400'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                ሲስተሙን በማዘጋጀት ላይ...
              </span>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Trademarks */}
        <div className="flex items-center gap-4 text-[10px] text-stone-500 font-medium pt-2">
          <span>Axumite Cloud</span>
          <span>•</span>
          <span>Lalibela Security</span>
          <span>•</span>
          <span>Ge'ez Unicode 15.0</span>
        </div>
      </div>
    </motion.div>
  );
};

export default HabeshawiSplashScreen;
