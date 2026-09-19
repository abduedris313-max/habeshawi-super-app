/**
 * @file HomeScreen.tsx
 * @description Mobile Launcher for Harmony OS Super App following Apple iOS Human Interface Guidelines (HIG).
 * Features a multi-page Springboard with Smart Stack Widgets, Main App Grid (4x4/4x5/5x6), App Library folders,
 * Jiggle/Edit Launcher mode, Custom icon styles (Vibrant, Tinted Glass, Dark OLED, Monochrome), and Gestures.
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HARMONY_APPS } from '../config/apps';
import { MiniAppConfig, HarmonyNote, HarmonyWritingDraft, HarmonyCalendarEvent, Track, SystemSettings, LauncherIconStyle, LauncherGridDensity } from '../types';
import { HabeshawiAppIcon } from './HabeshawiIcons';
import { DraggablePinnedApp } from './DraggablePinnedApp';
import { 
  Search, 
  Settings, 
  User, 
  Sparkles, 
  Notebook, 
  PenTool, 
  FileText, 
  Disc, 
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon, 
  Wallet, 
  ShoppingBag, 
  Pin, 
  Plus, 
  Layers, 
  Sliders, 
  CloudSun, 
  Calculator, 
  Clock, 
  Terminal, 
  Activity,
  Bell,
  Grid,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  CheckCircle2,
  Cpu,
  Minus,
  Check,
  Palette,
  Folder,
  Zap,
  SlidersHorizontal,
  Flame,
  X
} from 'lucide-react';
import { WidgetFramework } from './widgets/WidgetFramework';
import { HomeWidgetId } from './widgets/types';
import { HarmonyLogo } from './HarmonyLogo';
import { triggerHaptic } from '../utils/haptics';
import { soundManager } from '../lib/soundManager';
import { WALLPAPER_PRESETS } from './HomeScreenSetupModal';

/**
 * Intelligent React DnD backend resolution:
 * Selects TouchBackend for touch devices with gesture hold delays,
 * and HTML5Backend for desktop mouse navigation.
 */
const getDndBackendConfig = () => {
  if (typeof window === 'undefined') {
    return { backend: HTML5Backend, options: undefined };
  }
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (hasTouch && !isFinePointer) {
    return { 
      backend: TouchBackend, 
      options: { enableMouseEvents: true, delayTouchStart: 180 } 
    };
  }
  return { backend: HTML5Backend, options: undefined };
};

interface HomeScreenProps {
  onOpenApp: (appId: string) => void;
  onOpenSpotlight: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenInstalledApps?: () => void;
  onOpenNotifications?: () => void;
  recentNotes: HarmonyNote[];
  latestDraft?: HarmonyWritingDraft;
  currentTrack?: Track | null;
  isPlayingMusic?: boolean;
  onTogglePlayMusic?: () => void;
  userDisplayName?: string | null;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  calendarEvents?: HarmonyCalendarEvent[];
  pinnedAppIds?: string[];
  installedAppIds?: string[];
  onTogglePinApp?: (appId: string) => void;
  onReorderPinnedApps?: (newPinnedAppIds: string[]) => void;
  onOpenHomeScreenSetup?: () => void;
  onOpenOnboarding?: () => void;
  enabledWidgetIds?: HomeWidgetId[];
  onUpdateWidgets?: (widgets: HomeWidgetId[]) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (updated: Partial<SystemSettings>) => void;
  wallpaperTheme?: string;
  onUpdateWallpaperTheme?: (themeId: string) => void;
  homeTrigger?: number;
}

export const HomeScreenComponent: React.FC<HomeScreenProps> = ({
  onOpenApp,
  onOpenSpotlight,
  onOpenSettings,
  onOpenAuth,
  onOpenInstalledApps,
  onOpenNotifications,
  recentNotes,
  latestDraft,
  currentTrack = null,
  isPlayingMusic = false,
  onTogglePlayMusic = () => {},
  userDisplayName,
  isDarkMode = true,
  onToggleTheme,
  calendarEvents = [],
  pinnedAppIds,
  installedAppIds,
  onTogglePinApp,
  onReorderPinnedApps,
  onOpenHomeScreenSetup,
  onOpenOnboarding,
  enabledWidgetIds = ['calendar', 'finance', 'music', 'docs-ai'],
  onUpdateWidgets,
  settings,
  onUpdateSettings,
  wallpaperTheme = 'obsidian',
  onUpdateWallpaperTheme,
  homeTrigger
}) => {
  // Select DnD backend
  const dndConfig = useMemo(() => getDndBackendConfig(), []);
  // Page state: 0 = Today / Widgets, 1 = Main App Springboard Grid, 2 = App Library Folders
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // When home gesture / bar is triggered, return to springboard Page 1
  useEffect(() => {
    if (homeTrigger && homeTrigger > 0) {
      if (currentPage !== 1) {
        setSlideDirection(1 < currentPage ? -1 : 1);
        setCurrentPage(1);
      }
    }
  }, [homeTrigger]);

  // Jiggle / Edit Home Screen Mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showQuickCustomizer, setShowQuickCustomizer] = useState<boolean>(false);
  const [libraryFilter, setLibraryFilter] = useState<string>('');

  // Long press detection for Jiggle Mode
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Gesture coordinates
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  const iconStyle: LauncherIconStyle = settings?.launcherIconStyle || 'vibrant';
  const gridDensity: LauncherGridDensity = settings?.launcherGridDensity || 'standard';
  const showLabels: boolean = settings?.launcherShowLabels !== false;
  const showPageDots: boolean = settings?.launcherShowPageDots !== false;
  const isBottomArrangement: boolean = settings?.launcherIconArrangement !== 'top';

  const handleStartLongPress = () => {
    if (settings?.launcherJiggleOnLongPress === false) return;
    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic('heavy');
      soundManager.playClickSound();
      setIsEditMode(true);
    }, 600);
  };

  const handleCancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Gesture handling: Swipe Left/Right (Paging), Swipe Up (Installed Apps), Swipe Down (Notifications)
  const handleGestureStart = (clientX: number, clientY: number, target?: EventTarget | null) => {
    // If the touch or mouse down is on a draggable app icon or interactive element, don't trigger page swipe
    if (target instanceof HTMLElement && target.closest('[data-testid^="draggable-app-"], button, a, input, select')) {
      return;
    }
    startXRef.current = clientX;
    startYRef.current = clientY;
    isPointerDownRef.current = true;
    handleStartLongPress();
  };

  const handleGestureEnd = (clientX: number, clientY: number) => {
    handleCancelLongPress();
    if (startXRef.current === null || startYRef.current === null || !isPointerDownRef.current) return;
    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;
    isPointerDownRef.current = false;
    startXRef.current = null;
    startYRef.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 40 && absY < 40) return;

    if (absY > absX) {
      if (deltaY < -40) {
        // SWIPE UP -> All Apps drawer
        triggerHaptic('swipe');
        soundManager.playClickSound();
        onOpenInstalledApps?.();
      } else if (deltaY > 40) {
        // SWIPE DOWN -> Notifications shade
        triggerHaptic('swipe');
        soundManager.playClickSound();
        onOpenNotifications?.();
      }
    } else {
      if (deltaX < -40) {
        // SWIPE LEFT -> Next Page (0 -> 1 -> 2)
        if (currentPage < 2) {
          triggerHaptic('swipe');
          soundManager.playHapticClick();
          setSlideDirection(1);
          setCurrentPage((prev) => prev + 1);
        }
      } else if (deltaX > 40) {
        // SWIPE RIGHT -> Prev Page (2 -> 1 -> 0)
        if (currentPage > 0) {
          triggerHaptic('swipe');
          soundManager.playHapticClick();
          setSlideDirection(-1);
          setCurrentPage((prev) => prev - 1);
        }
      }
    }
  };

  // Installed and Pinned applications
  const allInstalledApps = useMemo(() => {
    return HARMONY_APPS.filter(a => installedAppIds ? installedAppIds.includes(a.id) : true);
  }, [installedAppIds]);

  // Pinned applications in user customized order
  const pinnedAppsList = useMemo(() => {
    const installedSet = new Set(installedAppIds || HARMONY_APPS.map(a => a.id));
    const allMap = new Map(HARMONY_APPS.map(a => [a.id, a]));

    if (pinnedAppIds && pinnedAppIds.length > 0) {
      const result: MiniAppConfig[] = [];
      const seen = new Set<string>();

      pinnedAppIds.forEach(id => {
        if (installedSet.has(id) && allMap.has(id) && !seen.has(id)) {
          result.push(allMap.get(id)!);
          seen.add(id);
        }
      });

      return result.length > 0 ? result : allInstalledApps;
    }

    return allInstalledApps;
  }, [pinnedAppIds, installedAppIds, allInstalledApps]);

  // Local state for live drag-and-drop reordering with React DnD
  const [orderedApps, setOrderedApps] = useState<MiniAppConfig[]>(pinnedAppsList);
  const orderedAppsRef = useRef<MiniAppConfig[]>(pinnedAppsList);

  useEffect(() => {
    setOrderedApps(pinnedAppsList);
    orderedAppsRef.current = pinnedAppsList;
  }, [pinnedAppsList]);

  // Move app during drag-and-drop hover
  const moveApp = useCallback((dragIndex: number, hoverIndex: number) => {
    setOrderedApps((prev) => {
      if (
        dragIndex === hoverIndex ||
        dragIndex < 0 ||
        hoverIndex < 0 ||
        dragIndex >= prev.length ||
        hoverIndex >= prev.length
      ) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, moved);
      orderedAppsRef.current = updated;
      return updated;
    });
    triggerHaptic('light');
  }, []);

  // Commit reordered pinned applications on drop
  const handleCommitReorder = useCallback(() => {
    const currentOrder = orderedAppsRef.current;
    const newOrderIds = currentOrder.map(a => a.id);
    onReorderPinnedApps?.(newOrderIds);
    soundManager.playClickSound();
    triggerHaptic('medium');
  }, [onReorderPinnedApps]);

  // Frequently suggested apps for Page 0
  const suggestedApps = useMemo(() => {
    return allInstalledApps.slice(0, 4);
  }, [allInstalledApps]);

  // Categorized apps for Page 2 App Library
  const appCategories = useMemo(() => {
    const categories: Record<string, MiniAppConfig[]> = {
      'Productivity & AI': [],
      'Media & Audio': [],
      'Finance & Commerce': [],
      'System Utilities': []
    };

    allInstalledApps.forEach((app) => {
      if (['harmony-notes', 'harmony-docs', 'harmony-writing', 'harmony-docs-ai'].includes(app.id)) {
        categories['Productivity & AI'].push(app);
      } else if (['harmony-music-player'].includes(app.id)) {
        categories['Media & Audio'].push(app);
      } else if (['harmony-finance', 'harmony-app-store'].includes(app.id)) {
        categories['Finance & Commerce'].push(app);
      } else {
        categories['System Utilities'].push(app);
      }
    });

    return categories;
  }, [allInstalledApps]);

  const getIconComponent = (iconName: string, appId?: string) => {
    return <HabeshawiAppIcon appId={appId} iconName={iconName} className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md" />;
  };

  // Icon container style resolution based on user preferences with Habeshawi aesthetics
  const getAppIconContainerStyle = (app: MiniAppConfig, index: number) => {
    if (iconStyle === 'tinted') {
      return 'bg-amber-950/20 backdrop-blur-xl border border-amber-400/40 text-amber-300 shadow-lg';
    }
    if (iconStyle === 'dark-glass') {
      return 'bg-neutral-950/90 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/30';
    }
    if (iconStyle === 'monochrome') {
      return isDarkMode 
        ? 'bg-neutral-900 border border-neutral-700 text-white' 
        : 'bg-neutral-100 border border-neutral-300 text-neutral-900';
    }
    // Default: Vibrant Habeshawi gradients with gold/emerald/crimson border trims
    return `bg-gradient-to-br ${app.colorGradient} border border-amber-400/30 text-white shadow-lg shadow-black/40`;
  };

  // Grid column density
  const gridColumnsClass = useMemo(() => {
    if (gridDensity === 'spacious') {
      return 'grid-cols-4 gap-3 sm:gap-4';
    }
    if (gridDensity === 'compact') {
      return 'grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-2.5';
    }
    // Standard
    return 'grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3.5';
  }, [gridDensity]);

  const pageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] as const }
    })
  };

  return (
    <DndProvider backend={dndConfig.backend} options={dndConfig.options}>
      <div 
        id="home-screen" 
        onTouchStart={(e) => {
          if (e.touches.length === 1) handleGestureStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
        }}
        onTouchEnd={(e) => {
          if (e.changedTouches.length > 0) handleGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }}
        onMouseDown={(e) => handleGestureStart(e.clientX, e.clientY, e.target)}
        onMouseUp={(e) => handleGestureEnd(e.clientX, e.clientY)}
        className="flex-1 w-full h-full flex flex-col justify-between overflow-hidden px-3 pt-1 pb-1 max-w-4xl mx-auto select-none touch-none relative"
      >
      {/* ================= TOP LAUNCHER BAR (Search & Edit Mode Controls) ================= */}
      <div className="w-full max-w-md mx-auto mb-1.5 flex items-center justify-between gap-2 shrink-0 z-10">
        {/* Spotlight Search Pill */}
        <motion.button
          id="btn-spotlight-search"
          onClick={onOpenSpotlight}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-1.5 px-3 rounded-xl border flex items-center justify-between transition-all shadow-xs text-xs ${
            isDarkMode
              ? 'bg-[#161b22]/90 border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#58a6ff]'
              : 'bg-white/85 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-500'}`} />
            <span className="truncate">Search Apps & Notes...</span>
          </div>
          <kbd className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            isDarkMode
              ? 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
          }`}>⌘K</kbd>
        </motion.button>

        {/* Launcher Customization / Jiggle Mode Trigger */}
        {isEditMode ? (
          <button
            onClick={() => {
              soundManager.playClickSound();
              setIsEditMode(false);
              setShowQuickCustomizer(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-colors flex items-center gap-1 shrink-0"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Done</span>
          </button>
        ) : (
          <button
            onClick={() => {
              soundManager.playClickSound();
              setShowQuickCustomizer(!showQuickCustomizer);
            }}
            className={`p-1.5 rounded-xl border transition-all shrink-0 ${
              showQuickCustomizer
                ? 'bg-indigo-600 text-white border-indigo-500'
                : isDarkMode
                  ? 'bg-[#161b22]/90 border-[#30363d] text-neutral-400 hover:text-white'
                  : 'bg-white/85 border-neutral-200 text-neutral-600 hover:text-neutral-900'
            }`}
            title="Customize Home Screen Launcher"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ================= QUICK LAUNCHER CUSTOMIZATION BAR (when toggled) ================= */}
      <AnimatePresence>
        {showQuickCustomizer && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`w-full max-w-md mx-auto mb-2 p-2.5 rounded-2xl border shadow-xl shrink-0 z-20 ${
              isDarkMode ? 'bg-[#1c1c1e]/95 border-[#2c2c2e]' : 'bg-white/95 border-[#e5e5ea]'
            } backdrop-blur-xl`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Quick Launcher Customizer
              </span>
              <button
                onClick={() => {
                  soundManager.playClickSound();
                  onOpenSettings();
                  setShowQuickCustomizer(false);
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
              >
                <span>Full Settings</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Icon Style Selector */}
              <div>
                <label className="text-[10px] text-neutral-400 mb-1 block">App Icon Style</label>
                <select
                  value={iconStyle}
                  onChange={(e) => {
                    soundManager.playClickSound();
                    onUpdateSettings?.({ launcherIconStyle: e.target.value as LauncherIconStyle });
                  }}
                  className={`w-full py-1 px-2 rounded-lg text-xs font-semibold border ${
                    isDarkMode ? 'bg-[#2c2c2e] border-[#3a3a3c] text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <option value="vibrant">Vibrant Gradients</option>
                  <option value="tinted">Tinted Glass</option>
                  <option value="dark-glass">Obsidian OLED</option>
                  <option value="monochrome">Monochrome</option>
                </select>
              </div>

              {/* Grid Density Selector */}
              <div>
                <label className="text-[10px] text-neutral-400 mb-1 block">Grid Density</label>
                <select
                  value={gridDensity}
                  onChange={(e) => {
                    soundManager.playClickSound();
                    onUpdateSettings?.({ launcherGridDensity: e.target.value as LauncherGridDensity });
                  }}
                  className={`w-full py-1 px-2 rounded-lg text-xs font-semibold border ${
                    isDarkMode ? 'bg-[#2c2c2e] border-[#3a3a3c] text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <option value="spacious">Spacious (4×4)</option>
                  <option value="standard">Standard (4×5)</option>
                  <option value="compact">Compact (5×6)</option>
                </select>
              </div>

              {/* Icon Arrangement Selector */}
              <div>
                <label className="text-[10px] text-neutral-400 mb-1 block">Icon Arrangement</label>
                <select
                  value={settings?.launcherIconArrangement || 'bottom'}
                  onChange={(e) => {
                    soundManager.playClickSound();
                    onUpdateSettings?.({ launcherIconArrangement: e.target.value as 'bottom' | 'top' });
                  }}
                  className={`w-full py-1 px-2 rounded-lg text-xs font-semibold border ${
                    isDarkMode ? 'bg-[#2c2c2e] border-[#3a3a3c] text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-900'
                  }`}
                >
                  <option value="bottom">Bottom-Anchored (iOS 18)</option>
                  <option value="top">Top-Anchored</option>
                </select>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  soundManager.playClickSound();
                  setIsEditMode(!isEditMode);
                }}
                className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  isEditMode ? 'bg-indigo-600 text-white border-indigo-500' : 'text-neutral-300 border-neutral-700 hover:bg-white/5'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{isEditMode ? 'Exit Wiggle Mode' : 'Enter Wiggle / Edit Mode'}</span>
              </button>

              <button
                onClick={() => onOpenHomeScreenSetup?.()}
                className="text-[11px] text-neutral-400 hover:text-indigo-400 font-semibold"
              >
                Customize Wallpapers & Widgets →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MAIN PAGINATED SPRINGBOARD VIEW ================= */}
      <div className={`flex-1 w-full min-h-0 relative overflow-hidden flex flex-col ${isBottomArrangement ? 'justify-end' : 'justify-center'}`}>
        <AnimatePresence mode="wait" custom={slideDirection}>
          {currentPage === 0 ? (
            /* ================= PAGE 0: SMART STACK WIDGETS & ASSISTANT ================= */
            <motion.div
              key="page-0"
              custom={slideDirection}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full flex flex-col justify-between overflow-hidden"
            >
              {/* Widgets Framework Section */}
              <div className="w-full shrink-0">
                <WidgetFramework
                  onOpenApp={onOpenApp}
                  calendarEvents={calendarEvents}
                  recentNotes={recentNotes}
                  latestDraft={latestDraft}
                  currentTrack={currentTrack}
                  isPlayingMusic={isPlayingMusic}
                  onTogglePlayMusic={onTogglePlayMusic}
                  isDarkMode={isDarkMode}
                  enabledWidgetIds={enabledWidgetIds}
                  onUpdateWidgets={onUpdateWidgets}
                  widgetSizes={settings?.widgetSizes}
                  onUpdateWidgetSizes={(sizes) => onUpdateSettings?.({ widgetSizes: sizes })}
                />
              </div>

              {/* Siri / Harmony Quick Suggestions */}
              <div className="w-full shrink-0 mb-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 px-1 flex items-center justify-between">
                  <span>Smart App Suggestions</span>
                  <span className="text-[9px] text-amber-400">Habeshawi AI</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {suggestedApps.map((app) => (
                    <motion.div
                      key={app.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onOpenApp(app.id)}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isDarkMode ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white/80 border-neutral-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${app.colorGradient} flex items-center justify-center shrink-0`}>
                        {getIconComponent(app.iconName, app.id)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate">{app.name}</p>
                        <p className="text-[9px] text-neutral-400 truncate">Frequent</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : currentPage === 1 ? (
            /* ================= PAGE 1: PRIMARY APP SPRINGBOARD GRID ================= */
            <motion.div
              key="page-1"
              custom={slideDirection}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={`w-full h-full flex flex-col ${isBottomArrangement ? 'justify-end pb-1.5 sm:pb-3' : 'justify-center'} overflow-hidden`}
            >
              <div className={`w-full grid ${gridColumnsClass} justify-items-center ${isBottomArrangement ? 'items-end' : 'items-center'}`}>
                {orderedApps.map((app, index) => (
                  <DraggablePinnedApp
                    key={app.id}
                    app={app}
                    index={index}
                    isEditMode={isEditMode}
                    onOpenApp={onOpenApp}
                    onTogglePinApp={onTogglePinApp}
                    moveApp={moveApp}
                    onCommitReorder={handleCommitReorder}
                    iconStyle={iconStyle}
                    isDarkMode={isDarkMode}
                    showLabels={showLabels}
                    getAppIconContainerStyle={getAppIconContainerStyle}
                    getIconComponent={getIconComponent}
                  />
                ))}

                {/* System Settings App Icon */}
                <motion.div
                  whileHover={isEditMode ? {} : { scale: 1.06 }}
                  whileTap={isEditMode ? {} : { scale: 0.92 }}
                  className={`flex flex-col items-center group cursor-pointer ${
                    isEditMode ? 'animate-jiggle' : ''
                  }`}
                  onClick={() => {
                    if (!isEditMode) onOpenSettings();
                  }}
                >
                  <div className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] p-0.5 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:shadow-lg ${
                    iconStyle === 'tinted'
                      ? 'bg-white/10 backdrop-blur-xl border border-indigo-400/40 text-indigo-300'
                      : iconStyle === 'dark-glass'
                        ? 'bg-neutral-900 border border-purple-500/40 text-purple-400'
                        : iconStyle === 'monochrome'
                          ? isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-900'
                          : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-slate-200 shadow-md shadow-black/30 border border-white/20'
                  }`}>
                    <Settings className="w-6 h-6 z-10" />
                  </div>
                  {showLabels && (
                    <span className={`mt-1.5 text-[10.5px] sm:text-[11.5px] text-center tracking-tight leading-tight select-none ${
                      isDarkMode
                        ? 'text-white/95 font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]'
                        : 'text-neutral-900 font-bold drop-shadow-xs'
                    }`}>
                      Settings
                    </span>
                  )}
                </motion.div>

                {/* App Store Icon */}
                <motion.div
                  whileHover={isEditMode ? {} : { scale: 1.06 }}
                  whileTap={isEditMode ? {} : { scale: 0.92 }}
                  className={`flex flex-col items-center group cursor-pointer ${
                    isEditMode ? 'animate-jiggle-alt' : ''
                  }`}
                  onClick={() => {
                    if (!isEditMode) onOpenApp('harmony-app-store');
                  }}
                >
                  <div className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] p-0.5 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:shadow-lg ${
                    iconStyle === 'tinted'
                      ? 'bg-white/10 backdrop-blur-xl border border-blue-400/40 text-blue-300'
                      : iconStyle === 'dark-glass'
                        ? 'bg-neutral-900 border border-blue-500/40 text-blue-400'
                        : iconStyle === 'monochrome'
                          ? isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-900'
                          : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-md shadow-black/30 border border-white/20'
                  }`}>
                    <ShoppingBag className="w-6 h-6 z-10" />
                  </div>
                  {showLabels && (
                    <span className={`mt-1.5 text-[10.5px] sm:text-[11.5px] text-center tracking-tight leading-tight select-none ${
                      isDarkMode
                        ? 'text-white/95 font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]'
                        : 'text-neutral-900 font-bold drop-shadow-xs'
                    }`}>
                      App Store
                    </span>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* ================= PAGE 2: APP LIBRARY & CATEGORIES ================= */
            <motion.div
              key="page-2"
              custom={slideDirection}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full flex flex-col justify-between overflow-hidden"
            >
              <div className="w-full flex items-center justify-between mb-1.5 px-0.5 shrink-0">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span>App Library & Collections</span>
                </h2>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {allInstalledApps.length} Apps
                </span>
              </div>

              {/* Categorized App Cards (2x2 inside each folder card) */}
              <div className="w-full grid grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-y-auto">
                {Object.entries(appCategories).map(([categoryName, apps]) => {
                  if (apps.length === 0) return null;
                  return (
                    <div
                      key={categoryName}
                      className={`p-3 rounded-2xl border flex flex-col justify-between ${
                        isDarkMode ? 'bg-[#161b22]/90 border-[#30363d]' : 'bg-white/90 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold truncate">{categoryName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 font-mono">
                          {apps.length}
                        </span>
                      </div>

                      {/* Mini 2x2 icons grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {apps.slice(0, 4).map((app) => (
                          <div
                            key={app.id}
                            onClick={() => onOpenApp(app.id)}
                            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                          >
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${app.colorGradient} flex items-center justify-center shrink-0 p-0.5`}>
                              {getIconComponent(app.iconName, app.id)}
                            </div>
                            <span className="text-[10px] font-semibold truncate">{app.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Installed Applications Quick Drawer Trigger */}
              <div className="mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenInstalledApps?.()}
                  className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    isDarkMode ? 'bg-[#1c1c1e] border-[#2c2c2e] text-neutral-300' : 'bg-white border-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-indigo-400" />
                    <span>View Alphabetical List of All Applications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= BOTTOM PAGE DOTS & NAVIGATION ================= */}
      {showPageDots && (
        <div className="w-full pt-1.5 pb-0.5 flex items-center justify-between px-2 shrink-0 z-10">
          {/* Swipe Up Hint -> Installed Apps */}
          <button
            type="button"
            onClick={() => onOpenInstalledApps?.()}
            className="text-[10px] text-neutral-400 hover:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
            title="Swipe up on screen to view all installed applications"
          >
            <ArrowUp className="w-3 h-3 text-indigo-400" />
            <span className="hidden xs:inline">Swipe Up: All Apps</span>
          </button>

          {/* Interactive 3-Page Dots */}
          <div className="flex items-center gap-2 py-0.5 px-3 rounded-full bg-black/25 backdrop-blur-md border border-white/10">
            {[0, 1, 2].map((idx) => {
              const isActive = currentPage === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundManager.playHapticClick();
                    setSlideDirection(idx > currentPage ? 1 : -1);
                    setCurrentPage(idx);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    isActive 
                      ? 'w-5 bg-indigo-500 shadow-xs shadow-indigo-500/50' 
                      : 'w-2 bg-neutral-500/50 hover:bg-neutral-400'
                  }`}
                  title={`Jump to Page ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Swipe Down Hint -> Notifications */}
          <button
            type="button"
            onClick={() => onOpenNotifications?.()}
            className="text-[10px] text-neutral-400 hover:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
            title="Swipe down on screen to view notifications"
          >
            <span className="hidden xs:inline">Swipe Down: Alerts</span>
            <ArrowDown className="w-3 h-3 text-indigo-400" />
          </button>
        </div>
      )}
      </div>
    </DndProvider>
  );
};

export const HomeScreen = React.memo(HomeScreenComponent);
