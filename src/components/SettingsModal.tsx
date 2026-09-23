/**
 * @file SettingsModal.tsx
 * @description Native Mobile Device Settings App for Harmony OS Super App.
 * Built following Apple iOS Human Interface Guidelines (HIG) with full Home Screen & Launcher customization,
 * Display & Brightness, Sounds & Haptics, Cloud Sync, and PWA installation.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, Github, ExternalLink, ShieldCheck, Download, Smartphone, 
  Flame, Info, Moon, Sun, Monitor, Volume2, BellOff, Check, Palette,
  Sliders, ArrowUp, ArrowDown, RotateCcw, Eye, EyeOff, Flashlight, Camera, Smartphone as MobileIcon, Laptop,
  Notebook, FileText, PenTool, Disc, Sparkles, Calendar, Wallet, ShoppingBag, Layers, Plus, Trash2,
  User, LogIn, UserPlus, LogOut, KeyRound, Copy, LayoutGrid, ChevronRight, ChevronLeft, Search, Bell, Wifi, Radio,
  Lock, Cloud, RefreshCw, SmartphoneNfc, Terminal, Sparkle, ShieldAlert, SlidersHorizontal,
  CheckCircle2, AlertCircle, HardDrive, Cpu, HelpCircle, ArrowRight, Type, Contrast
} from 'lucide-react';
import { HARMONY_APPS } from '../config/apps';
import { 
  SystemSettings, 
  ThemeMode, 
  ThemePreset, 
  SystemUser, 
  LauncherIconStyle, 
  LauncherGridDensity,
  SystemFontFamily,
  FontSizeScale,
  DisplayScale,
  ColorTemperature,
  LockScreenClockStyle,
  LockScreenAutoLockTimeout
} from '../types';
import { soundManager } from '../lib/soundManager';
import { DEFAULT_DOCK_APP_IDS, DEFAULT_WIDGET_SIZES, STORAGE_KEYS, ACTIVE_MANUAL_USER_KEY, setLocalItem } from '../lib/offlinePersistence';
import { logoutUser, loginWithGoogle } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { AVAILABLE_WIDGETS, HomeWidgetId, WidgetSize } from './widgets/types';
import { WALLPAPER_PRESETS } from './HomeScreenSetupModal';
import { HabeshawiBrandEmblem, HabeshawiTibebBorder } from './HabeshawiIcons';
import { triggerHaptic } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (updated: Partial<SystemSettings>) => void;
  currentUser?: SystemUser | null;
  onOpenAuth?: (mode?: 'signin' | 'signup' | 'forgot' | 'profile') => void;
  onOpenOnboarding?: () => void;
  onOpenHomeScreenSetup?: () => void;
  wallpaperTheme?: string;
  onUpdateWallpaperTheme?: (themeId: string) => void;
  enabledWidgetIds?: HomeWidgetId[];
  onUpdateWidgets?: (widgets: HomeWidgetId[]) => void;
  pinnedAppIds?: string[];
  onUpdatePinnedApps?: (apps: string[]) => void;
  installedAppIds?: string[];
  onLockScreenNow?: () => void;
}

type SettingsSubPage = 
  | 'main' 
  | 'account'
  | 'launcher' 
  | 'lockscreen'
  | 'display' 
  | 'fonts' 
  | 'sounds' 
  | 'notifications' 
  | 'cloud' 
  | 'pwa' 
  | 'about';

interface ThemePresetOption {
  id: ThemePreset;
  name: string;
  tagline: string;
  gradient: string;
  dotColor: string;
  accentHex: string;
}

const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'habeshawi-gold',
    name: 'Habeshawi Imperial Gold',
    tagline: 'Lalibela Sunburst Gold & Warm Obsidian/Parchment',
    gradient: 'from-amber-500 via-amber-600 to-yellow-600',
    dotColor: 'bg-amber-500',
    accentHex: '#f59e0b'
  },
  {
    id: 'axum-emerald',
    name: 'Axumite Emerald',
    tagline: 'Highland Forest Emerald & Mountain Jade',
    gradient: 'from-emerald-500 via-emerald-600 to-teal-800',
    dotColor: 'bg-emerald-500',
    accentHex: '#10b981'
  },
  {
    id: 'sheba-crimson',
    name: 'Queen Sheba Crimson',
    tagline: 'Imperial Ruby & Royal Crimson Coral',
    gradient: 'from-rose-500 via-rose-600 to-red-800',
    dotColor: 'bg-rose-500',
    accentHex: '#e11d48'
  },
  {
    id: 'lalibela-stone',
    name: 'Lalibela Terracotta Stone',
    tagline: 'Rock-Hewn Monolith Warm Terracotta & Clay',
    gradient: 'from-amber-600 via-orange-600 to-stone-800',
    dotColor: 'bg-orange-500',
    accentHex: '#ea580c'
  },
  {
    id: 'birana-parchment',
    name: 'Birana Manuscript Parchment',
    tagline: 'Aged Manuscript Parchment & Qelem Amber Ink',
    gradient: 'from-yellow-600 via-amber-700 to-stone-900',
    dotColor: 'bg-amber-600',
    accentHex: '#d97706'
  },
  {
    id: 'slate',
    name: 'Apple Slate',
    tagline: 'Classic Cupertino Indigo & Slate',
    gradient: 'from-indigo-600 to-slate-800',
    dotColor: 'bg-indigo-500',
    accentHex: '#6366f1'
  },
  {
    id: 'oled',
    name: 'Midnight OLED',
    tagline: 'Deep Pitch Obsidian & Violet Glow',
    gradient: 'from-purple-900 to-black',
    dotColor: 'bg-purple-500',
    accentHex: '#a855f7'
  },
  {
    id: 'sunset',
    name: 'Solar Sunset',
    tagline: 'Warm Amber Dawn & Crimson Coral',
    gradient: 'from-amber-600 to-rose-700',
    dotColor: 'bg-amber-500',
    accentHex: '#f59e0b'
  },
  {
    id: 'emerald',
    name: 'Alpine Emerald',
    tagline: 'Crisp Mint Green & Deep Teal',
    gradient: 'from-emerald-600 to-teal-900',
    dotColor: 'bg-emerald-500',
    accentHex: '#10b981'
  },
  {
    id: 'lavender',
    name: 'Royal Lavender',
    tagline: 'Dreamy Lilac Orchid & Mauve',
    gradient: 'from-fuchsia-600 to-indigo-900',
    dotColor: 'bg-fuchsia-400',
    accentHex: '#d946ef'
  }
];

export interface SystemFontOption {
  id: SystemFontFamily;
  name: string;
  category: string;
  tagline: string;
  previewFontFamily: string;
  badge: string;
  sample: string;
}

export const SYSTEM_FONTS: SystemFontOption[] = [
  {
    id: 'system',
    name: 'San Francisco (Apple System)',
    category: 'iOS Native',
    tagline: 'Cupertino dynamic system typography with optical tracking',
    previewFontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif',
    badge: 'System Default',
    sample: 'The quick brown fox jumps over the lazy dog. 1234567890'
  },
  {
    id: 'ethiopic',
    name: 'Noto Ethiopic & Ge’ez',
    category: 'Cultural Heritage',
    tagline: 'Authentic Fidel script & high-readability Latin pairing',
    previewFontFamily: '"Noto Sans Ethiopic", "Noto Serif Ethiopic", sans-serif',
    badge: 'Habeshawi',
    sample: 'ሰላም ዓለም • እንኳን ወደ ሐበሻዊ ሱፐር አፕ በደህና መጡ።'
  },
  {
    id: 'sans',
    name: 'Inter Modern Sans',
    category: 'Grotesque UI',
    tagline: 'High-legibility geometric screen grotesque with tall x-height',
    previewFontFamily: '"Inter", "Plus Jakarta Sans", sans-serif',
    badge: 'Clean UI',
    sample: 'Designed for computer screens with crisp optical definition.'
  },
  {
    id: 'geometric',
    name: 'Outfit / Plus Jakarta',
    category: 'Geometric Pro',
    tagline: 'Contemporary geometric aesthetic with open, balanced curves',
    previewFontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif',
    badge: 'Modern Pro',
    sample: 'Harmonious geometric curves and distinctive brand presence.'
  },
  {
    id: 'serif',
    name: 'Playfair / Newsreader',
    category: 'Editorial Serif',
    tagline: 'High-contrast editorial serif tailored for reading & writing',
    previewFontFamily: '"Playfair Display", "Newsreader", "Merriweather", serif',
    badge: 'Editorial',
    sample: 'Classic elegance crafted for immersive reading & document drafting.'
  },
  {
    id: 'mono',
    name: 'JetBrains Mono / Fira',
    category: 'Monospace Code',
    tagline: 'Fixed-width developer typography with code symbols & ligatures',
    previewFontFamily: '"JetBrains Mono", "Fira Code", monospace',
    badge: 'Developer',
    sample: 'const habeshawiOS = { engine: "Vite + TypeScript", speed: "120fps" };'
  },
  {
    id: 'rounded',
    name: 'Nunito / SF Rounded',
    category: 'Soft Rounded',
    tagline: 'Gentle rounded stroke terminals and inviting visual warmth',
    previewFontFamily: '"Nunito", "Quicksand", "SF Pro Rounded", sans-serif',
    badge: 'Friendly',
    sample: 'Gentle rounded strokes for a playful, cozy user experience.'
  }
];

export interface FontScaleOption {
  id: FontSizeScale;
  name: string;
  scalePercent: string;
  sizePx: string;
  desc: string;
}

export const FONT_SCALES: FontScaleOption[] = [
  { id: 'compact', name: 'Compact', scalePercent: '91%', sizePx: '14.5px', desc: 'Higher information density' },
  { id: 'standard', name: 'Standard', scalePercent: '100%', sizePx: '16px', desc: 'Standard iOS typographic scale' },
  { id: 'large', name: 'Large', scalePercent: '108%', sizePx: '17.5px', desc: 'Enhanced clarity & legibility' },
  { id: 'xlarge', name: 'Extra Large', scalePercent: '118%', sizePx: '19px', desc: 'Maximum comfort & accessibility' },
];

export interface DisplayScaleOption {
  id: DisplayScale;
  name: string;
  desc: string;
}

export const DISPLAY_SCALES: DisplayScaleOption[] = [
  { id: 'compact', name: 'Compact Density', desc: 'Denser layouts and smaller padding' },
  { id: 'standard', name: 'Standard Scale', desc: 'Balanced iOS Human Interface standard' },
  { id: 'expanded', name: 'Expanded Touch', desc: 'Spacious touch targets & larger buttons' },
];

export interface ColorTemperatureOption {
  id: ColorTemperature;
  name: string;
  desc: string;
  accentDot: string;
}

export const COLOR_TEMPERATURES: ColorTemperatureOption[] = [
  { id: 'standard', name: 'Standard Neutral', desc: 'Balanced daylight 6500K calibration', accentDot: 'bg-neutral-400' },
  { id: 'warm', name: 'Night Shift Warm', desc: 'Reduces blue light spectrum for evening use', accentDot: 'bg-amber-400' },
  { id: 'cool', name: 'Studio Daylight Cool', desc: 'Crisp high-vibrancy cool tone for bright spaces', accentDot: 'bg-sky-400' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentUser,
  onOpenAuth,
  onOpenOnboarding,
  onOpenHomeScreenSetup,
  wallpaperTheme = 'obsidian',
  onUpdateWallpaperTheme,
  enabledWidgetIds = ['calendar', 'finance', 'music', 'docs-ai'],
  onUpdateWidgets,
  pinnedAppIds,
  onUpdatePinnedApps,
  installedAppIds,
  onLockScreenNow
}) => {
  const [activePage, setActivePage] = useState<SettingsSubPage>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [passcodeDraft, setPasscodeDraft] = useState<string>(settings.lockScreenPasscode || '1234');
  const [showPasscodeVisible, setShowPasscodeVisible] = useState<boolean>(false);
  const [passcodeSavedToast, setPasscodeSavedToast] = useState<boolean>(false);

  // Sync passcodeDraft when settings update externally
  useEffect(() => {
    if (settings.lockScreenPasscode) {
      setPasscodeDraft(settings.lockScreenPasscode);
    }
  }, [settings.lockScreenPasscode]);

  // Filtered settings for instant search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const items = [
      { id: 'account', title: 'Habeshawi Account & Sign In', subtitle: 'Sign in, create account, Apple ID, profile & cloud sync', icon: User, bg: 'bg-indigo-600' },
      { id: 'launcher', title: 'Home Screen & Launcher', subtitle: 'Wallpapers, icon styles, grid density, widgets', icon: LayoutGrid, bg: 'bg-indigo-500' },
      { id: 'lockscreen', title: 'Lock Screen & Security', subtitle: 'Passcode, clock styles, widgets, auto-lock & quick actions', icon: Lock, bg: 'bg-amber-600' },
      { id: 'display', title: 'Display & Brightness', subtitle: 'Light/Dark mode, accent presets, Night Shift, Contrast', icon: Sun, bg: 'bg-blue-500' },
      { id: 'fonts', title: 'Typography & Fonts', subtitle: 'Global font family, text size scaling, bold text', icon: Type, bg: 'bg-violet-500' },
      { id: 'sounds', title: 'Sounds & Haptics', subtitle: 'Typewriter clicks, volume, haptic touch feedback', icon: Volume2, bg: 'bg-pink-500' },
      { id: 'notifications', title: 'Focus & Notifications', subtitle: 'Do Not Disturb, alerts, banner previews', icon: Moon, bg: 'bg-purple-600' },
      { id: 'cloud', title: 'Firebase Cloud & Storage', subtitle: 'Firestore real-time database, auth state', icon: Flame, bg: 'bg-amber-500' },
      { id: 'pwa', title: 'PWA & Offline Capability', subtitle: 'Workbox Service Worker cache, install app', icon: Smartphone, bg: 'bg-teal-500' },
      { id: 'about', title: 'About Habeshawi', subtitle: 'Release 1.0.00 Titanium Pro, system specs', icon: Info, bg: 'bg-neutral-500' },
    ];
    return items.filter(i => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q));
  }, [searchQuery]);

  if (!isOpen) return null;

  const isDark = settings.isDarkMode;
  const currentMode = settings.themeMode || (settings.isDarkMode ? 'dark' : 'light');
  const currentPreset = settings.themePreset || 'slate';

  const handleModeChange = (mode: ThemeMode) => {
    soundManager.playHapticClick();
    let isDarkResolved = isDark;
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

  const handlePresetChange = (preset: ThemePreset) => {
    soundManager.playHapticClick();
    const found = THEME_PRESETS.find(p => p.id === preset);
    onUpdateSettings({ 
      themePreset: preset,
      accentColor: found ? found.accentHex : '#6366f1'
    });
  };

  // Dock customization handlers
  const dockAppIds = settings.dockAppIds && settings.dockAppIds.length > 0 
    ? settings.dockAppIds 
    : DEFAULT_DOCK_APP_IDS;

  const handleToggleDockApp = (appId: string) => {
    soundManager.playClickSound();
    let next: string[];
    if (dockAppIds.includes(appId)) {
      if (dockAppIds.length <= 1) return;
      next = dockAppIds.filter((id) => id !== appId);
    } else {
      next = [...dockAppIds, appId];
    }
    onUpdateSettings({ dockAppIds: next });
  };

  const handleMoveDockApp = (index: number, direction: 'up' | 'down') => {
    soundManager.playClickSound();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dockAppIds.length) return;
    const next = [...dockAppIds];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onUpdateSettings({ dockAppIds: next });
  };

  // Widget management handlers
  const handleToggleWidget = (widgetId: HomeWidgetId) => {
    soundManager.playClickSound();
    if (!onUpdateWidgets) return;
    if (enabledWidgetIds.includes(widgetId)) {
      if (enabledWidgetIds.length <= 1) return;
      onUpdateWidgets(enabledWidgetIds.filter(id => id !== widgetId));
    } else {
      onUpdateWidgets([...enabledWidgetIds, widgetId]);
    }
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    soundManager.playClickSound();
    if (!onUpdateWidgets) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= enabledWidgetIds.length) return;
    const next = [...enabledWidgetIds];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onUpdateWidgets(next);
  };

  const handleNavigate = (page: SettingsSubPage) => {
    soundManager.playClickSound();
    setActivePage(page);
  };

  const handleBack = () => {
    soundManager.playClickSound();
    setActivePage('main');
  };

  const getDockAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'notebook': return <Notebook className="w-4 h-4 text-white" />;
      case 'file-text': return <FileText className="w-4 h-4 text-white" />;
      case 'pen-tool': return <PenTool className="w-4 h-4 text-white" />;
      case 'disc': return <Disc className="w-4 h-4 text-white" />;
      case 'sparkles': return <Sparkles className="w-4 h-4 text-white" />;
      case 'calendar': return <Calendar className="w-4 h-4 text-white" />;
      case 'wallet': return <Wallet className="w-4 h-4 text-white" />;
      case 'shopping-bag':
      case 'store':
        return <ShoppingBag className="w-4 h-4 text-white" />;
      default: return <Layers className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className={`w-full max-w-xl h-[90vh] max-h-[760px] rounded-[28px] sm:rounded-[32px] border shadow-2xl flex flex-col overflow-hidden relative ${
          isDark 
            ? 'bg-[#120f0c] border-amber-500/30 text-amber-50 shadow-amber-950/40' 
            : 'bg-[#fcfaf4] border-amber-400/50 text-stone-900 shadow-stone-400/30'
        }`}
      >
        {/* Top Tibeb Decorative Ribbon */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <HabeshawiTibebBorder height={5} className="w-full opacity-80" />
        </div>

        {/* ================= TOP MOBILE NAVIGATION BAR ================= */}
        <div className={`px-4 pt-4 pb-2.5 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-[#181410]/95 border-stone-800' : 'bg-[#f8f5ee]/95 border-stone-200'
        } backdrop-blur-xl z-20`}>
          {activePage === 'main' ? (
            <div className="flex items-center gap-2.5">
              <HabeshawiBrandEmblem size={26} />
              <h1 className="text-base font-bold tracking-tight">Habeshawi Settings</h1>
            </div>
          ) : (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors -ml-1 py-0.5 px-1 rounded-md"
            >
              <ChevronLeft className="w-5 h-5 -mr-1" />
              <span>Settings</span>
            </button>
          )}

          {/* Subpage Title (when drilled in) */}
          {activePage !== 'main' && (
            <span className="text-sm font-bold truncate max-w-[200px]">
              {activePage === 'account' && 'Habeshawi Account'}
              {activePage === 'launcher' && 'Home & Launcher'}
              {activePage === 'lockscreen' && 'Lock Screen & Security'}
              {activePage === 'display' && 'Display & Brightness'}
              {activePage === 'fonts' && 'Typography & Fonts'}
              {activePage === 'sounds' && 'Sounds & Haptics'}
              {activePage === 'notifications' && 'Focus & Alerts'}
              {activePage === 'cloud' && 'Cloud & Firebase'}
              {activePage === 'pwa' && 'PWA & Offline'}
              {activePage === 'about' && 'About Habeshawi OS'}
            </span>
          )}

          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isDark 
                ? 'bg-[#2c2c2e] text-[#8e8e93] hover:text-white' 
                : 'bg-[#e5e5ea] text-[#8e8e93] hover:text-neutral-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= SCROLLABLE SETTINGS CONTENT ================= */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-3 space-y-4">
          <AnimatePresence mode="wait">
            {activePage === 'main' ? (
              <motion.div
                key="main-settings"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Search Bar */}
                <div className={`relative flex items-center rounded-xl px-3 py-2 border transition-all ${
                  isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                }`}>
                  <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Settings, Launcher, Display..."
                    className="w-full bg-transparent text-xs sm:text-sm focus:outline-hidden placeholder:text-neutral-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Search Results (if searching) */}
                {searchResults ? (
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id as SettingsSubPage)}
                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0 shadow-xs`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold truncate">{item.title}</p>
                                <p className="text-[11px] text-neutral-400 truncate">{item.subtitle}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-neutral-400">
                        No settings matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* ================= USER PROFILE CARD BANNER ================= */}
                    <div 
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDark 
                          ? 'bg-[#1c1c1e] border-[#2c2c2e]' 
                          : 'bg-white border-[#e5e5ea] shadow-xs'
                      }`}
                    >
                      {currentUser && !currentUser.isAnonymous ? (
                        <div className="space-y-3">
                          <div 
                            onClick={() => {
                              soundManager.playClickSound();
                              handleNavigate('account');
                            }}
                            className="flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-500 to-indigo-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                                <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center overflow-hidden">
                                  {currentUser?.photoURL ? (
                                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-base font-bold text-white uppercase">
                                      {currentUser?.displayName ? currentUser.displayName.charAt(0) : 'H'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h2 className="text-sm font-bold truncate group-hover:text-amber-400 transition-colors">
                                  {currentUser?.displayName || 'Habeshawi User'}
                                </h2>
                                <p className="text-[11px] text-neutral-400 truncate">
                                  {currentUser?.email || 'Apple ID, Cloud, Media & Purchases'}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Firebase Synced
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => {
                                soundManager.playClickSound();
                                handleNavigate('account');
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-neutral-800/60 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/50 flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <User className="w-3.5 h-3.5 text-amber-400" />
                              <span>Account Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                soundManager.playClickSound();
                                onOpenAuth?.('signin');
                              }}
                              className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50 flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Switch</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div 
                            onClick={() => {
                              soundManager.playClickSound();
                              handleNavigate('account');
                            }}
                            className="flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
                                <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center">
                                  <User className="w-6 h-6 text-amber-400" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h2 className="text-sm font-bold truncate group-hover:text-amber-400 transition-colors">
                                  Sign in to your Habeshawi Account
                                </h2>
                                <p className="text-[11px] text-neutral-400 truncate">
                                  Set up Cloud Sync, Habeshawi AI, Notes & Wallets
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          </div>

                          {/* Dedicated Action Buttons: Sign In & Sign Up */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => {
                                soundManager.playClickSound();
                                onOpenAuth?.('signin');
                              }}
                              className="py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Sign In</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                soundManager.playClickSound();
                                onOpenAuth?.('signup');
                              }}
                              className="py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-98 flex items-center justify-center gap-1.5 transition-all"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Sign Up</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ================= GROUP: ACCOUNT & CLOUD IDENTITY ================= */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                        Account & Cloud Identity
                      </div>
                      <div className={`rounded-2xl border overflow-hidden divide-y ${
                        isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                      }`}>
                        {/* Habeshawi Account Profile Subpage */}
                        <button
                          onClick={() => handleNavigate('account')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Habeshawi Account & Sync</p>
                              <p className="text-[11px] text-neutral-400">
                                {currentUser && !currentUser.isAnonymous 
                                  ? (currentUser.displayName || currentUser.email || 'Cloud Profile Active')
                                  : 'Sign In, Sign Up, or create guest cloud backup'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {currentUser && !currentUser.isAnonymous ? (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Signed In
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Sign In / Up
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* ================= GROUP 1: HOME SCREEN & PERSONALIZATION ================= */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                        Home Screen & Appearance
                      </div>
                      <div className={`rounded-2xl border overflow-hidden divide-y ${
                        isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                      }`}>
                        {/* Home Screen & Launcher Settings */}
                        <button
                          onClick={() => handleNavigate('launcher')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-xs">
                              <LayoutGrid className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Home Screen & Launcher</p>
                              <p className="text-[11px] text-neutral-400">Wallpapers, Icon Styles, Grid Density, Widgets</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* Lock Screen & Security */}
                        <button
                          onClick={() => handleNavigate('lockscreen')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center shadow-xs">
                              <Lock className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Lock Screen & Security</p>
                              <p className="text-[11px] text-neutral-400">
                                Passcode {settings.lockScreenRequirePasscode ? 'On' : 'Off'} • {settings.lockScreenClockStyle || 'Default'} Clock
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* Display & Brightness */}
                        <button
                          onClick={() => handleNavigate('display')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-xs">
                              <Sun className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Display & Brightness</p>
                              <p className="text-[11px] text-neutral-400">
                                {isDark ? 'Dark Mode' : 'Light Mode'} • {THEME_PRESETS.find(p => p.id === currentPreset)?.name}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* Typography & Fonts */}
                        <button
                          onClick={() => handleNavigate('fonts')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center shadow-xs">
                              <Type className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Typography & Fonts</p>
                              <p className="text-[11px] text-neutral-400">
                                {SYSTEM_FONTS.find(f => f.id === (settings.fontFamily || 'system'))?.name.split(' ')[0]} • Scale {settings.fontSizeScale || 'standard'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* Sounds & Haptics */}
                        <button
                          onClick={() => handleNavigate('sounds')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-pink-500 flex items-center justify-center shadow-xs">
                              <Volume2 className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Sounds & Haptics</p>
                              <p className="text-[11px] text-neutral-400">
                                Typewriter {settings.typewriterSounds ? 'On' : 'Off'} • Haptics {settings.hapticFeedback ? 'On' : 'Off'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    </div>

                    {/* ================= GROUP 2: CONNECTIVITY & FOCUS ================= */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                        System & Focus
                      </div>
                      <div className={`rounded-2xl border overflow-hidden divide-y ${
                        isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                      }`}>
                        {/* Focus Mode Quick Toggle */}
                        <div className="w-full px-3.5 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center shadow-xs">
                              <Moon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Focus Mode</p>
                              <p className="text-[11px] text-neutral-400">Mutes non-essential notifications</p>
                            </div>
                          </div>
                          <button
                            role="switch"
                            aria-checked={settings.focusMode}
                            onClick={() => {
                              soundManager.playClickSound();
                              onUpdateSettings({ focusMode: !settings.focusMode });
                            }}
                            className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative ${
                              settings.focusMode ? 'bg-emerald-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                            }`}
                          >
                            <div className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                              settings.focusMode ? 'translate-x-5.5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Notifications */}
                        <button
                          onClick={() => handleNavigate('notifications')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center shadow-xs">
                              <Bell className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Notifications & Alerts</p>
                              <p className="text-[11px] text-neutral-400">Banners, Center Previews & Sounds</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* Cloud & Firebase */}
                        <button
                          onClick={() => handleNavigate('cloud')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-xs">
                              <Flame className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Cloud & Firebase BaaS</p>
                              <p className="text-[11px] text-neutral-400">Firestore Realtime Database & Offline Queue</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    </div>

                    {/* ================= GROUP 3: PWA & SYSTEM ================= */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                        Architecture & System
                      </div>
                      <div className={`rounded-2xl border overflow-hidden divide-y ${
                        isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                      }`}>
                        {/* PWA & Offline */}
                        <button
                          onClick={() => handleNavigate('pwa')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center shadow-xs">
                              <Smartphone className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">PWA & Offline Installation</p>
                              <p className="text-[11px] text-neutral-400">Service Worker & Workbox Caches</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* About Habeshawi Super App */}
                        <button
                          onClick={() => handleNavigate('about')}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-neutral-600 flex items-center justify-center shadow-xs">
                              <Info className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">About Habeshawi Super App</p>
                              <p className="text-[11px] text-neutral-400">Release 1.0.00 Titanium Pro • Apple HIG Compliant</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : activePage === 'account' ? (
              /* ================= SUBPAGE: HABESHAWI ACCOUNT & SIGN IN / SIGN UP ================= */
              <motion.div
                key="subpage-account"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Account Status Toast Banner */}
                {accountMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{accountMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccountMessage(null)}
                      className="text-neutral-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {/* Profile Header Hero Card */}
                <div className={`p-4 sm:p-5 rounded-2xl border text-center relative overflow-hidden ${
                  isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                }`}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-500 to-indigo-500 p-0.5 shadow-xl mx-auto mb-3 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center overflow-hidden">
                      {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white uppercase">
                          {currentUser?.displayName ? currentUser.displayName.charAt(0) : 'H'}
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-base font-bold">
                    {currentUser?.displayName || (currentUser && !currentUser.isAnonymous ? 'Habeshawi User' : 'Guest Account')}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {currentUser?.email || (currentUser && !currentUser.isAnonymous ? 'Email Synced' : 'Not signed in to Habeshawi Cloud')}
                  </p>

                  <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
                    {currentUser && !currentUser.isAnonymous ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Cloud Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" /> Offline / Guest Mode
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      <Flame className="w-3 h-3" /> Firestore Active
                    </span>
                  </div>
                </div>

                {/* Primary Authentication Action Section */}
                {!currentUser || currentUser.isAnonymous ? (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                        Sign In or Create Account
                      </div>
                      
                      <div className="space-y-2.5">
                        {/* Sign In Button */}
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            onOpenAuth?.('signin');
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Sign In with Email / Password</span>
                        </button>

                        {/* Sign Up / Create Account Button */}
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            onOpenAuth?.('signup');
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-yellow-600/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-98 font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Create Free Habeshawi Account</span>
                        </button>

                        {/* Sign In with Google Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            soundManager.playClickSound();
                            try {
                              const googleUser = await loginWithGoogle();
                              if (googleUser) {
                                setAccountMessage(`Signed in successfully as ${googleUser.displayName || googleUser.email}!`);
                              }
                            } catch (e: any) {
                              console.warn('Google sign in error:', e);
                              // Fallback to opening auth modal
                              onOpenAuth?.('signin');
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-98 text-neutral-200 border border-neutral-700 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Continue with Google</span>
                        </button>
                      </div>

                      <div className="mt-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            onOpenAuth?.('forgot');
                          }}
                          className="text-[11px] text-neutral-400 hover:text-amber-400 transition-colors"
                        >
                          Forgot password or need help signing in?
                        </button>
                      </div>
                    </div>

                    {/* Features Synced with Account Card */}
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                    }`}>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                        What Gets Synced to Cloud
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2.5 text-neutral-300">
                          <Notebook className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Habeshawi Notes & Rich Text Documents</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-neutral-300">
                          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Ethiopian Tri-Calendar & Gregorian Events</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-neutral-300">
                          <Wallet className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Financial Wallets, Budgets & Expense Logs</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-neutral-300">
                          <Disc className="w-4 h-4 text-pink-400 shrink-0" />
                          <span>Music Playlists & Offline Audio Library</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-neutral-300">
                          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>Habeshawi AI Chats & Writing Assistant Drafts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= SIGNED IN ACCOUNT MANAGEMENT ================= */
                  <div className="space-y-3">
                    {/* Account Details Group */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                        Account Profile & Credentials
                      </div>
                      <div className={`rounded-2xl border overflow-hidden divide-y ${
                        isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                      }`}>
                        {/* Display Name */}
                        <div className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="text-[11px] text-neutral-400">Display Name</p>
                            <p className="font-semibold text-sm mt-0.5">{currentUser.displayName || 'Not specified'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playClickSound();
                              onOpenAuth?.('profile');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
                          >
                            Edit
                          </button>
                        </div>

                        {/* Email */}
                        <div className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="text-[11px] text-neutral-400">Email Address</p>
                            <p className="font-semibold text-sm mt-0.5">{currentUser.email || 'None'}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Verified
                          </span>
                        </div>

                        {/* User UID */}
                        <div className="p-3.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 mr-2">
                            <p className="text-[11px] text-neutral-400">User UID</p>
                            <p className="font-mono text-[11px] text-neutral-300 truncate mt-0.5">{currentUser.uid}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playClickSound();
                              navigator.clipboard.writeText(currentUser.uid);
                              setCopiedUid(true);
                              setTimeout(() => setCopiedUid(false), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold shrink-0 flex items-center gap-1 transition-colors"
                          >
                            {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedUid ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Account Actions Group */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                        Account Actions
                      </div>
                      <div className={`rounded-2xl border overflow-hidden divide-y ${
                        isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                      }`}>
                        {/* Switch / Sign in with another account */}
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            onOpenAuth?.('signin');
                          }}
                          className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-xs">
                              <LogIn className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Sign In with Another Account</p>
                              <p className="text-[11px] text-neutral-400">Switch user profile or login credentials</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* Create Another Account */}
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            onOpenAuth?.('signup');
                          }}
                          className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-xs">
                              <UserPlus className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold">Create New Habeshawi Account</p>
                              <p className="text-[11px] text-neutral-400">Register a new profile with email</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </button>

                        {/* Sign Out Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            soundManager.playClickSound();
                            try {
                              await logoutUser();
                              setLocalItem(ACTIVE_MANUAL_USER_KEY, null);
                              setAccountMessage('Signed out successfully. Operating in guest offline mode.');
                            } catch (e: any) {
                              console.warn('Logout error:', e);
                            }
                          }}
                          className="w-full px-3.5 py-3 flex items-center justify-between text-left text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shadow-xs border border-red-500/30">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-red-400">Sign Out of Habeshawi</p>
                              <p className="text-[11px] text-red-400/70">Disconnect cloud sync on this device</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-red-400/70" />
                        </button>
                      </div>
                    </div>

                    {/* Cloud Infrastructure Info */}
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-neutral-300">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span>Connected Cloud Infrastructure</span>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-neutral-400">
                        <div className="flex justify-between">
                          <span>Database ID:</span>
                          <span className="font-mono text-neutral-200">ai-studio-harmonysuperapp</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Realtime Listeners:</span>
                          <span className="text-emerald-400 font-medium">11 Mini-Apps Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activePage === 'launcher' ? (
              /* ================= SUBPAGE: HOME SCREEN & LAUNCHER ================= */
              <motion.div
                key="subpage-launcher"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Wallpaper Gallery Selection */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    System Wallpaper Ambiance
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WALLPAPER_PRESETS.map((wp) => {
                      const isSelected = wallpaperTheme === wp.id;
                      return (
                        <button
                          key={wp.id}
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            onUpdateWallpaperTheme?.(wp.id);
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
                            isSelected
                              ? 'ring-2 ring-indigo-500 border-indigo-500'
                              : isDark
                                ? 'bg-[#1c1c1e] border-[#2c2c2e] hover:border-neutral-600'
                                : 'bg-white border-[#e5e5ea] hover:border-neutral-400'
                          }`}
                        >
                          {/* Wallpaper mini preview */}
                          <div className={`w-full h-10 rounded-lg bg-gradient-to-br ${isDark ? wp.darkBgClass : wp.lightBgClass} mb-2 shadow-inner border border-white/10`} />
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">{wp.name}</span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* App Icon Styling */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    App Icon Aesthetic
                  </div>
                  <div className={`rounded-2xl border p-3 ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'vibrant', name: 'Vibrant Gradients', desc: 'Classic Apple Color Gradients' },
                        { id: 'tinted', name: 'Tinted Glass', desc: 'Frosted Glass with Accent Hue' },
                        { id: 'dark-glass', name: 'Obsidian OLED', desc: 'Pitch Black with Glow' },
                        { id: 'monochrome', name: 'Monochrome', desc: 'Minimalist High-Contrast' }
                      ].map((style) => {
                        const isCurrent = (settings.launcherIconStyle || 'vibrant') === style.id;
                        return (
                          <button
                            key={style.id}
                            onClick={() => {
                              soundManager.playHapticClick();
                              onUpdateSettings({ launcherIconStyle: style.id as LauncherIconStyle });
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isCurrent
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                                : isDark
                                  ? 'bg-[#2c2c2e]/60 border-[#3a3a3c] text-neutral-300'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                            }`}
                          >
                            <p className="text-xs font-bold">{style.name}</p>
                            <p className="text-[10px] text-neutral-400">{style.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Grid Density */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Launcher Grid Density
                  </div>
                  <div className={`rounded-2xl border p-3 ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'spacious', name: 'Spacious', detail: '4×4 Grid' },
                        { id: 'standard', name: 'Standard', detail: '4×5 Grid' },
                        { id: 'compact', name: 'Compact', detail: '5×6 Grid' }
                      ].map((density) => {
                        const isCurrent = (settings.launcherGridDensity || 'standard') === density.id;
                        return (
                          <button
                            key={density.id}
                            onClick={() => {
                              soundManager.playHapticClick();
                              onUpdateSettings({ launcherGridDensity: density.id as LauncherGridDensity });
                            }}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                                : isDark
                                  ? 'bg-[#2c2c2e]/60 border-[#3a3a3c] text-neutral-300'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                            }`}
                          >
                            <p className="text-xs font-bold">{density.name}</p>
                            <p className="text-[10px] text-neutral-400">{density.detail}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Smart Stack Widgets Config */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Smart Stack Live Widgets
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {AVAILABLE_WIDGETS.map((widget, index) => {
                      const isEnabled = enabledWidgetIds.includes(widget.id);
                      return (
                        <div key={widget.id} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {widget.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{widget.title}</p>
                              <p className="text-[10px] text-neutral-400 truncate">{widget.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isEnabled && (
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveWidget(index, 'up')}
                                  className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === enabledWidgetIds.length - 1}
                                  onClick={() => handleMoveWidget(index, 'down')}
                                  className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <button
                              role="switch"
                              aria-checked={isEnabled}
                              onClick={() => handleToggleWidget(widget.id)}
                              className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                                isEnabled ? 'bg-indigo-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dock Apps Bar Customization */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Bottom Dock Applications
                  </div>
                  <div className={`rounded-2xl border p-3 space-y-2.5 ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <p className="text-[11px] text-neutral-400">
                      Toggle apps to show on the floating bottom dock:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {HARMONY_APPS.map((app) => {
                        const isPinned = dockAppIds.includes(app.id);
                        return (
                          <button
                            key={app.id}
                            onClick={() => handleToggleDockApp(app.id)}
                            className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                              isPinned
                                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold'
                                : isDark
                                  ? 'bg-[#2c2c2e]/60 border-[#3a3a3c] text-neutral-400'
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${app.colorGradient} flex items-center justify-center shrink-0`}>
                              {getDockAppIcon(app.iconName)}
                            </div>
                            <span className="text-[11px] truncate">{app.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Smart Stack Widgets & Resizing */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1 flex items-center justify-between">
                    <span>Smart Stack Widgets & Sizes</span>
                    <span className="text-[10px] text-indigo-400 font-mono">Resizable</span>
                  </div>
                  <div className={`rounded-2xl border p-3.5 space-y-3 ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <p className="text-[11px] text-neutral-400">
                      Customize which summary snippet widgets appear and choose their card sizes:
                    </p>
                    <div className="space-y-2">
                      {AVAILABLE_WIDGETS.map((w) => {
                        const isWidgetActive = (enabledWidgetIds || ['calendar', 'finance', 'music', 'docs-ai']).includes(w.id);
                        const currentSize = (settings.widgetSizes && settings.widgetSizes[w.id]) || w.defaultSize || 'small';

                        return (
                          <div
                            key={w.id}
                            className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                              isWidgetActive
                                ? isDark ? 'bg-[#2c2c2e]/60 border-indigo-500/40' : 'bg-indigo-50/40 border-indigo-200'
                                : isDark ? 'bg-[#2c2c2e]/20 border-[#3a3a3c] opacity-60' : 'bg-neutral-50 border-neutral-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{w.title}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                                  {w.category}
                                </span>
                              </div>
                              <button
                                role="switch"
                                aria-checked={isWidgetActive}
                                onClick={() => {
                                  soundManager.playClickSound();
                                  if (onUpdateWidgets) {
                                    const currentList = enabledWidgetIds || ['calendar', 'finance', 'music', 'docs-ai'];
                                    const next = isWidgetActive
                                      ? currentList.filter(id => id !== w.id)
                                      : [...currentList, w.id];
                                    if (next.length > 0) onUpdateWidgets(next);
                                  }
                                }}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${
                                  isWidgetActive ? 'bg-indigo-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                                  isWidgetActive ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>

                            {isWidgetActive && (
                              <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px]">
                                <span className="text-neutral-400">Card Size:</span>
                                <div className="flex items-center gap-1">
                                  {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => {
                                        soundManager.playHapticClick();
                                        const updatedSizes = {
                                          ...(settings.widgetSizes || DEFAULT_WIDGET_SIZES),
                                          [w.id]: sz,
                                        };
                                        onUpdateSettings({ widgetSizes: updatedSizes });
                                      }}
                                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold capitalize transition-all ${
                                        currentSize === sz
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : isDark ? 'bg-[#3a3a3c] text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                                      }`}
                                    >
                                      {sz === 'small' ? '1×1 Small' : sz === 'medium' ? '2×1 Medium' : '2×2 Large'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Launcher Behavior Toggles */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Launcher Gesture & Behavior
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">Show App Text Labels</p>
                        <p className="text-[10px] text-neutral-400">Displays names under home screen icons</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.launcherShowLabels !== false}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ launcherShowLabels: settings.launcherShowLabels === false ? true : false });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.launcherShowLabels !== false ? 'bg-indigo-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.launcherShowLabels !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">Interactive Page Dots</p>
                        <p className="text-[10px] text-neutral-400">Bottom page indicators with smooth click jump</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.launcherShowPageDots !== false}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ launcherShowPageDots: settings.launcherShowPageDots === false ? true : false });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.launcherShowPageDots !== false ? 'bg-indigo-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.launcherShowPageDots !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">Jiggle Mode on Long Press</p>
                        <p className="text-[10px] text-neutral-400">Hold any icon to rearrange and customize launcher</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.launcherJiggleOnLongPress !== false}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ launcherJiggleOnLongPress: settings.launcherJiggleOnLongPress === false ? true : false });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.launcherJiggleOnLongPress !== false ? 'bg-indigo-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.launcherJiggleOnLongPress !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activePage === 'lockscreen' ? (
              /* ================= SUBPAGE: LOCK SCREEN & SECURITY ================= */
              <motion.div
                key="subpage-lockscreen"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Live Miniature Lock Screen Preview */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/20 border border-white/5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Lock Screen Preview
                  </div>
                  <div className="w-44 h-72 rounded-[24px] border-2 border-neutral-700/80 shadow-2xl relative overflow-hidden flex flex-col justify-between p-2.5 select-none bg-neutral-900">
                    {/* Background Preview */}
                    <div className={`absolute inset-0 ${
                      WALLPAPER_PRESETS.find(p => p.id === wallpaperTheme)
                        ? (isDark ? WALLPAPER_PRESETS.find(p => p.id === wallpaperTheme)!.darkBgClass : WALLPAPER_PRESETS.find(p => p.id === wallpaperTheme)!.lightBgClass)
                        : 'from-amber-900 to-black'
                    } bg-gradient-to-br ${settings.lockScreenWallpaperBlur ? 'blur-xs scale-105' : ''}`} />
                    <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                    {/* Mini Status bar */}
                    <div className="relative z-10 flex items-center justify-between text-[8px] text-white/80 font-bold px-1 pt-0.5">
                      <span>Habeshawi</span>
                      <Lock className="w-2.5 h-2.5 text-white/90" />
                      <span>98%</span>
                    </div>

                    {/* Mini Clock & Date */}
                    <div className="relative z-10 flex flex-col items-center text-center my-auto">
                      {settings.lockScreenShowDate !== false && (
                        <div className="text-[8px] text-white/80 font-medium leading-none mb-1">
                          Wednesday, Sep 24
                        </div>
                      )}
                      <div className={`text-3xl text-white font-bold tracking-tight leading-none drop-shadow-md ${
                        settings.lockScreenClockStyle === 'bold' ? 'font-black scale-105' :
                        settings.lockScreenClockStyle === 'rounded' ? 'font-rounded font-bold' :
                        settings.lockScreenClockStyle === 'ethiopic' ? 'font-ethiopic' :
                        settings.lockScreenClockStyle === 'minimal' ? 'font-extralight tracking-widest' :
                        settings.lockScreenClockStyle === 'serif' ? 'font-serif italic' : 'font-bold'
                      }`}>
                        09:41
                      </div>
                      {settings.lockScreenOwnerText && (
                        <div className="text-[7px] text-white/70 uppercase tracking-wider mt-1 truncate max-w-[120px]">
                          {settings.lockScreenOwnerText}
                        </div>
                      )}

                      {/* Mini Widgets Row */}
                      {settings.lockScreenShowWidgets !== false && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[7px] text-white/90 border border-white/20">
                            22° Addis
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[7px] text-white/90 border border-white/20">
                            Focus
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mini Bottom Controls */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between px-1 mb-1">
                        <div className="w-5 h-5 rounded-full bg-black/50 border border-white/30 flex items-center justify-center">
                          <Flashlight className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-black/50 border border-white/30 flex items-center justify-center">
                          <Camera className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div className="w-12 h-0.5 rounded-full bg-white/70" />
                    </div>
                  </div>
                </div>

                {/* Primary Action: Lock Device Now & Status */}
                <div className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                } space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">Enable Lock Screen</p>
                      <p className="text-[11px] text-neutral-400">Display secure lock screen when device is locked</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={settings.lockScreenEnabled !== false}
                      onClick={() => {
                        soundManager.playClickSound();
                        onUpdateSettings({ lockScreenEnabled: settings.lockScreenEnabled === false });
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                        settings.lockScreenEnabled !== false ? 'bg-amber-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        settings.lockScreenEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {onLockScreenNow && (
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClickSound();
                        onClose();
                        onLockScreenNow();
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md active:scale-98"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock Device Now</span>
                    </button>
                  )}
                </div>

                {/* Section: Passcode & Security */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Passcode & Access Security
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {/* Require Passcode Toggle */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Require Passcode to Unlock</p>
                        <p className="text-[11px] text-neutral-400">
                          {settings.lockScreenRequirePasscode 
                            ? 'Numeric PIN required to access Home Screen' 
                            : 'Swipe or click to unlock freely'}
                        </p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!!settings.lockScreenRequirePasscode}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ lockScreenRequirePasscode: !settings.lockScreenRequirePasscode });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.lockScreenRequirePasscode ? 'bg-emerald-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.lockScreenRequirePasscode ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Change / Configure Passcode PIN */}
                    {settings.lockScreenRequirePasscode && (
                      <div className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold">Passcode (4–6 Digits)</label>
                          <span className="text-[10px] text-neutral-400">Current: {settings.lockScreenPasscode || '1234'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 flex items-center rounded-xl px-3 py-2 border ${
                            isDark ? 'bg-[#2c2c2e] border-neutral-700' : 'bg-neutral-100 border-neutral-300'
                          }`}>
                            <KeyRound className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                            <input
                              type={showPasscodeVisible ? 'text' : 'password'}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={passcodeDraft}
                              onChange={(e) => setPasscodeDraft(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="Enter 4-6 digit PIN"
                              className="w-full bg-transparent text-xs sm:text-sm font-mono tracking-widest focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasscodeVisible(!showPasscodeVisible)}
                              className="text-neutral-400 hover:text-white text-xs px-1"
                            >
                              {showPasscodeVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (passcodeDraft.length >= 4) {
                                soundManager.playClickSound();
                                triggerHaptic('success');
                                onUpdateSettings({ lockScreenPasscode: passcodeDraft });
                                setPasscodeSavedToast(true);
                                setTimeout(() => setPasscodeSavedToast(false), 2000);
                              }
                            }}
                            disabled={passcodeDraft.length < 4}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 disabled:opacity-40 text-neutral-950 font-bold text-xs transition-colors shrink-0"
                          >
                            {passcodeSavedToast ? 'Saved!' : 'Save PIN'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Default is 1234</span>
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playClickSound();
                              setPasscodeDraft('1234');
                              onUpdateSettings({ lockScreenPasscode: '1234' });
                            }}
                            className="text-amber-400 hover:underline"
                          >
                            Reset to 1234
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Auto-Lock Timeout Selector */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Auto-Lock Inactivity Timer</p>
                        <p className="text-[11px] text-neutral-400">Lock screen automatically after period of inactivity</p>
                      </div>
                      <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 p-0.5 rounded-lg text-[10px]">
                        {[
                          { id: 'never', label: 'Never' },
                          { id: '1min', label: '1m' },
                          { id: '2min', label: '2m' },
                          { id: '5min', label: '5m' },
                        ].map((opt) => {
                          const isSelected = (settings.lockScreenAutoLockTimeout || '5min') === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                soundManager.playClickSound();
                                onUpdateSettings({ lockScreenAutoLockTimeout: opt.id as any });
                              }}
                              className={`px-2 py-1 rounded font-bold transition-colors ${
                                isSelected
                                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                                  : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Clock Typography & Layout */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Clock Typography & Layout
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'default', name: 'SF Pro Default', sample: '09:41', font: 'font-bold' },
                      { id: 'bold', name: 'Ultra Bold', sample: '09:41', font: 'font-black' },
                      { id: 'rounded', name: 'SF Rounded', sample: '09:41', font: 'font-bold font-rounded' },
                      { id: 'ethiopic', name: 'Ge’ez Heritage', sample: '09:41', font: 'font-bold font-ethiopic' },
                      { id: 'minimal', name: 'Minimal Thin', sample: '09:41', font: 'font-extralight tracking-widest' },
                      { id: 'serif', name: 'Editorial Serif', sample: '09:41', font: 'font-serif italic font-medium' },
                    ].map((styleOpt) => {
                      const isSelected = (settings.lockScreenClockStyle || 'default') === styleOpt.id;
                      return (
                        <button
                          key={styleOpt.id}
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            onUpdateSettings({ lockScreenClockStyle: styleOpt.id as any });
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10'
                              : isDark
                                ? 'bg-[#1c1c1e] border-[#2c2c2e] hover:border-neutral-600'
                                : 'bg-white border-[#e5e5ea] hover:border-neutral-400'
                          }`}
                        >
                          <div className={`text-2xl text-white my-1 ${styleOpt.font}`}>
                            {styleOpt.sample}
                          </div>
                          <div className="text-[11px] font-bold truncate mt-1">
                            {styleOpt.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Content & Visual Elements */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Lock Screen Content & Elements
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {/* Show Date */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Show Date Header</p>
                        <p className="text-[11px] text-neutral-400">Displays day and date above the clock</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.lockScreenShowDate !== false}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ lockScreenShowDate: settings.lockScreenShowDate === false });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.lockScreenShowDate !== false ? 'bg-amber-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.lockScreenShowDate !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Owner Greeting Text */}
                    <div className="p-3.5 space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold">Owner Greeting / Subtitle</label>
                      <input
                        type="text"
                        value={settings.lockScreenOwnerText || ''}
                        onChange={(e) => onUpdateSettings({ lockScreenOwnerText: e.target.value })}
                        placeholder="e.g. Habeshawi OS • Selam"
                        className={`w-full rounded-xl px-3 py-2 text-xs sm:text-sm border ${
                          isDark ? 'bg-[#2c2c2e] border-neutral-700' : 'bg-neutral-100 border-neutral-300'
                        } focus:outline-hidden`}
                      />
                    </div>

                    {/* Wallpaper Blur */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Wallpaper Blur</p>
                        <p className="text-[11px] text-neutral-400">Apply soft glassmorphism blur to lock screen background</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!!settings.lockScreenWallpaperBlur}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ lockScreenWallpaperBlur: !settings.lockScreenWallpaperBlur });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.lockScreenWallpaperBlur ? 'bg-amber-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.lockScreenWallpaperBlur ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Show Widgets Row */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Lock Screen Widgets</p>
                        <p className="text-[11px] text-neutral-400">Weather, battery, activity, and calendar chips</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.lockScreenShowWidgets !== false}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ lockScreenShowWidgets: settings.lockScreenShowWidgets === false });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.lockScreenShowWidgets !== false ? 'bg-amber-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.lockScreenShowWidgets !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Show Notifications */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Show Notifications</p>
                        <p className="text-[11px] text-neutral-400">Display incoming notification cards on lock screen</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.lockScreenShowNotifications !== false}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ lockScreenShowNotifications: settings.lockScreenShowNotifications === false });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.lockScreenShowNotifications !== false ? 'bg-amber-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.lockScreenShowNotifications !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Allow Control Center Access */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Allow Control Center Access</p>
                        <p className="text-[11px] text-neutral-400">Permit opening Control Center while locked</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.lockScreenShowControlCenter !== false}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ lockScreenShowControlCenter: settings.lockScreenShowControlCenter === false });
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                          settings.lockScreenShowControlCenter !== false ? 'bg-amber-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.lockScreenShowControlCenter !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activePage === 'display' ? (
              /* ================= SUBPAGE: DISPLAY & BRIGHTNESS ================= */
              <motion.div
                key="subpage-display"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Appearance: Light / Dark / Auto */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Appearance
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light' as ThemeMode, name: 'Light', icon: Sun, bg: 'bg-white text-neutral-900 border-neutral-300' },
                      { id: 'dark' as ThemeMode, name: 'Dark', icon: Moon, bg: 'bg-[#1c1c1e] text-white border-[#2c2c2e]' },
                      { id: 'system' as ThemeMode, name: 'System', icon: Monitor, bg: 'bg-gradient-to-r from-white to-[#1c1c1e] text-neutral-700 border-neutral-400' },
                    ].map((mode) => {
                      const isSelected = currentMode === mode.id;
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => handleModeChange(mode.id)}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                            isSelected
                              ? 'ring-2 ring-indigo-500 border-indigo-500'
                              : isDark
                                ? 'bg-[#1c1c1e] border-[#2c2c2e]'
                                : 'bg-white border-[#e5e5ea]'
                          }`}
                        >
                          <div className={`w-12 h-16 rounded-xl border flex flex-col items-center justify-center p-1 shadow-xs ${mode.bg}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold">{mode.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Accent Color Palette */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Primary Accent Color
                  </div>
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-around ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    {[
                      { color: '#8b5cf6', name: 'Harmony Purple', preset: 'oled' },
                      { color: '#3b82f6', name: 'Electric Blue', preset: 'slate' },
                      { color: '#10b981', name: 'Emerald', preset: 'axum-emerald' },
                      { color: '#f59e0b', name: 'Amber', preset: 'habeshawi-gold' },
                      { color: '#ec4899', name: 'Rose', preset: 'sheba-crimson' },
                      { color: '#06b6d4', name: 'Cyan', preset: 'slate' },
                    ].map(item => (
                      <button
                        key={item.color}
                        onClick={() => {
                          soundManager.playHapticClick();
                          onUpdateSettings({
                            accentColor: item.color,
                            themePreset: item.preset as any
                          });
                        }}
                        style={{ backgroundColor: item.color }}
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
                        title={item.name}
                      >
                        {settings.accentColor === item.color && (
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Palette */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    System Accent Presets
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {THEME_PRESETS.map((preset) => {
                      const isSelected = currentPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetChange(preset.id)}
                          className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full ${preset.dotColor} shadow-md`} />
                            <div>
                              <p className="text-xs sm:text-sm font-bold">{preset.name}</p>
                              <p className="text-[11px] text-neutral-400">{preset.tagline}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check 
                              style={{ color: settings.accentColor || '#6366f1' }}
                              className="w-4 h-4 stroke-[3]" 
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Brightness Slider */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1 flex items-center justify-between">
                    <span>Display Brightness</span>
                    <span className="text-indigo-500 font-mono text-[10px] font-semibold">
                      {Math.round((settings.brightness ?? 1) * 100)}%
                    </span>
                  </div>
                  <div className={`rounded-2xl border p-4 ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Sun className="w-4 h-4 text-neutral-400 shrink-0" />
                      <input
                        type="range"
                        min="0.4"
                        max="1"
                        step="0.05"
                        value={settings.brightness ?? 1}
                        onChange={(e) => onUpdateSettings({ brightness: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <Sun className="w-6 h-6 text-amber-400 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Eye Comfort & Night Shift */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Night Shift & Eye Comfort
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {/* Night Shift Toggle */}
                    <div className="w-full px-3.5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Night Shift</p>
                        <p className="text-[11px] text-neutral-400">Warmer screen colors to reduce eye strain</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!!settings.nightShift}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ 
                            nightShift: !settings.nightShift,
                            colorTemperature: !settings.nightShift ? 'warm' : 'standard'
                          });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.nightShift ? 'bg-amber-500' : isDark ? 'bg-[#3a3a3c]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.nightShift ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Color Temperature Options */}
                    <div className="p-3">
                      <p className="text-[11px] font-semibold text-neutral-400 mb-2">Color Temperature Tone</p>
                      <div className="grid grid-cols-3 gap-2">
                        {COLOR_TEMPERATURES.map((temp) => {
                          const isSelected = (settings.colorTemperature || 'standard') === temp.id;
                          return (
                            <button
                              key={temp.id}
                              onClick={() => {
                                soundManager.playHapticClick();
                                onUpdateSettings({
                                  colorTemperature: temp.id,
                                  nightShift: temp.id === 'warm' ? true : settings.nightShift
                                });
                              }}
                              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                isSelected
                                  ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/10'
                                  : isDark
                                    ? 'bg-[#252528] border-[#3a3a3c]'
                                    : 'bg-neutral-50 border-neutral-200'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full ${temp.accentDot} mb-1.5`} />
                              <span className="text-[11px] font-bold leading-tight">{temp.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Accessibility & Scaling */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Display Ergonomics & Accessibility
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {/* UI Display Scale */}
                    <div className="p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-semibold">Display Layout Scale</p>
                        <span className="text-indigo-500 text-xs font-semibold uppercase">
                          {settings.displayScale || 'standard'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {DISPLAY_SCALES.map((scale) => {
                          const isSelected = (settings.displayScale || 'standard') === scale.id;
                          return (
                            <button
                              key={scale.id}
                              onClick={() => {
                                soundManager.playHapticClick();
                                onUpdateSettings({ displayScale: scale.id });
                              }}
                              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                isSelected
                                  ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/10'
                                  : isDark
                                    ? 'bg-[#252528] border-[#3a3a3c]'
                                    : 'bg-neutral-50 border-neutral-200'
                              }`}
                            >
                              <span className="text-xs font-bold">{scale.name}</span>
                              <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">{scale.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* High Contrast */}
                    <div className="w-full px-3.5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">High Contrast</p>
                        <p className="text-[11px] text-neutral-400">Increase visual contrast of cards & text</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!!settings.highContrast}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ highContrast: !settings.highContrast });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.highContrast ? 'bg-indigo-500' : isDark ? 'bg-[#3a3a3c]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.highContrast ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Reduce Transparency */}
                    <div className="w-full px-3.5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Reduce Transparency</p>
                        <p className="text-[11px] text-neutral-400">Use solid surfaces instead of translucent glass</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!!settings.reduceTransparency}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ reduceTransparency: !settings.reduceTransparency });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.reduceTransparency ? 'bg-indigo-500' : isDark ? 'bg-[#3a3a3c]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.reduceTransparency ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Reduce Motion */}
                    <div className="w-full px-3.5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Reduce Motion</p>
                        <p className="text-[11px] text-neutral-400">Prefer instant transitions over springs</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!!settings.reduceMotion}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ reduceMotion: !settings.reduceMotion });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.reduceMotion ? 'bg-indigo-500' : isDark ? 'bg-[#3a3a3c]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Link to Typography */}
                <button
                  onClick={() => handleNavigate('fonts')}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left hover:opacity-90 transition-all ${
                    isDark ? 'bg-violet-950/20 border-violet-900/40 text-violet-200' : 'bg-violet-50 border-violet-200 text-violet-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Typography & Font Settings</p>
                      <p className="text-[11px] opacity-75">Configure global typeface, dynamic scale & bold text</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : activePage === 'fonts' ? (
              /* ================= SUBPAGE: TYPOGRAPHY & FONTS ================= */
              <motion.div
                key="subpage-fonts"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Global Typeface Family */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1 flex items-center justify-between">
                    <span>Global Typeface Family</span>
                    <span className="text-violet-500 text-[11px] font-semibold">
                      {SYSTEM_FONTS.find(f => f.id === (settings.fontFamily || 'system'))?.category}
                    </span>
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    {SYSTEM_FONTS.map((font) => {
                      const isSelected = (settings.fontFamily || 'system') === font.id;
                      return (
                        <button
                          key={font.id}
                          onClick={() => {
                            soundManager.playHapticClick();
                            onUpdateSettings({ fontFamily: font.id });
                          }}
                          className="w-full px-3.5 py-3 flex items-start justify-between text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex-1 pr-3">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span 
                                className="text-xs sm:text-sm font-bold"
                                style={{ fontFamily: font.previewFontFamily }}
                              >
                                {font.name}
                              </span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-violet-500 text-white font-semibold'
                                  : isDark
                                    ? 'bg-[#2c2c2e] text-neutral-400'
                                    : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {font.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mb-1.5">{font.tagline}</p>
                            <p 
                              className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                                isDark ? 'bg-[#252528] border-[#3a3a3c] text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                              }`}
                              style={{ fontFamily: font.previewFontFamily }}
                            >
                              {font.sample}
                            </p>
                          </div>
                          <div className="pt-1">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className={`w-5 h-5 rounded-full border ${isDark ? 'border-neutral-600' : 'border-neutral-300'}`} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text Size Scaling */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1 flex items-center justify-between">
                    <span>Text Size & Typography Scaling</span>
                    <span className="text-violet-500 font-mono text-[10px] font-semibold">
                      {FONT_SCALES.find(s => s.id === (settings.fontSizeScale || 'standard'))?.scalePercent} ({FONT_SCALES.find(s => s.id === (settings.fontSizeScale || 'standard'))?.sizePx})
                    </span>
                  </div>
                  <div className={`rounded-2xl border p-4 space-y-3 ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    {/* Visual Segmented Buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {FONT_SCALES.map((scale) => {
                        const isSelected = (settings.fontSizeScale || 'standard') === scale.id;
                        return (
                          <button
                            key={scale.id}
                            onClick={() => {
                              soundManager.playHapticClick();
                              onUpdateSettings({ fontSizeScale: scale.id });
                            }}
                            className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                              isSelected
                                ? 'ring-2 ring-violet-500 border-violet-500 bg-violet-500/15'
                                : isDark
                                  ? 'bg-[#252528] border-[#3a3a3c]'
                                  : 'bg-neutral-50 border-neutral-200'
                            }`}
                          >
                            <span className="text-[11px] font-bold">{scale.name}</span>
                            <span className="text-[9px] text-neutral-400">{scale.scalePercent}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 text-xs px-1">
                      <span className="text-[10px]">A (Small)</span>
                      <span className="text-base font-bold">A (Large)</span>
                    </div>
                  </div>
                </div>

                {/* Bold Text Toggle */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Accessibility & Readability
                  </div>
                  <div className={`rounded-2xl border overflow-hidden ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <div className="w-full px-3.5 py-3.5 flex items-center justify-between">
                      <div>
                        <p className={`text-xs sm:text-sm ${settings.boldText ? 'font-bold' : 'font-semibold'}`}>
                          Bold Text
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          Applies increased font-weight across headlines, body copy, and UI controls
                        </p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!!settings.boldText}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ boldText: !settings.boldText });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.boldText ? 'bg-violet-600' : isDark ? 'bg-[#3a3a3c]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.boldText ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Typography Sandbox */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Live Typography Studio
                  </div>
                  <div className={`rounded-2xl border p-4 space-y-2.5 transition-all ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-2 border-neutral-200 dark:border-neutral-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">
                        Active Type Profile
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {SYSTEM_FONTS.find(f => f.id === (settings.fontFamily || 'system'))?.name.split(' ')[0]} • {settings.fontSizeScale || 'standard'}
                      </span>
                    </div>

                    <div>
                      <h4 className={`text-sm sm:text-base ${settings.boldText ? 'font-extrabold' : 'font-bold'}`}>
                        Habeshawi Super App Universal Typography
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        Every system app, notification, launcher icon, and widget reflects this typography setting dynamically in real time.
                      </p>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => soundManager.playHapticClick()}
                        className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-xs hover:bg-violet-500 transition-colors"
                      >
                        Interactive Preview Button
                      </button>
                      <span className="text-[11px] text-neutral-400">
                        {settings.boldText ? 'Bold Weight Active' : 'Regular Weight'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activePage === 'sounds' ? (
              /* ================= SUBPAGE: SOUNDS & HAPTICS ================= */
              <motion.div
                key="subpage-sounds"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    System Master Volume
                  </div>
                  <div className={`rounded-2xl border p-4 ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-neutral-400 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.volume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          soundManager.setSettings({ volume: val });
                          onUpdateSettings({ volume: val });
                        }}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono w-10 text-right">
                        {Math.round(settings.volume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 px-1">
                    Audio & Tactile Feedback
                  </div>
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                  }`}>
                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Typewriter Mechanical Sounds</p>
                        <p className="text-[11px] text-neutral-400">Authentic key clacks in Notes & Docs</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.typewriterSounds}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ typewriterSounds: !settings.typewriterSounds });
                        }}
                        className={`w-12 h-6.5 rounded-full p-0.5 transition-colors relative ${
                          settings.typewriterSounds ? 'bg-indigo-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.typewriterSounds ? 'translate-x-5.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">Haptic Touch Vibrations</p>
                        <p className="text-[11px] text-neutral-400">Tactile pulses for buttons and gesture navigation</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings.hapticFeedback}
                        onClick={() => {
                          soundManager.playClickSound();
                          onUpdateSettings({ hapticFeedback: !settings.hapticFeedback });
                        }}
                        className={`w-12 h-6.5 rounded-full p-0.5 transition-colors relative ${
                          settings.hapticFeedback ? 'bg-indigo-500' : isDark ? 'bg-[#39393d]' : 'bg-[#e5e5ea]'
                        }`}
                      >
                        <div className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform ${
                          settings.hapticFeedback ? 'translate-x-5.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activePage === 'cloud' ? (
              /* ================= SUBPAGE: CLOUD & FIREBASE ================= */
              <motion.div
                key="subpage-cloud"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Cloud Firestore BaaS</h3>
                      <p className="text-xs text-neutral-400">Real-time sync across devices</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-neutral-300">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-neutral-400">Database ID:</span>
                      <span className="font-mono text-[11px] text-amber-400 truncate max-w-[200px]" title={firebaseConfig.firestoreDatabaseId || 'ai-studio-harmonysuperapp-85b51a1f-289a-45da-a03c-43dabe97457e'}>
                        {firebaseConfig.firestoreDatabaseId || 'ai-studio-harmonysuperapp-85b51a1f-289a-45da-a03c-43dabe97457e'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-neutral-400">Connection Status:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-neutral-400">Offline Resilience:</span>
                      <span className="text-indigo-400 font-semibold">Active (LocalStorage Cache)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentUser && !currentUser.isAnonymous ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          soundManager.playClickSound();
                          onOpenAuth?.('profile');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        <span>Manage Cloud Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          soundManager.playClickSound();
                          onOpenAuth?.('signin');
                        }}
                        className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-4 h-4 text-indigo-400" />
                        <span>Switch</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          soundManager.playClickSound();
                          onOpenAuth?.('signin');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={() => {
                          soundManager.playClickSound();
                          onOpenAuth?.('signup');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Sign Up</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activePage === 'pwa' ? (
              /* ================= SUBPAGE: PWA & OFFLINE ================= */
              <motion.div
                key="subpage-pwa"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Progressive Web App (PWA)</h3>
                      <p className="text-xs text-neutral-400">Workbox Service Worker & Native Shell</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 mb-3">
                    Habeshawi is compiled with strict Service Worker caching, enabling zero-latency launches, offline mini-apps, and full home screen installation.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-neutral-400">Service Worker:</span>
                      <span className="text-emerald-400 font-semibold">Registered & Active</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-neutral-400">Manifest:</span>
                      <span className="text-teal-400 font-semibold">manifest.json (Standalone)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ================= SUBPAGE: ABOUT HABESHAWI ================= */
              <motion.div
                key="subpage-about"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className={`p-5 rounded-2xl border text-center ${
                  isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-[#e5e5ea]'
                }`}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-600 mx-auto mb-3 shadow-lg flex items-center justify-center p-2 border border-amber-400/50">
                    <HabeshawiBrandEmblem className="w-full h-full" />
                  </div>
                  <h2 className="text-base font-bold">Habeshawi Super App</h2>
                  <p className="text-xs text-amber-400 font-semibold mb-1">Release 1.0.00 Titanium Pro (v1.0.0)</p>
                  <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                    A comprehensive cultural & productivity web operating system engineered with React 18, TypeScript, Tailwind CSS, Motion, and Firebase Firestore.
                  </p>
                </div>

                <div className={`rounded-2xl border overflow-hidden divide-y ${
                  isDark ? 'bg-[#1c1c1e] border-[#2c2c2e] divide-[#2c2c2e]' : 'bg-white border-[#e5e5ea] divide-[#e5e5ea]'
                }`}>
                  <div className="p-3 flex justify-between text-xs">
                    <span className="text-neutral-400">Design System</span>
                    <span className="font-semibold">Apple iOS HIG & Habeshawi Motif</span>
                  </div>
                  <div className="p-3 flex justify-between text-xs">
                    <span className="text-neutral-400">Cloud Backend</span>
                    <span className="font-semibold">Firebase Firestore & Auth</span>
                  </div>
                  <div className="p-3 flex justify-between text-xs">
                    <span className="text-neutral-400">PWA Offline Engine</span>
                    <span className="font-semibold">Workbox Service Worker</span>
                  </div>
                  <div className="p-3 flex justify-between text-xs">
                    <span className="text-neutral-400">TypeScript Strict Mode</span>
                    <span className="font-semibold text-emerald-400">Enabled (strict: true)</span>
                  </div>
                </div>

                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub Repository</span>
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= FOOTER / BOTTOM SAFE AREA ================= */}
        <div className={`px-4 py-3 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#1c1c1e]/90 border-[#2c2c2e]' : 'bg-[#ffffff]/90 border-[#e5e5ea]'
        }`}>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Habeshawi Titanium</span>
          </div>

          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
