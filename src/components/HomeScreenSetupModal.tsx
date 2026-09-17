/**
 * @file HomeScreenSetupModal.tsx
 * @description Dedicated Home Screen Setup & Customizer modal for Habeshawi Super App.
 * Allows users to configure Springboard layout, toggle and reorder smart widgets,
 * manage bottom dock limits and apps, and customize visual theme and wallpaper ambience.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sliders, 
  LayoutGrid, 
  Layers, 
  Smartphone, 
  Laptop, 
  Palette, 
  Check, 
  RotateCcw, 
  Sparkles, 
  ChevronUp, 
  ChevronDown,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  Disc,
  FileText,
  Notebook,
  PenTool,
  ShoppingBag
} from 'lucide-react';
import { HARMONY_APPS } from '../config/apps';
import { SystemSettings, ThemeMode } from '../types';
import { AVAILABLE_WIDGETS, HomeWidgetId, WidgetSize } from './widgets/types';
import { soundManager } from '../lib/soundManager';
import { DEFAULT_DOCK_APP_IDS, DEFAULT_WIDGET_SIZES } from '../lib/offlinePersistence';
import { HabeshawiBrandEmblem, HabeshawiTibebBorder } from './HabeshawiIcons';

interface HomeScreenSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (updated: Partial<SystemSettings>) => void;
  pinnedAppIds: string[];
  onUpdatePinnedApps: (apps: string[]) => void;
  enabledWidgetIds: HomeWidgetId[];
  onUpdateWidgets: (widgets: HomeWidgetId[]) => void;
  wallpaperTheme?: string;
  onUpdateWallpaperTheme?: (themeId: string) => void;
  onSaveToast?: (msg: string) => void;
}

export interface WallpaperPreset {
  id: string;
  name: string;
  bgClass: string; // for compatibility
  darkBgClass: string;
  lightBgClass: string;
  previewHexDark: string;
  previewHexLight: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  { 
    id: 'habeshawi-golden-highlands', 
    name: 'Abyssinian Gold', 
    bgClass: 'from-[#1a1405] via-[#2d1b06] to-[#0f0d06]',
    darkBgClass: 'from-[#1a1405] via-[#2d1b06] to-[#0f0d06]', 
    lightBgClass: 'from-[#fffbeb] via-[#fef3c7] to-[#fde68a]', 
    previewHexDark: '#d97706',
    previewHexLight: '#fef3c7'
  },
  { 
    id: 'habeshawi-emerald-rift', 
    name: 'Ethiopian Emerald', 
    bgClass: 'from-[#03201a] via-[#043b2e] to-[#021813]',
    darkBgClass: 'from-[#03201a] via-[#043b2e] to-[#021813]', 
    lightBgClass: 'from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]', 
    previewHexDark: '#059669',
    previewHexLight: '#d1fae5'
  },
  { 
    id: 'habeshawi-crimson-sun', 
    name: 'Entoto Sunset', 
    bgClass: 'from-[#1f0a0a] via-[#3b0d11] to-[#120507]',
    darkBgClass: 'from-[#1f0a0a] via-[#3b0d11] to-[#120507]', 
    lightBgClass: 'from-[#fff1f2] via-[#ffe4e6] to-[#fecdd3]', 
    previewHexDark: '#dc2626',
    previewHexLight: '#ffe4e6'
  },
  { 
    id: 'obsidian', 
    name: 'Axumite Obsidian', 
    bgClass: 'from-[#0d1117] via-[#161b22] to-[#0a0d12]',
    darkBgClass: 'from-[#0d1117] via-[#161b22] to-[#0a0d12]', 
    lightBgClass: 'from-[#f1f5f9] via-[#e2e8f0] to-[#f8fafc]', 
    previewHexDark: '#0d1117',
    previewHexLight: '#e2e8f0'
  },
  { 
    id: 'indigo-cosmic', 
    name: 'Midnight Indigo', 
    bgClass: 'from-[#0f172a] via-[#1e1b4b] to-[#0f172a]',
    darkBgClass: 'from-[#0f172a] via-[#1e1b4b] to-[#0f172a]', 
    lightBgClass: 'from-[#eef2ff] via-[#e0e7ff] to-[#f5f3ff]', 
    previewHexDark: '#1e1b4b',
    previewHexLight: '#e0e7ff'
  },
  { 
    id: 'nebula-purple', 
    name: 'Lalibela Violet', 
    bgClass: 'from-[#180d2b] via-[#2e1065] to-[#0f172a]',
    darkBgClass: 'from-[#180d2b] via-[#2e1065] to-[#0f172a]', 
    lightBgClass: 'from-[#faf5ff] via-[#f3e8ff] to-[#ede9fe]', 
    previewHexDark: '#2e1065',
    previewHexLight: '#f3e8ff'
  },
  { 
    id: 'slate-minimal', 
    name: 'Minimal Clean', 
    bgClass: 'from-[#18181b] to-[#27272a]',
    darkBgClass: 'from-[#18181b] via-[#27272a] to-[#18181b]', 
    lightBgClass: 'from-[#ffffff] via-[#f4f4f5] to-[#e4e4e7]', 
    previewHexDark: '#27272a',
    previewHexLight: '#f4f4f5'
  },
  { 
    id: 'pearl-light', 
    name: 'Pure Ceramic', 
    bgClass: 'from-[#ffffff] via-[#f8fafc] to-[#f1f5f9]',
    darkBgClass: 'from-[#1e293b] via-[#0f172a] to-[#020617]', 
    lightBgClass: 'from-[#ffffff] via-[#f8fafc] to-[#f1f5f9]', 
    previewHexDark: '#0f172a',
    previewHexLight: '#ffffff'
  },
];

export const HomeScreenSetupModal: React.FC<HomeScreenSetupModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  pinnedAppIds,
  onUpdatePinnedApps,
  enabledWidgetIds,
  onUpdateWidgets,
  wallpaperTheme = 'obsidian',
  onUpdateWallpaperTheme,
  onSaveToast
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'widgets' | 'dock' | 'ambience'>('layout');
  const isDark = settings.isDarkMode;

  if (!isOpen) return null;

  // Layout presets
  const handleApplyPreset = (preset: 'all' | 'productivity' | 'lifestyle') => {
    soundManager.playClickSound();
    if (preset === 'all') {
      onUpdatePinnedApps(HARMONY_APPS.map(a => a.id));
    } else if (preset === 'productivity') {
      onUpdatePinnedApps(['harmony-notes', 'harmony-docs', 'harmony-writing', 'harmony-docs-ai']);
    } else if (preset === 'lifestyle') {
      onUpdatePinnedApps(['harmony-calendar', 'harmony-finance', 'harmony-music-player', 'harmony-app-store']);
    }
    if (onSaveToast) onSaveToast(`Applied ${preset} home screen layout`);
  };

  const handleTogglePin = (appId: string) => {
    soundManager.playHapticClick();
    if (pinnedAppIds.includes(appId)) {
      if (pinnedAppIds.length <= 1) return;
      onUpdatePinnedApps(pinnedAppIds.filter(id => id !== appId));
    } else {
      onUpdatePinnedApps([...pinnedAppIds, appId]);
    }
  };

  const handleToggleWidget = (widgetId: HomeWidgetId) => {
    soundManager.playHapticClick();
    if (enabledWidgetIds.includes(widgetId)) {
      if (enabledWidgetIds.length <= 1) return; // Keep at least 1 widget
      onUpdateWidgets(enabledWidgetIds.filter(id => id !== widgetId));
    } else {
      onUpdateWidgets([...enabledWidgetIds, widgetId]);
    }
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    soundManager.playClickSound();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= enabledWidgetIds.length) return;
    const next = [...enabledWidgetIds];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onUpdateWidgets(next);
  };

  // Dock customization
  const currentDockAppIds = settings.dockAppIds || DEFAULT_DOCK_APP_IDS;
  const handleToggleDockApp = (appId: string) => {
    soundManager.playHapticClick();
    let next: string[];
    if (currentDockAppIds.includes(appId)) {
      if (currentDockAppIds.length <= 3) return; // Keep minimum 3
      next = currentDockAppIds.filter(id => id !== appId);
    } else {
      next = [...currentDockAppIds, appId];
    }
    onUpdateSettings({ dockAppIds: next });
  };

  const handleResetDefaults = () => {
    soundManager.playClickSound();
    onUpdatePinnedApps(HARMONY_APPS.map(a => a.id));
    onUpdateWidgets(['calendar', 'finance', 'music', 'docs-ai']);
    onUpdateSettings({
      dockAppIds: DEFAULT_DOCK_APP_IDS,
      dockMaxSmallScreen: 5,
      dockMaxLargeScreen: 7,
      themeMode: 'dark',
      isDarkMode: true,
      accentColor: '#8b5cf6'
    });
    if (onUpdateWallpaperTheme) onUpdateWallpaperTheme('obsidian');
    if (onSaveToast) onSaveToast('Reset Home Screen to factory defaults');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-2xl animate-fade-in">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className={`w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl relative border overflow-hidden transition-colors flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#14100c] border-amber-500/35 text-amber-50 shadow-amber-950/50'
            : 'bg-[#fcfaf4] border-amber-400/60 text-stone-900 shadow-stone-400/30'
        }`}
      >
        {/* Top Tibeb Ribbon Accent */}
        <div className="absolute top-0 left-0 right-0">
          <HabeshawiTibebBorder height={6} className="w-full opacity-80" />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b mb-4 pt-1 ${
          isDark ? 'border-stone-800' : 'border-stone-200'
        }`}>
          <div className="flex items-center gap-3">
            <HabeshawiBrandEmblem size={32} />
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                <span>Home Screen Setup</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                  Personalize
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Configure Springboard grid, Smart Stack widgets, dock, and visual theme
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900'
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`grid grid-cols-4 gap-1.5 p-1 rounded-2xl mb-4 text-xs font-semibold ${
          isDark ? 'bg-[#0d1117] border border-[#30363d]' : 'bg-neutral-100 border border-neutral-200'
        }`}>
          {[
            { id: 'layout', label: 'Apps Grid', icon: LayoutGrid },
            { id: 'widgets', label: 'Widgets', icon: Layers },
            { id: 'dock', label: 'Bottom Dock', icon: Sliders },
            { id: 'ambience', label: 'Ambience', icon: Palette },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClickSound();
                  setActiveTab(tab.id as any);
                }}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : isDark ? 'text-[#8b949e] hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-none space-y-4">
          {/* TAB 1: APPS GRID */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              {/* Quick Presets */}
              <div>
                <label className={`text-xs font-bold block mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Quick Layout Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyPreset('all')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      isDark ? 'bg-[#0d1117] border-[#30363d] hover:border-indigo-500' : 'bg-neutral-50 border-neutral-200 hover:border-indigo-400'
                    }`}
                  >
                    All Apps ({HARMONY_APPS.length})
                  </button>
                  <button
                    onClick={() => handleApplyPreset('productivity')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      isDark ? 'bg-[#0d1117] border-[#30363d] hover:border-indigo-500' : 'bg-neutral-50 border-neutral-200 hover:border-indigo-400'
                    }`}
                  >
                    Productivity Core
                  </button>
                  <button
                    onClick={() => handleApplyPreset('lifestyle')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      isDark ? 'bg-[#0d1117] border-[#30363d] hover:border-indigo-500' : 'bg-neutral-50 border-neutral-200 hover:border-indigo-400'
                    }`}
                  >
                    Media & Finance
                  </button>
                </div>
              </div>

              {/* App Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Springboard Pinned Apps ({pinnedAppIds.length} of {HARMONY_APPS.length})
                  </label>
                  <span className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                    Tap to toggle on home screen
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {HARMONY_APPS.map(app => {
                    const isPinned = pinnedAppIds.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleTogglePin(app.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isPinned
                            ? 'bg-indigo-600/10 border-indigo-500/60 ring-1 ring-indigo-500/30'
                            : isDark ? 'bg-[#0d1117] border-[#30363d] opacity-50' : 'bg-neutral-50 border-neutral-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: app.bgHex }}
                          >
                            {app.name.slice(0, 2)}
                          </div>
                          {isPinned ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isDark ? 'border-[#30363d] text-[#8b949e]' : 'border-neutral-300 text-neutral-400'
                            }`}>
                              <Plus className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {app.name}
                          </h4>
                          <p className={`text-[10px] truncate ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                            {app.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART WIDGETS */}
          {activeTab === 'widgets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Smart Stack Widgets ({enabledWidgetIds.length} Active)
                  </h4>
                  <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                    Active widgets appear in the scrollable top stack on your Home Screen.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {AVAILABLE_WIDGETS.map((widget) => {
                  const isEnabled = enabledWidgetIds.includes(widget.id);
                  const activeIndex = enabledWidgetIds.indexOf(widget.id);
                  const currentSize = (settings.widgetSizes && settings.widgetSizes[widget.id]) || widget.defaultSize || 'small';

                  return (
                    <div
                      key={widget.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                        isEnabled
                          ? isDark ? 'bg-[#0d1117] border-indigo-500/40' : 'bg-white border-indigo-200 shadow-sm'
                          : isDark ? 'bg-[#0d1117]/50 border-[#30363d] opacity-60' : 'bg-neutral-50 border-neutral-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleWidget(widget.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                              isEnabled
                                ? 'bg-indigo-600 text-white'
                                : isDark ? 'border border-[#30363d] bg-[#21262d]' : 'border border-neutral-300 bg-white'
                            }`}
                          >
                            {isEnabled && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {widget.title}
                              </h4>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                                isDark ? 'bg-[#21262d] border-[#30363d] text-[#8b949e]' : 'bg-neutral-100 border-neutral-200 text-neutral-500'
                              }`}>
                                {widget.category}
                              </span>
                            </div>
                            <p className={`text-[11px] truncate ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                              {widget.description}
                            </p>
                          </div>
                        </div>

                        {/* Reorder Buttons if Active */}
                        {isEnabled && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMoveWidget(activeIndex, 'up')}
                              disabled={activeIndex === 0}
                              className={`p-1 rounded-lg border text-xs disabled:opacity-30 ${
                                isDark ? 'bg-[#21262d] border-[#30363d] text-neutral-300' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                              }`}
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveWidget(activeIndex, 'down')}
                              disabled={activeIndex === enabledWidgetIds.length - 1}
                              className={`p-1 rounded-lg border text-xs disabled:opacity-30 ${
                                isDark ? 'bg-[#21262d] border-[#30363d] text-neutral-300' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                              }`}
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* S/M/L Size Pill */}
                      {isEnabled && (
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-700/20 text-[10px]">
                          <span className={isDark ? 'text-[#8b949e]' : 'text-neutral-500'}>Widget Card Size:</span>
                          <div className="flex items-center gap-1">
                            {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  soundManager.playHapticClick();
                                  const updatedSizes = {
                                    ...(settings.widgetSizes || DEFAULT_WIDGET_SIZES),
                                    [widget.id]: sz,
                                  };
                                  onUpdateSettings({ widgetSizes: updatedSizes });
                                }}
                                className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold capitalize transition-all ${
                                  currentSize === sz
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : isDark ? 'bg-[#21262d] text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {sz === 'small' ? 'S (1×1)' : sz === 'medium' ? 'M (2×1)' : 'L (2×2)'}
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
          )}

          {/* TAB 3: BOTTOM DOCK */}
          {activeTab === 'dock' && (
            <div className="space-y-4">
              <div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Responsive Screen Limits
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                  Default: 5 apps on mobile screens (&lt;640px) and 7 apps on larger tablet/desktop displays.
                </p>
              </div>

              {/* Screen Limits Steppers */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      Mobile Screen Max
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => onUpdateSettings({ dockMaxSmallScreen: Math.max(3, (settings.dockMaxSmallScreen || 5) - 1) })}
                      className={`w-7 h-7 rounded-lg border font-bold text-xs ${
                        isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-white border-neutral-200'
                      }`}
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-base text-indigo-400">
                      {settings.dockMaxSmallScreen || 5} apps
                    </span>
                    <button
                      onClick={() => onUpdateSettings({ dockMaxSmallScreen: Math.min(6, (settings.dockMaxSmallScreen || 5) + 1) })}
                      className={`w-7 h-7 rounded-lg border font-bold text-xs ${
                        isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-white border-neutral-200'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      Desktop Screen Max
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => onUpdateSettings({ dockMaxLargeScreen: Math.max(4, (settings.dockMaxLargeScreen || 7) - 1) })}
                      className={`w-7 h-7 rounded-lg border font-bold text-xs ${
                        isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-white border-neutral-200'
                      }`}
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-base text-indigo-400">
                      {settings.dockMaxLargeScreen || 7} apps
                    </span>
                    <button
                      onClick={() => onUpdateSettings({ dockMaxLargeScreen: Math.min(8, (settings.dockMaxLargeScreen || 7) + 1) })}
                      className={`w-7 h-7 rounded-lg border font-bold text-xs ${
                        isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-white border-neutral-200'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dock Apps Selection */}
              <div>
                <label className={`text-xs font-bold block mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Apps Pinned to Dock ({currentDockAppIds.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HARMONY_APPS.map(app => {
                    const inDock = currentDockAppIds.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleToggleDockApp(app.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          inDock
                            ? 'bg-indigo-600/15 border-indigo-500'
                            : isDark ? 'bg-[#0d1117] border-[#30363d] opacity-50' : 'bg-neutral-50 border-neutral-200 opacity-50'
                        }`}
                      >
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {app.name}
                        </span>
                        {inDock && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AMBIENCE & WALLPAPERS */}
          {activeTab === 'ambience' && (
            <div className="space-y-4">
              <div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Atmospheric Wallpaper
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                  Choose a rich background gradient to style your home screen experience.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WALLPAPER_PRESETS.map(preset => {
                  const isSelected = wallpaperTheme === preset.id;
                  const bgGradient = isDark ? preset.darkBgClass : preset.lightBgClass;
                  const previewColor = isDark ? preset.previewHexDark : preset.previewHexLight;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        soundManager.playClickSound();
                        if (onUpdateWallpaperTheme) onUpdateWallpaperTheme(preset.id);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                          : isDark ? 'border-[#30363d]' : 'border-neutral-300'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-90`} />
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className={`text-xs font-bold drop-shadow-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          {preset.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="relative z-10 w-4 h-4 rounded-full border border-black/20 dark:border-white/40 shadow-xs" style={{ backgroundColor: previewColor }} />
                    </button>
                  );
                })}
              </div>

              {/* Accent Palette */}
              <div className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <label className={`text-xs font-bold block mb-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Primary Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      onClick={() => onUpdateSettings({ accentColor: color })}
                      style={{ backgroundColor: color }}
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
                    >
                      {settings.accentColor === color && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`pt-4 border-t flex items-center justify-between mt-3 ${
          isDark ? 'border-[#30363d]' : 'border-neutral-200'
        }`}>
          <button
            onClick={handleResetDefaults}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isDark ? 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border-[#30363d]' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done & Apply</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
