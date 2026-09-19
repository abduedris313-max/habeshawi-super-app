/**
 * @file OnboardingModal.tsx
 * @description First-time user onboarding and welcome tour for Harmony Super App.
 * Walks through feature highlights, initial home screen personalization (theme & pinned apps),
 * optional user authentication, and iOS navigation gestures.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Moon, 
  Sun, 
  Monitor, 
  Sliders, 
  ShieldCheck, 
  User, 
  Flame, 
  Smartphone, 
  Search, 
  Layers, 
  Compass,
  LayoutGrid,
  CheckCircle2,
  X
} from 'lucide-react';
import { HarmonyLogo } from './HarmonyLogo';
import { HARMONY_APPS } from '../config/apps';
import { SystemSettings, ThemeMode, SystemUser } from '../types';
import { AVAILABLE_WIDGETS, HomeWidgetId } from './widgets/types';
import { soundManager } from '../lib/soundManager';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (updated: Partial<SystemSettings>) => void;
  pinnedAppIds: string[];
  onUpdatePinnedApps: (apps: string[]) => void;
  currentUser: SystemUser | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onFinish: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  pinnedAppIds,
  onUpdatePinnedApps,
  currentUser,
  onOpenAuth,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Habeshawi',
      subtitle: 'Your Unified Cultural & Productivity Ecosystem',
    },
    {
      id: 'appearance',
      title: 'Personalize Your Experience',
      subtitle: 'Theme, Appearance & Accents',
    },
    {
      id: 'apps',
      title: 'Home Screen Setup',
      subtitle: 'Choose your springboard apps & widgets',
    },
    {
      id: 'account',
      title: 'Optional Cloud Account',
      subtitle: 'Synchronize seamlessly across all devices',
    },
    {
      id: 'gestures',
      title: 'Quick Gestures & Shortcuts',
      subtitle: 'Navigate Habeshawi like a pro',
    }
  ];

  const handleNext = () => {
    soundManager.playClickSound();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    soundManager.playClickSound();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    soundManager.playNotificationChime();
    onFinish();
    onClose();
  };

  const isDark = settings.isDarkMode;

  const toggleAppPin = (appId: string) => {
    soundManager.playHapticClick();
    if (pinnedAppIds.includes(appId)) {
      if (pinnedAppIds.length <= 2) return; // Keep at least 2 apps
      onUpdatePinnedApps(pinnedAppIds.filter(id => id !== appId));
    } else {
      onUpdatePinnedApps([...pinnedAppIds, appId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-2xl animate-fade-in">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative border overflow-hidden transition-colors flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]'
            : 'bg-white border-neutral-200 text-neutral-800 shadow-2xl'
        }`}
      >
        {/* Top Progress & Skip Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-inherit mb-4">
          {/* Step Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                style={{
                  backgroundColor: idx <= currentStep ? (settings.accentColor || '#6366f1') : undefined
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6'
                    : idx < currentStep
                    ? 'w-2.5 opacity-60'
                    : isDark ? 'w-2 bg-[#30363d]' : 'w-2 bg-neutral-200'
                }`}
                title={step.title}
              />
            ))}
          </div>

          <button
            onClick={handleComplete}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
              isDark ? 'text-[#8b949e] hover:text-white hover:bg-[#21262d]' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            Skip to Home
          </button>
        </div>

        {/* Step Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-none py-2">
          <AnimatePresence mode="wait">
            {/* STEP 0: WELCOME */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-4 space-y-4"
              >
                <div className="flex justify-center my-2">
                  <HarmonyLogo size="xl" isDarkMode={isDark} />
                </div>

                <div className="space-y-1">
                  <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Welcome to Habeshawi
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                    Your cultural & productivity Super App ecosystem. Everything you create, study, plan, and play in one beautifully unified environment.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
                  <div className={`p-3 rounded-2xl border ${
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-1.5">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      Integrated Mini-Apps
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                      Notes, Docs, Writing, Music, Finance & AI chat in a unified frame.
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      Offline-First & Fast
                    </h4>
                    <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                      Zero load lag. Works 100% offline with optional instant cloud sync.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: APPEARANCE & THEME */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-2"
              >
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Choose Your Appearance
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                    Select how Habeshawi looks across your desktop and mobile displays.
                  </p>
                </div>

                {/* Theme Mode Selector */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Deep Obsidian' },
                    { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean Minimal' },
                    { id: 'system', label: 'Auto System', icon: Monitor, desc: 'Match OS' },
                  ].map(mode => {
                    const Icon = mode.icon;
                    const isSelected = settings.themeMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => onUpdateSettings({ 
                          themeMode: mode.id as ThemeMode,
                          isDarkMode: mode.id === 'dark' ? true : mode.id === 'light' ? false : (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                        })}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 relative ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30'
                            : isDark
                            ? 'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]'
                            : 'bg-neutral-50 border-neutral-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-indigo-500 text-white' : isDark ? 'bg-[#21262d] text-[#8b949e]' : 'bg-white text-neutral-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-400' : isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {mode.label}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                          {mode.desc}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Accent Color Palette */}
                <div className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <label className={`text-xs font-bold block mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { color: '#8b5cf6', name: 'Harmony Purple', preset: 'oled' },
                      { color: '#3b82f6', name: 'Electric Blue', preset: 'slate' },
                      { color: '#10b981', name: 'Emerald', preset: 'axum-emerald' },
                      { color: '#f59e0b', name: 'Amber', preset: 'habeshawi-gold' },
                      { color: '#ec4899', name: 'Rose', preset: 'sheba-crimson' },
                    ].map(acc => (
                      <button
                        key={acc.color}
                        onClick={() => onUpdateSettings({ accentColor: acc.color, themePreset: acc.preset as any })}
                        style={{ backgroundColor: acc.color }}
                        className="w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 relative"
                        title={acc.name}
                      >
                        {settings.accentColor === acc.color && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: HOME SCREEN SETUP */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-2"
              >
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Home Screen Setup
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                    Select which apps appear pinned on your Springboard launcher. Unpinned apps remain instantly accessible in App Store and Spotlight.
                  </p>
                </div>

                {/* Springboard Apps Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HARMONY_APPS.map(app => {
                    const isPinned = pinnedAppIds.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => toggleAppPin(app.id)}
                        className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 relative ${
                          isPinned
                            ? 'bg-indigo-600/15 border-indigo-500/60'
                            : isDark
                            ? 'bg-[#0d1117] border-[#30363d] opacity-50'
                            : 'bg-neutral-50 border-neutral-200 opacity-60'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md"
                          style={{ backgroundColor: app.bgHex }}
                        >
                          {app.name.slice(0, 2)}
                        </div>
                        <span className={`text-xs font-bold truncate max-w-full ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {app.name}
                        </span>
                        {isPinned && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-[#0d1117] border-[#30363d] text-[#8b949e]' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                }`}>
                  <span>Pinned Apps: <strong>{pinnedAppIds.length}</strong></span>
                  <span className="text-[11px] text-indigo-400">You can customize the dock anytime from Settings</span>
                </div>
              </motion.div>
            )}

            {/* STEP 3: OPTIONAL ACCOUNT & CLOUD */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-2"
              >
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Optional Cloud Sync
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                    Habeshawi is completely functional without an account. Choose how you'd like to use Habeshawi.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option A: Continue as Guest */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    !currentUser || currentUser.isAnonymous
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            Guest Mode (No Account)
                          </h4>
                          <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                            Data is saved securely in your browser's local cache.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                        Default
                      </span>
                    </div>
                  </div>

                  {/* Option B: Registered Firebase Account */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    currentUser && !currentUser.isAnonymous
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            Firebase Cloud Account
                          </h4>
                          <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                            Real-time sync across your phone, tablet, and computer.
                          </p>
                        </div>
                      </div>
                    </div>

                    {currentUser && !currentUser.isAnonymous ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mt-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Signed in as {currentUser.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => onOpenAuth('signup')}
                          style={{
                            backgroundColor: settings.accentColor || '#6366f1'
                          }}
                          className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-sm transition-all hover:brightness-110 active:scale-95"
                        >
                          Create Account
                        </button>
                        <button
                          onClick={() => onOpenAuth('signin')}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                            isDark ? 'bg-[#21262d] text-white border-[#30363d] hover:bg-[#30363d]' : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: GESTURES & SHORTCUTS */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-2"
              >
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Quick Gestures & Shortcuts
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                    Master your Habeshawi workspace with fast iOS 18 interactions.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          Universal Spotlight
                        </h4>
                        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">⌘K</kbd>
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                        Search across all mini apps, notes, docs, and drafts in milliseconds.
                      </p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Floating Bottom Dock & Jiggle Mode
                      </h4>
                      <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                        Persistent dock with 5 apps on mobile & 7 on desktop. Long-press or click the edit icon to reorder.
                      </p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Dynamic Island & Control Center
                      </h4>
                      <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                        Tap the top status bar or Dynamic Island pill to trigger Focus Mode and volume controls.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Controls */}
        <div className="pt-4 border-t border-inherit flex items-center justify-between mt-2">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 ${
                isDark ? 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d]' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            style={{
              backgroundColor: settings.accentColor || '#6366f1',
              boxShadow: `0 4px 14px 0 ${settings.accentColor ? settings.accentColor + '55' : 'rgba(99,102,241,0.35)'}`
            }}
            className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:brightness-105 active:scale-95"
          >
            <span>{currentStep === steps.length - 1 ? 'Enter Habeshawi' : 'Continue'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
