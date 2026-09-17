/**
 * @file ControlCenter.tsx
 * @description iOS 18 Control Center slide-down overlay with Focus Mode toggle,
 * theme appearance synchronization, volume control, and suppressed notifications manager.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Volume2, 
  Sun, 
  Moon, 
  Flame, 
  VolumeX, 
  Github, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Smartphone,
  BellOff,
  Bell,
  Trash2,
  Send
} from 'lucide-react';
import { SystemSettings, SystemNotification, ThemePreset } from '../types';
import { soundManager } from '../lib/soundManager';
import { HabeshawiBrandEmblem, HabeshawiTibebBorder } from './HabeshawiIcons';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (updated: Partial<SystemSettings>) => void;
  isFirebaseConnected: boolean;
  userEmail?: string | null;
  suppressedNotifications: SystemNotification[];
  onClearSuppressedNotifications: () => void;
  onTriggerTestNotification: () => void;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isFirebaseConnected,
  userEmail,
  suppressedNotifications,
  onClearSuppressedNotifications,
  onTriggerTestNotification
}) => {
  const [showNotificationTray, setShowNotificationTray] = useState(false);

  if (!isOpen) return null;

  const isDark = settings.isDarkMode;

  const handleToggleFocusMode = () => {
    const nextState = !settings.focusMode;
    onUpdateSettings({ focusMode: nextState });
    soundManager.playFocusToggleSound(nextState);
  };

  const handleToggleTheme = () => {
    soundManager.playHapticClick();
    const nextDark = !settings.isDarkMode;
    onUpdateSettings({ 
      isDarkMode: nextDark,
      themeMode: nextDark ? 'dark' : 'light'
    });
  };

  const handleSelectThemeMode = (mode: 'dark' | 'light' | 'system', e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playHapticClick();
    let isDarkResolved = settings.isDarkMode;
    if (mode === 'dark') isDarkResolved = true;
    else if (mode === 'light') isDarkResolved = false;
    else {
      isDarkResolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    onUpdateSettings({
      themeMode: mode,
      isDarkMode: isDarkResolved
    });
  };

  const PRESETS: { id: ThemePreset; name: string; accent: string; dot: string }[] = [
    { id: 'habeshawi-gold', name: 'Gold', accent: '#f59e0b', dot: 'bg-amber-500' },
    { id: 'axum-emerald', name: 'Emerald', accent: '#10b981', dot: 'bg-emerald-500' },
    { id: 'sheba-crimson', name: 'Crimson', accent: '#e11d48', dot: 'bg-rose-500' },
    { id: 'lalibela-stone', name: 'Stone', accent: '#ea580c', dot: 'bg-orange-500' },
    { id: 'birana-parchment', name: 'Parchment', accent: '#d97706', dot: 'bg-amber-600' },
    { id: 'slate', name: 'Slate', accent: '#6366f1', dot: 'bg-indigo-500' },
    { id: 'oled', name: 'OLED', accent: '#a855f7', dot: 'bg-purple-500' },
  ];

  const handleSelectThemePreset = (preset: ThemePreset, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playHapticClick();
    const matched = PRESETS.find(p => p.id === preset);
    onUpdateSettings({
      themePreset: preset,
      accentColor: matched?.accent || '#f59e0b'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 px-3 sm:px-4 bg-black/70 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <motion.div
        initial={{ y: -50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl relative my-auto mb-12 border transition-colors overflow-hidden ${
          isDark
            ? 'bg-[#14100c] border-amber-500/30 text-[#e7e5e4]'
            : 'bg-white border-amber-500/30 text-neutral-800 shadow-neutral-500/20'
        }`}
      >
        {/* Top Tibeb Accent Ribbon */}
        <div className="absolute top-0 left-0 right-0">
          <HabeshawiTibebBorder height={6} className="w-full opacity-80" />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b mb-5 pt-1 ${isDark ? 'border-stone-800' : 'border-neutral-200'}`}>
          <div className="flex items-center gap-2.5">
            <HabeshawiBrandEmblem size={28} />
            <div>
              <h3 className={`text-base font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                <span>Habeshawi Control</span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-neutral-500'}`}>
                System Controls, Focus, Themes & Audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900'
            }`}
            aria-label="Close Control Center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Control Tiles (Focus Mode + Appearance) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
          {/* Focus Mode Primary iOS 18 Tile */}
          <button
            id="control-center-focus-toggle"
            onClick={handleToggleFocusMode}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between min-h-[110px] ${
              settings.focusMode
                ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white border-indigo-400/60 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/40'
                : isDark
                ? 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-white'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                settings.focusMode
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {settings.focusMode ? (
                  <Moon className="w-5 h-5 fill-white" />
                ) : (
                  <BellOff className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                settings.focusMode
                  ? 'bg-white/20 text-white border border-white/30'
                  : isDark
                  ? 'bg-[#21262d] text-neutral-400'
                  : 'bg-neutral-200 text-neutral-600'
              }`}>
                {settings.focusMode ? 'Active' : 'Off'}
              </span>
            </div>

            <div className="mt-3">
              <h4 className="text-xs font-bold leading-tight">Focus Mode</h4>
              <p className={`text-[11px] mt-0.5 line-clamp-1 ${
                settings.focusMode
                  ? 'text-indigo-100 font-medium'
                  : isDark
                  ? 'text-[#8b949e]'
                  : 'text-neutral-500'
              }`}>
                {settings.focusMode
                  ? 'Muted & Silenced'
                  : 'Tap to silence sounds'}
              </p>
            </div>
          </button>

          {/* Theme Preference (Dark Mode / Light Mode) */}
          <div
            id="control-center-theme-toggle"
            onClick={handleToggleTheme}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between min-h-[110px] cursor-pointer ${
              isDark
                ? 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d] text-white'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
              }`}>
                {isDark ? (
                  <Moon className="w-5 h-5 text-amber-300" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={(e) => handleSelectThemeMode('light', e)}
                  className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                    !settings.isDarkMode && settings.themeMode !== 'system'
                      ? 'bg-amber-500 text-white'
                      : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Light mode"
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSelectThemeMode('dark', e)}
                  className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                    settings.isDarkMode && settings.themeMode !== 'system'
                      ? 'bg-indigo-600 text-white'
                      : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Dark mode"
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSelectThemeMode('system', e)}
                  className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                    settings.themeMode === 'system'
                      ? 'bg-emerald-600 text-white'
                      : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Auto system mode"
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="mt-2.5">
              <h4 className="text-xs font-bold leading-tight">
                {isDark ? 'Dark Appearance' : 'Light Appearance'}
              </h4>
              <p className={`text-[11px] mt-0.5 line-clamp-1 flex items-center justify-between ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                <span>{settings.themeMode === 'system' ? 'System Mode' : isDark ? 'Obsidian Palette' : 'Daylight Frost'}</span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono capitalize">
                  {settings.themePreset || 'slate'}
                </span>
              </p>

              {/* Theme Preset Quick Selector */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                {PRESETS.map((p) => {
                  const isSelected = (settings.themePreset || 'slate') === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={(e) => handleSelectThemePreset(p.id, e)}
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                          : isDark ? 'bg-black/30 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                      }`}
                      title={`${p.name} theme`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Tiles: Firebase Sync & Source */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
          {/* Firebase Connection Card */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            isDark
              ? 'bg-[#0d1117] border-amber-500/30'
              : 'bg-amber-50/70 border-amber-200 text-neutral-800'
          }`}>
            <div className="flex items-center justify-between">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Firestore Sync
              </span>
            </div>
            <div className="mt-2.5">
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Cross-Device State
              </h4>
              <p className="text-[11px] text-amber-600 dark:text-amber-300/90 font-medium">
                {isFirebaseConnected ? 'Realtime Connected' : 'Local Offline Cache'}
              </p>
              <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                {userEmail || 'Anonymous Account'}
              </p>
            </div>
          </div>

          {/* GitHub Repos Quick Link */}
          <a
            href="https://github.com/abduedris313-max"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all group ${
              isDark
                ? 'bg-[#0d1117] hover:bg-[#21262d] border-[#30363d]'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <Github className={`w-5 h-5 group-hover:scale-110 transition-transform ${isDark ? 'text-white' : 'text-neutral-800'}`} />
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2.5">
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                GitHub Workspace
              </h4>
              <p className={`text-[11px] truncate ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                @abduedris313-max
              </p>
              <p className="text-[10px] text-emerald-500 font-mono mt-0.5">5 Mini Apps</p>
            </div>
          </a>
        </div>

        {/* Sliders & Audio Controls */}
        <div className="space-y-3.5 mb-5">
          {/* Master Volume Control */}
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newVol = settings.volume === 0 ? 0.8 : 0;
                  onUpdateSettings({ volume: newVol });
                  soundManager.setSettings({ volume: newVol });
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-[#21262d] text-white hover:bg-[#30363d]'
                    : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-sm border border-neutral-200'
                }`}
                title={settings.volume === 0 ? 'Unmute' : 'Mute'}
              >
                {settings.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex justify-between items-center text-xs font-medium mb-1">
                  <span className={`flex items-center gap-1.5 ${isDark ? 'text-[#c9d1d9]' : 'text-neutral-700'}`}>
                    <span>Master Audio Volume</span>
                    <span className="text-[10px] text-amber-500/90 font-normal">
                      (Firebase Synced)
                    </span>
                  </span>
                  <span className="font-mono text-xs font-bold">
                    {Math.round(settings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    onUpdateSettings({ volume: vol });
                    soundManager.setSettings({ volume: vol });
                  }}
                  className="w-full accent-indigo-600 bg-neutral-600/30 rounded-lg h-2 cursor-pointer"
                />
              </div>
            </div>

            {/* Focus Mode Audio Suppression Notice */}
            {settings.focusMode && (
              <div className="mt-2.5 pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
                <span className="flex items-center gap-1">
                  <Moon className="w-3 h-3 fill-indigo-400" />
                  <span>Non-essential sounds muted by Focus Mode</span>
                </span>
                <span className="text-[10px] text-neutral-400">Media audio unaffected</span>
              </div>
            )}
          </div>

          {/* Typewriter Sounds Toggle */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
                ⌨️
              </div>
              <div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Typewriter Keystrokes Audio
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                  {settings.focusMode 
                    ? 'Silenced while Focus Mode is active' 
                    : 'Tactile mechanical clicking in Harmony Writing'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.typewriterSounds;
                onUpdateSettings({ typewriterSounds: next });
                soundManager.setSettings({ typewriterSounds: next });
                soundManager.playHapticClick();
              }}
              disabled={settings.focusMode}
              className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                settings.typewriterSounds && !settings.focusMode ? 'bg-emerald-500' : 'bg-[#30363d]'
              } ${settings.focusMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                settings.typewriterSounds && !settings.focusMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Default App View Mode (Native vs GitHub Pages IFrame) */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/20">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Default Runner Mode
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                  Cloud Native vs Live GitHub Pages
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1 p-1 rounded-lg border text-xs ${
              isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-neutral-100 border-neutral-300'
            }`}>
              <button
                onClick={() => onUpdateSettings({ defaultViewMode: 'native' })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  settings.defaultViewMode === 'native'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDark ? 'text-[#8b949e] hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Native
              </button>
              <button
                onClick={() => onUpdateSettings({ defaultViewMode: 'iframe' })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  settings.defaultViewMode === 'iframe'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDark ? 'text-[#8b949e] hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                IFrame
              </button>
            </div>
          </div>
        </div>

        {/* Focus Mode Diagnostics & Notification Simulation */}
        <div className={`p-4 rounded-xl border mb-5 ${
          isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Focus Mode & Notifications
              </h4>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              settings.focusMode
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-neutral-500/20 text-neutral-400'
            }`}>
              {suppressedNotifications.length} Silenced
            </span>
          </div>

          <p className={`text-xs mb-3 ${isDark ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
            {settings.focusMode ? (
              <span className="text-indigo-400 font-medium">
                Focus Mode is actively suppressing banner popups and audio chimes. Notifications are logged silently below.
              </span>
            ) : (
              <span>
                Standard mode active. Incoming events display animated iOS banners and play harmonic chimes.
              </span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerTestNotification}
              className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow transition-colors active:scale-95"
            >
              <Send className="w-3 h-3" />
              <span>Send Test Notification</span>
            </button>
            {suppressedNotifications.length > 0 && (
              <button
                onClick={onClearSuppressedNotifications}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  isDark
                    ? 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white'
                    : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                }`}
                title="Clear Silenced Notifications"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Silenced Notifications Drawer */}
          {suppressedNotifications.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-700/50 space-y-1.5 max-h-36 overflow-y-auto">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Silenced by Focus Mode:
              </span>
              {suppressedNotifications.slice(0, 4).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-2 rounded-lg text-xs border flex items-start justify-between gap-2 ${
                    isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold truncate text-[11px] ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {notif.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">{notif.message}</p>
                  </div>
                  <span className="text-[9px] text-indigo-400 shrink-0 font-mono mt-0.5">
                    {notif.appName || 'Harmony'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`text-center text-xs pt-2 border-t flex items-center justify-between ${
          isDark ? 'text-[#8b949e]' : 'text-neutral-500'
        } ${isDark ? 'border-[#30363d]' : 'border-neutral-200'}`}>
          <span>Habeshawi Super App</span>
          <span className="font-mono text-[10px]">v2.5 • Firestore Sync Active</span>
        </div>
      </motion.div>
    </div>
  );
};
