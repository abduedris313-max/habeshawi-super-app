/**
 * @file StatusBar.tsx
 * @description Apple HIG Top Status Bar and Dynamic Activity Island for Habeshawi Super App.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, BatteryCharging, Disc, Sparkles, SlidersHorizontal, Moon, Sun, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HarmonyLogo } from './HarmonyLogo';

interface StatusBarProps {
  onOpenControlCenter: () => void;
  onOpenNotificationCenter?: () => void;
  activeMusicTrack?: string;
  isAiThinking?: boolean;
  isFirebaseConnected?: boolean;
  focusMode?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  onOpenControlCenter,
  onOpenNotificationCenter,
  activeMusicTrack,
  isAiThinking,
  isFirebaseConnected = true,
  focusMode = false,
  isDarkMode = true,
  onToggleTheme
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="status-bar"
      className={`w-full h-9 px-3.5 sm:px-6 flex items-center justify-between text-[11px] font-medium z-40 relative backdrop-blur-xl select-none border-b transition-colors ${
        isDarkMode
          ? 'bg-slate-950/75 text-slate-300 border-white/10'
          : 'bg-white/80 text-slate-700 border-slate-200/80'
      }`}
    >
      {/* Left: Brand Identity, Time & Unboxed System Status Metadata */}
      <button
        type="button"
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity min-h-[36px] text-left"
        onClick={onOpenNotificationCenter || onOpenControlCenter}
        title="Open Notification Center"
      >
        <HarmonyLogo size="xs" isDarkMode={isDarkMode} />
        <span className={`font-semibold tracking-tight text-xs tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {timeStr || '09:41'}
        </span>

        <span className={`hidden sm:inline text-[10px] tracking-wider uppercase font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          · HABESHAWI
        </span>

        {focusMode && (
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase text-indigo-400">
            <span>·</span>
            <Moon className="w-2.5 h-2.5" />
            <span className="hidden xs:inline">Focus</span>
          </span>
        )}

        {isFirebaseConnected && (
          <span className={`hidden md:inline text-[10px] font-mono tracking-wider uppercase ${isDarkMode ? 'text-amber-400/90' : 'text-amber-700'}`}>
            · Cloud Synced
          </span>
        )}
      </button>

      {/* Center: Interactive Dynamic Island */}
      <motion.button
        type="button"
        onClick={onOpenControlCenter}
        className="cursor-pointer flex items-center justify-center min-h-[32px]"
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        title="Open Control Center"
      >
        <AnimatePresence mode="wait">
          {activeMusicTrack ? (
            <motion.div
              key="music-pill"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="px-3 py-1 bg-slate-900/95 border border-white/15 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xl"
            >
              <Disc className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="max-w-[120px] sm:max-w-[180px] truncate text-[10px] text-amber-100 font-medium">
                {activeMusicTrack}
              </span>
            </motion.div>
          ) : isAiThinking ? (
            <motion.div
              key="ai-pill"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="px-3 py-1 bg-indigo-950/90 border border-indigo-400/40 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xl"
            >
              <Sparkles className="w-3 h-3 text-indigo-300" />
              <span className="text-[10px] text-indigo-100 font-medium">Copilot Active</span>
            </motion.div>
          ) : (
            <motion.div
              key="default-island"
              className={`h-5 w-24 rounded-full border flex items-center justify-between px-2.5 shadow-inner transition-all hover:w-28 ${
                isDarkMode ? 'bg-black/85 border-white/10' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
              <span className="text-[8px] font-mono tracking-widest uppercase text-slate-400">OS 18</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400/80" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Right: Quick Utilities, Theme Switch & Control Center */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {onOpenNotificationCenter && (
          <button
            type="button"
            onClick={onOpenNotificationCenter}
            className={`p-1.5 rounded-lg transition-colors active:scale-95 flex items-center justify-center ${
              isDarkMode
                ? 'hover:bg-white/10 text-slate-300 hover:text-white'
                : 'hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
            }`}
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        )}

        {onToggleTheme && (
          <button
            id="btn-quick-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg transition-colors active:scale-95 flex items-center justify-center ${
              isDarkMode
                ? 'hover:bg-white/10 text-amber-300 hover:text-amber-200'
                : 'hover:bg-slate-200/70 text-amber-600 hover:text-amber-700'
            }`}
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}

        <div className="hidden xs:flex items-center gap-1.5 pl-1">
          <Wifi className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} />
          <div className="flex items-center gap-0.5 text-[10px] font-mono tabular-nums text-emerald-500">
            <span className="hidden sm:inline">100%</span>
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <button
          id="btn-control-center-trigger"
          type="button"
          onClick={onOpenControlCenter}
          className={`p-1.5 rounded-lg transition-colors active:scale-95 ${
            isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200/70 text-slate-800'
          }`}
          title="Open Control Center"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
