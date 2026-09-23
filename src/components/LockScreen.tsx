/**
 * @file LockScreen.tsx
 * @description Apple iOS 18 style Lock Screen for Harmony OS.
 * Features customizable clock typography, widgets row, live music activity player,
 * stacked notifications, interactive flashlight & camera quick actions, swipe-to-unlock gestures,
 * and a secure 4-digit numeric passcode keypad with authentic haptic & audio feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  Wifi, 
  Battery, 
  Flashlight, 
  Camera, 
  Sun, 
  Calendar as CalendarIcon, 
  Activity, 
  Moon, 
  Music, 
  Play, 
  Pause, 
  ChevronUp, 
  X, 
  Delete, 
  Bell, 
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  SystemSettings, 
  SystemNotification, 
  Track, 
  LockScreenClockStyle 
} from '../types';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';
import { WALLPAPER_PRESETS } from './HomeScreenSetupModal';
import { HabeshawiTibebBorder, HabeshawiBrandEmblem } from './HabeshawiIcons';

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  settings: SystemSettings;
  onUpdateSettings?: (updated: Partial<SystemSettings>) => void;
  notifications?: SystemNotification[];
  currentTrack?: Track;
  isPlayingMusic?: boolean;
  onTogglePlayMusic?: () => void;
  wallpaperTheme?: string;
  onOpenControlCenter?: () => void;
  onOpenApp?: (appId: string) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isLocked,
  onUnlock,
  settings,
  onUpdateSettings,
  notifications = [],
  currentTrack,
  isPlayingMusic = false,
  onTogglePlayMusic,
  wallpaperTheme = 'obsidian',
  onOpenControlCenter,
  onOpenApp
}) => {
  // Current time & date
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // View states: 'clock' (ambient lockscreen) or 'keypad' (PIN code entry)
  const [viewMode, setViewMode] = useState<'clock' | 'keypad'>('clock');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isPinError, setIsPinError] = useState<boolean>(false);
  const [isUnlockedAnim, setIsUnlockedAnim] = useState<boolean>(false);
  
  // Flashlight state
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  
  // Notifications expanded state
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState<boolean>(false);
  
  // Forgot passcode helper dialog
  const [showForgotPasscodeModal, setShowForgotPasscodeModal] = useState<boolean>(false);

  // Swipe up gesture tracking
  const touchStartYRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  // Expected passcode
  const targetPasscode = settings.lockScreenPasscode || '1234';
  const passcodeLength = targetPasscode.length || 4;

  // Real-time clock update (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset internal states when locked
  useEffect(() => {
    if (isLocked) {
      setViewMode('clock');
      setEnteredPin('');
      setIsUnlockedAnim(false);
      setIsPinError(false);
      setIsShaking(false);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  // Date formatting
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Ethiopic date representation for Ethiopic clock style
  const ethiopicDateStr = 'ረቡዕ፣ መስከረም 14 • 2019 ዓ.ም';

  // Hours and minutes
  const hoursStr = currentTime.getHours().toString().padStart(2, '0');
  const minutesStr = currentTime.getMinutes().toString().padStart(2, '0');

  // Clock typography styles
  const clockStyle: LockScreenClockStyle = settings.lockScreenClockStyle || 'default';

  const getClockFontClass = () => {
    switch (clockStyle) {
      case 'bold':
        return 'font-black tracking-tighter text-8xl sm:text-9xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]';
      case 'rounded':
        return 'font-bold tracking-tight text-7xl sm:text-8xl rounded-clock drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] font-rounded';
      case 'ethiopic':
        return 'font-bold tracking-tight text-7xl sm:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] font-ethiopic';
      case 'minimal':
        return 'font-extralight tracking-widest text-7xl sm:text-8xl text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]';
      case 'serif':
        return 'font-serif italic font-medium text-7xl sm:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]';
      case 'default':
      default:
        return 'font-bold tracking-tight text-7xl sm:text-8xl text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]';
    }
  };

  // Background Wallpaper matching
  const getWallpaperBackground = () => {
    const isDark = settings.isDarkMode;
    const matched = WALLPAPER_PRESETS.find(p => p.id === wallpaperTheme);
    if (matched) {
      const gradient = isDark ? matched.darkBgClass : matched.lightBgClass;
      return `bg-gradient-to-br ${gradient}`;
    }
    return isDark
      ? 'bg-gradient-to-br from-[#0e1117] via-[#161b22] to-[#0a0d12]'
      : 'bg-gradient-to-br from-[#f1f5f9] via-[#e2e8f0] to-[#f8fafc]';
  };

  // Unlock Trigger
  const triggerUnlock = () => {
    setIsUnlockedAnim(true);
    triggerHaptic('success');
    soundManager.playUnlockSound();
    setTimeout(() => {
      onUnlock();
    }, 280);
  };

  // Handle interaction to initiate unlock (swipe up or tap)
  const handleInitiateUnlock = () => {
    if (settings.lockScreenRequirePasscode) {
      soundManager.playClickSound();
      triggerHaptic('light');
      setViewMode('keypad');
    } else {
      triggerUnlock();
    }
  };

  // Keypad input handler
  const handleDigitPress = (digit: string) => {
    if (enteredPin.length >= passcodeLength) return;

    soundManager.playPasscodeKeyPress();
    triggerHaptic('light');

    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);

    // If completed passcode length, verify immediately
    if (nextPin.length === passcodeLength) {
      if (nextPin === targetPasscode) {
        // Correct passcode!
        setIsUnlockedAnim(true);
        triggerHaptic('success');
        soundManager.playUnlockSound();
        setTimeout(() => {
          onUnlock();
        }, 250);
      } else {
        // Wrong passcode!
        triggerHaptic('error');
        soundManager.playPasscodeError();
        setIsPinError(true);
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setEnteredPin('');
          setIsPinError(false);
        }, 450);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (enteredPin.length === 0) return;
    soundManager.playClickSound();
    triggerHaptic('selection');
    setEnteredPin(prev => prev.slice(0, -1));
  };

  // Toggle Flashlight
  const handleToggleFlashlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isFlashlightOn;
    setIsFlashlightOn(next);
    soundManager.playFlashlightClick(next);
    triggerHaptic('medium');
  };

  // Launch Camera or Photo App
  const handleLaunchCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClickSound();
    triggerHaptic('medium');
    triggerUnlock();
    if (onOpenApp) {
      onOpenApp('harmony-camera');
    }
  };

  // Touch gesture handlers for swipe-up to unlock
  const handleTouchStart = (clientY: number) => {
    touchStartYRef.current = clientY;
    isPointerDownRef.current = true;
  };

  const handleTouchEnd = (clientY: number) => {
    if (!isPointerDownRef.current || touchStartYRef.current === null) return;
    const deltaY = clientY - touchStartYRef.current;
    isPointerDownRef.current = false;
    touchStartYRef.current = null;

    // Upward swipe of > 45px triggers unlock
    if (deltaY < -45) {
      handleInitiateUnlock();
    }
  };

  return (
    <motion.div
      id="habeshawi-lock-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: '-100%', opacity: 0.9, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
      className="fixed inset-0 z-[120] flex flex-col justify-between overflow-hidden select-none touch-none"
      onTouchStart={(e) => handleTouchStart(e.touches[0].clientY)}
      onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientY)}
      onMouseDown={(e) => handleTouchStart(e.clientY)}
      onMouseUp={(e) => handleTouchEnd(e.clientY)}
    >
      {/* Background Wallpaper Container */}
      <div className={`absolute inset-0 transition-all duration-700 ${getWallpaperBackground()} ${
        settings.lockScreenWallpaperBlur ? 'backdrop-blur-xl scale-105' : ''
      }`} />

      {/* Dark Ambient Vignette / Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75 pointer-events-none" />

      {/* Decorative Tibeb Accent Ribbon at the top */}
      <div className="absolute top-0 left-0 right-0 z-30 opacity-70 pointer-events-none">
        <HabeshawiTibebBorder height={3} className="w-full" />
      </div>

      {/* ================= TOP STATUS BAR ================= */}
      <header className="relative z-20 w-full px-6 pt-3 pb-2 flex items-center justify-between text-white text-xs font-semibold">
        {/* Carrier info */}
        <div className="flex items-center gap-1.5 opacity-90">
          <span className="font-bold tracking-tight">Habeshawi</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/15 text-white/90">5G</span>
        </div>

        {/* Center Padlock status */}
        <motion.div
          animate={isUnlockedAnim ? { scale: [1, 1.25, 1], rotate: [0, -10, 0] } : {}}
          className="flex items-center justify-center cursor-pointer"
          onClick={handleInitiateUnlock}
          title="Tap to Unlock"
        >
          {isUnlockedAnim ? (
            <Unlock className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          ) : (
            <Lock className="w-4 h-4 text-white/90 stroke-[2.5]" />
          )}
        </motion.div>

        {/* Right Status Indicators (WiFi, Battery, Control Center Trigger) */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onOpenControlCenter}
          title="Open Control Center"
        >
          <Wifi className="w-3.5 h-3.5 text-white" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono">98%</span>
            <div className="w-5 h-2.5 rounded-sm border border-white/80 p-0.5 flex items-center">
              <div className="w-3.5 h-full bg-emerald-400 rounded-[1px]" />
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN LOCK SCREEN CONTENT ================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-4 pb-2 w-full max-w-md mx-auto overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {viewMode === 'clock' ? (
            /* ================= VIEW 1: CLOCK, WIDGETS & NOTIFICATIONS ================= */
            <motion.div
              key="lock-view-clock"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
              className="w-full flex flex-col items-center text-center space-y-4"
            >
              {/* Top Date Header */}
              {settings.lockScreenShowDate !== false && (
                <div className="text-white/85 text-sm sm:text-base font-medium tracking-wide drop-shadow-md">
                  {clockStyle === 'ethiopic' ? ethiopicDateStr : formattedDate}
                </div>
              )}

              {/* Massive Iconic iOS Clock */}
              <div className="select-none py-1">
                <h1 className={`${getClockFontClass()} text-white select-none leading-none`}>
                  {hoursStr}:{minutesStr}
                </h1>
                {settings.lockScreenOwnerText && (
                  <p className="mt-1.5 text-xs text-white/75 font-medium tracking-wider drop-shadow-sm uppercase">
                    {settings.lockScreenOwnerText}
                  </p>
                )}
              </div>

              {/* Lock Screen Widgets Row */}
              {settings.lockScreenShowWidgets !== false && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 flex-wrap pt-1"
                >
                  {/* Weather Widget Chip */}
                  <div className="px-3 py-1.5 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 text-white flex items-center gap-2 shadow-lg">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <div className="text-left leading-tight">
                      <span className="text-xs font-bold">22°</span>
                      <span className="text-[10px] text-white/70 ml-1">Addis</span>
                    </div>
                  </div>

                  {/* Calendar Widget Chip */}
                  <div className="px-3 py-1.5 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 text-white flex items-center gap-2 shadow-lg">
                    <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />
                    <div className="text-left leading-tight">
                      <span className="text-xs font-semibold">Today</span>
                      <span className="text-[10px] text-white/70 ml-1">Sync</span>
                    </div>
                  </div>

                  {/* Battery Health / Activity Chip */}
                  <div className="px-3 py-1.5 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 text-white flex items-center gap-2 shadow-lg">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold">98%</span>
                  </div>

                  {/* Focus Status Chip */}
                  <div className="px-3 py-1.5 rounded-2xl bg-black/35 backdrop-blur-xl border border-white/15 text-white flex items-center gap-1.5 shadow-lg">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-medium">
                      {settings.focusMode ? 'Focus' : 'Personal'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Live Music Activity Player Card (if track active) */}
              {currentTrack && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mt-3 p-3 rounded-2xl bg-black/45 backdrop-blur-2xl border border-white/20 text-white shadow-2xl flex items-center justify-between gap-3 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 overflow-hidden shrink-0 border border-white/10 relative shadow-md">
                    {currentTrack.coverUrl ? (
                      <img src={currentTrack.coverUrl} alt="Album art" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-900/50">
                        <Music className="w-5 h-5 text-indigo-300" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate">{currentTrack.title}</div>
                    <div className="text-[11px] text-white/70 truncate">{currentTrack.artist}</div>
                    {/* Audio Equalizer visual wave */}
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[12, 18, 8, 22, 14, 20, 10].map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full bg-amber-400 ${isPlayingMusic ? 'animate-pulse' : 'opacity-40'}`}
                          style={{ height: `${isPlayingMusic ? h : 4}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {onTogglePlayMusic && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playClickSound();
                        triggerHaptic('light');
                        onTogglePlayMusic();
                      }}
                      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 border border-white/30 transition-all shadow-md active:scale-95"
                    >
                      {isPlayingMusic ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  )}
                </motion.div>
              )}

              {/* Stacked Notifications Preview List */}
              {settings.lockScreenShowNotifications !== false && notifications.length > 0 && (
                <div className="w-full mt-2 space-y-2">
                  <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-white/75">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3 h-3 text-amber-400" />
                      <span>Notifications ({notifications.length})</span>
                    </div>
                    {notifications.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNotificationsExpanded(!isNotificationsExpanded);
                        }}
                        className="text-[10px] text-amber-300 hover:underline"
                      >
                        {isNotificationsExpanded ? 'Collapse' : 'Show all'}
                      </button>
                    )}
                  </div>

                  {/* Render notification items (up to 2 if collapsed, all if expanded) */}
                  {(isNotificationsExpanded ? notifications : notifications.slice(0, 2)).map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/15 text-left text-white shadow-lg flex items-start gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                        <HabeshawiBrandEmblem size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs font-bold leading-tight">
                          <span className="truncate">{n.title}</span>
                          <span className="text-[10px] font-normal text-white/60 ml-2 shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">{n.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* ================= VIEW 2: APPLE PASSCODE NUMERIC KEYPAD ================= */
            <motion.div
              key="lock-view-keypad"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className="w-full flex flex-col items-center text-center space-y-5 pt-2"
            >
              {/* Keypad Header */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white mb-2 shadow-md">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Enter Passcode</h2>
                <p className="text-xs text-white/70 mt-0.5">
                  Unlock your Habeshawi Super App
                </p>
              </div>

              {/* Passcode Dots with Shake Animation on Error */}
              <motion.div
                animate={isShaking ? { x: [-14, 14, -10, 10, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-4 py-2"
              >
                {Array.from({ length: passcodeLength }).map((_, idx) => {
                  const isFilled = idx < enteredPin.length;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                        isFilled
                          ? isPinError
                            ? 'bg-rose-500 border-rose-500 scale-110 shadow-lg shadow-rose-500/50'
                            : 'bg-white border-white scale-110 shadow-md shadow-white/40'
                          : 'border-white/50 bg-transparent'
                      }`}
                    />
                  );
                })}
              </motion.div>

              {/* 3x4 iOS Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-x-5 gap-y-3.5 w-full max-w-[260px]">
                {[
                  { num: '1', letters: '' },
                  { num: '2', letters: 'ABC' },
                  { num: '3', letters: 'DEF' },
                  { num: '4', letters: 'GHI' },
                  { num: '5', letters: 'JKL' },
                  { num: '6', letters: 'MNO' },
                  { num: '7', letters: 'PQRS' },
                  { num: '8', letters: 'TUV' },
                  { num: '9', letters: 'WXYZ' },
                ].map((item) => (
                  <button
                    key={item.num}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDigitPress(item.num);
                    }}
                    className="w-16 h-16 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/40 border border-white/20 text-white flex flex-col items-center justify-center transition-all shadow-md active:scale-95 mx-auto"
                  >
                    <span className="text-xl font-semibold leading-tight">{item.num}</span>
                    {item.letters && (
                      <span className="text-[8px] font-bold tracking-widest text-white/70 -mt-0.5">
                        {item.letters}
                      </span>
                    )}
                  </button>
                ))}

                {/* Bottom Row: Cancel / Forgot, 0, Backspace */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playClickSound();
                    triggerHaptic('light');
                    setViewMode('clock');
                    setEnteredPin('');
                  }}
                  className="w-16 h-16 rounded-full text-white/80 hover:text-white flex items-center justify-center text-xs font-semibold transition-colors mx-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDigitPress('0');
                  }}
                  className="w-16 h-16 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/40 border border-white/20 text-white flex flex-col items-center justify-center transition-all shadow-md active:scale-95 mx-auto"
                >
                  <span className="text-xl font-semibold leading-tight">0</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDigit();
                  }}
                  className="w-16 h-16 rounded-full text-white/80 hover:text-white flex items-center justify-center transition-colors mx-auto"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Forgot Passcode Helper Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundManager.playClickSound();
                  setShowForgotPasscodeModal(true);
                }}
                className="text-xs text-amber-300 hover:text-amber-200 underline font-medium pt-1"
              >
                Forgot Passcode?
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ================= BOTTOM CONTROLS & UNLOCK AFFORDANCE ================= */}
      <footer className="relative z-20 w-full px-8 pb-5 pt-2 flex flex-col items-center gap-3">
        {/* Quick Action Flashlight & Camera Buttons */}
        <div className="w-full flex items-center justify-between max-w-sm px-2">
          {/* Flashlight Button */}
          <button
            id="lock-btn-flashlight"
            type="button"
            aria-label="Toggle Flashlight"
            onClick={handleToggleFlashlight}
            className={`w-12 h-12 rounded-full border backdrop-blur-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              isFlashlightOn
                ? 'bg-amber-400 text-neutral-900 border-amber-300 shadow-amber-400/50 scale-105'
                : 'bg-black/35 hover:bg-black/50 text-white border-white/25'
            }`}
          >
            <Flashlight className="w-5 h-5" />
          </button>

          {/* Camera Quick Launch Button */}
          <button
            id="lock-btn-camera"
            type="button"
            aria-label="Launch Camera"
            onClick={handleLaunchCamera}
            className="w-12 h-12 rounded-full bg-black/35 hover:bg-black/50 text-white border border-white/25 backdrop-blur-2xl flex items-center justify-center transition-all shadow-xl active:scale-90"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Swipe Up To Unlock Bar & Shimmer Text */}
        <div 
          onClick={handleInitiateUnlock}
          className="flex flex-col items-center cursor-pointer group py-1"
        >
          <div className="flex items-center gap-1.5 text-white/80 group-hover:text-white transition-colors">
            <ChevronUp className="w-4 h-4 animate-bounce text-amber-300" />
            <span className="text-xs font-semibold tracking-wider uppercase drop-shadow-sm">
              {viewMode === 'clock' 
                ? (settings.lockScreenRequirePasscode ? 'Swipe or tap to unlock' : 'Swipe up to unlock')
                : 'Enter your passcode'
              }
            </span>
          </div>

          {/* iOS Bottom Indicator Bar */}
          <div className="w-32 h-1 rounded-full bg-white/70 group-hover:bg-white transition-all mt-1.5 shadow-sm" />
        </div>
      </footer>

      {/* ================= HIGH INTENSITY FLASHLIGHT OVERLAY ================= */}
      <AnimatePresence>
        {isFlashlightOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggleFlashlight}
            className="fixed inset-0 z-[130] bg-white flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
          >
            <div className="w-20 h-20 rounded-full bg-amber-400 text-neutral-900 flex items-center justify-center mb-4 shadow-2xl animate-pulse">
              <Flashlight className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Flashlight ON</h2>
            <p className="text-sm text-neutral-600 mt-1 max-w-xs font-medium">
              Tap anywhere on the screen to turn off the torch
            </p>
            <button
              type="button"
              onClick={handleToggleFlashlight}
              className="mt-6 px-5 py-2.5 rounded-full bg-neutral-900 text-white font-bold text-xs shadow-lg"
            >
              Turn Off
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= FORGOT PASSCODE RESET DIALOG ================= */}
      <AnimatePresence>
        {showForgotPasscodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowForgotPasscodeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#1c1c1e] border border-white/10 p-5 text-white shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Passcode Assistance</h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Default passcode for this device is <span className="font-mono font-bold text-amber-400">1234</span>. 
                  Would you like to reset your passcode to the default and unlock now?
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateSettings) {
                      onUpdateSettings({ lockScreenPasscode: '1234' });
                    }
                    setShowForgotPasscodeModal(false);
                    triggerUnlock();
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-md"
                >
                  Reset to 1234 & Unlock
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPasscodeModal(false)}
                  className="w-full py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
