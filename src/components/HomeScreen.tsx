/**
 * @file HomeScreen.tsx
 * @description Completely Redesigned Super App Landing Page & Command Hub for Habeshawi Super App.
 * Combines Apple iOS 18 Human Interface Guidelines (HIG) clarity, deference, and tactile gesture ergonomics
 * with a responsive multi-column Super App Bento Command Hub, drag-and-drop Springboard, Smart Stack Widgets,
 * and direct standalone window routing ({base_url}/{mini-app-name}).
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HARMONY_APPS, getMiniAppPath, getMiniAppUrl } from '../config/apps';
import {
  MiniAppConfig,
  HarmonyNote,
  HarmonyWritingDraft,
  HarmonyCalendarEvent,
  Track,
  SystemSettings,
  LauncherIconStyle,
  LauncherGridDensity
} from '../types';
import { HabeshawiAppIcon } from './HabeshawiIcons';
import { DraggablePinnedApp } from './DraggablePinnedApp';
import {
  Search,
  Settings,
  User,
  Sparkles,
  Notebook,
  Disc,
  ChevronRight,
  Calendar as CalendarIcon,
  Wallet,
  ShoppingBag,
  Pin,
  Layers,
  Bell,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Check,
  Folder,
  Zap,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Maximize2,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Mic,
  Compass,
  Grid,
  CreditCard,
  Clock
} from 'lucide-react';
import { WidgetFramework } from './widgets/WidgetFramework';
import { HomeWidgetId } from './widgets/types';
import { triggerHaptic } from '../utils/haptics';
import { soundManager } from '../lib/soundManager';
import {
  getLocalItem,
  STORAGE_KEYS,
  INITIAL_OFFLINE_FINANCE_ACCOUNTS,
  INITIAL_OFFLINE_FINANCE_TRANSACTIONS,
  INITIAL_OFFLINE_FINANCE_BUDGETS
} from '../lib/offlinePersistence';
import { FinanceAccount, FinanceTransaction, FinanceBudget } from '../apps/finance/types';

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

/**
 * Computes approximate Ethiopian Calendar date string from a Gregorian Date
 * for authentic Habeshawi Super App header context.
 */
const getEthiopianDateSummary = (date: Date): string => {
  const ethMonths = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
  ];
  const gYear = date.getFullYear();
  const startOfEthYear = new Date(gYear, 8, 11); // Sept 11
  let ethYear = gYear - 7;
  let diffDays = Math.floor((date.getTime() - startOfEthYear.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    ethYear = gYear - 8;
    const prevStart = new Date(gYear - 1, 8, 11);
    diffDays = Math.floor((date.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  const monthIndex = Math.min(12, Math.floor(diffDays / 30));
  const dayOfMonth = (diffDays % 30) + 1;
  return `${ethMonths[monthIndex]} ${dayOfMonth}, ${ethYear}`;
};

export interface HomeScreenProps {
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

type LandingWorkspaceTab = 'hub' | 'springboard' | 'widgets' | 'directory';
type LaunchpadCategoryFilter = 'all' | 'productivity' | 'ai' | 'finance-tools';

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
  calendarEvents = [],
  pinnedAppIds,
  installedAppIds,
  onTogglePinApp,
  onReorderPinnedApps,
  onOpenHomeScreenSetup,
  enabledWidgetIds = ['calendar', 'finance', 'music', 'docs-ai'],
  onUpdateWidgets,
  settings,
  onUpdateSettings,
  homeTrigger
}) => {
  const dndConfig = useMemo(() => getDndBackendConfig(), []);

  // Primary Workspace View:
  // 'hub' (1) = Unified Super App Command Hub (Default Landing View)
  // 'springboard' (0) = Classic Full-Screen App Icon Grid
  // 'widgets' (2) = Smart Stack Widgets Studio
  // 'directory' (3) = Full Ecosystem Directory & Standalone Launcher
  const [activeTab, setActiveTab] = useState<LandingWorkspaceTab>('hub');
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Launchpad presentation mode on Hub: 'cards' (Super App bento cards) or 'icons' (Draggable iOS squircles)
  const [hubLaunchpadView, setHubLaunchpadView] = useState<'icons' | 'cards'>('icons');
  const [launchpadCategory, setLaunchpadCategory] = useState<LaunchpadCategoryFilter>('all');

  // Jiggle / Edit Home Screen Mode & Quick Customizer Drawer
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showQuickCustomizer, setShowQuickCustomizer] = useState<boolean>(false);

  // Directory search & filter state
  const [directoryQuery, setDirectoryQuery] = useState<string>('');
  const [appLibraryTypeFilter, setAppLibraryTypeFilter] = useState<'all' | 'system' | 'user'>('all');

  // Live Finance Telemetry from Persistent Storage
  const [financeTick, setFinanceTick] = useState<number>(0);

  useEffect(() => {
    const handleStorageRefresh = () => setFinanceTick((t) => t + 1);
    window.addEventListener('storage', handleStorageRefresh);
    window.addEventListener('focus', handleStorageRefresh);
    return () => {
      window.removeEventListener('storage', handleStorageRefresh);
      window.removeEventListener('focus', handleStorageRefresh);
    };
  }, []);

  const financeSummary = useMemo(() => {
    const accounts = getLocalItem<FinanceAccount[]>(
      STORAGE_KEYS.FINANCE_ACCOUNTS,
      INITIAL_OFFLINE_FINANCE_ACCOUNTS
    );
    const transactions = getLocalItem<FinanceTransaction[]>(
      STORAGE_KEYS.FINANCE_TRANSACTIONS,
      INITIAL_OFFLINE_FINANCE_TRANSACTIONS
    );
    const budgets = getLocalItem<FinanceBudget[]>(
      STORAGE_KEYS.FINANCE_BUDGETS,
      INITIAL_OFFLINE_FINANCE_BUDGETS
    );

    const netWorth = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    transactions.forEach((tx) => {
      if (tx.date?.startsWith(currentMonthPrefix)) {
        if (tx.type === 'income') monthlyIncome += Number(tx.amount) || 0;
        if (tx.type === 'expense') monthlyExpense += Number(tx.amount) || 0;
      }
    });

    const totalBudgetLimit = budgets.reduce((sum, b) => sum + (Number(b.monthlyLimit) || 0), 0) || 1500;
    const budgetUtilization = Math.min(100, Math.round((monthlyExpense / totalBudgetLimit) * 100));

    return {
      netWorth,
      monthlyIncome,
      monthlyExpense,
      netFlow: monthlyIncome - monthlyExpense,
      budgetUtilization,
      accountCount: accounts.length,
      txCount: transactions.length
    };
  }, [financeTick]);

  // Return to main Hub when home gesture / bar is triggered
  useEffect(() => {
    if (homeTrigger && homeTrigger > 0) {
      setActiveTab('hub');
      setIsEditMode(false);
      setShowQuickCustomizer(false);
    }
  }, [homeTrigger]);

  // Long press detection for Jiggle Mode
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);

  const iconStyle: LauncherIconStyle = settings?.launcherIconStyle || 'vibrant';
  const gridDensity: LauncherGridDensity = settings?.launcherGridDensity || 'standard';
  const showLabels: boolean = settings?.launcherShowLabels !== false;
  const showPageDots: boolean = settings?.launcherShowPageDots !== false;

  const tabOrder: LandingWorkspaceTab[] = ['springboard', 'hub', 'widgets', 'directory'];
  const currentTabIndex = tabOrder.indexOf(activeTab);

  const handleSelectTab = (nextTab: LandingWorkspaceTab) => {
    const nextIdx = tabOrder.indexOf(nextTab);
    if (nextIdx === currentTabIndex) return;
    soundManager.playHapticClick();
    triggerHaptic('selection');
    setSlideDirection(nextIdx > currentTabIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  const handleStartLongPress = () => {
    if (settings?.launcherJiggleOnLongPress === false) return;
    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic('heavy');
      soundManager.playClickSound();
      setIsEditMode(true);
    }, 650);
  };

  const handleCancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleGestureStart = (clientX: number, clientY: number, target?: EventTarget | null) => {
    if (
      target instanceof HTMLElement &&
      target.closest('[data-testid^="draggable-app-"], button, a, input, select')
    ) {
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

    if (absX < 50 && absY < 50) return;

    if (absX > absY * 1.3) {
      if (deltaX < -50 && currentTabIndex < tabOrder.length - 1) {
        handleSelectTab(tabOrder[currentTabIndex + 1]);
      } else if (deltaX > 50 && currentTabIndex > 0) {
        handleSelectTab(tabOrder[currentTabIndex - 1]);
      }
    }
  };

  // Installed and Pinned applications
  const allInstalledApps = useMemo(() => {
    return HARMONY_APPS.filter((a) => (installedAppIds ? installedAppIds.includes(a.id) : true));
  }, [installedAppIds]);

  const pinnedAppsList = useMemo(() => {
    const installedSet = new Set(installedAppIds || HARMONY_APPS.map((a) => a.id));
    const allMap = new Map(HARMONY_APPS.map((a) => [a.id, a]));

    if (pinnedAppIds && pinnedAppIds.length > 0) {
      const result: MiniAppConfig[] = [];
      const seen = new Set<string>();

      pinnedAppIds.forEach((id) => {
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

  const handleCommitReorder = useCallback(() => {
    const currentOrder = orderedAppsRef.current;
    const newOrderIds = currentOrder.map((a) => a.id);
    onReorderPinnedApps?.(newOrderIds);
    soundManager.playClickSound();
    triggerHaptic('medium');
  }, [onReorderPinnedApps]);

  // Filtered apps for the Hub Launchpad
  const filteredLaunchpadApps = useMemo(() => {
    if (launchpadCategory === 'all') return orderedApps;
    return orderedApps.filter((app) => {
      if (launchpadCategory === 'productivity') {
        return ['harmony-notes', 'harmony-docs', 'harmony-writing', 'harmony-calendar', 'harmony-ajam-script', 'harmony-focus', 'harmony-habits'].includes(app.id);
      }
      if (launchpadCategory === 'ai') {
        return ['harmony-docs-ai', 'harmony-voice', 'harmony-music-player'].includes(app.id);
      }
      if (launchpadCategory === 'finance-tools') {
        return ['harmony-finance', 'harmony-app-store', 'harmony-weather', 'harmony-calculator', 'harmony-terminal'].includes(app.id);
      }
      return true;
    });
  }, [orderedApps, launchpadCategory]);

  // System & User apps for Directory
  const systemAppsList = useMemo(() => {
    return allInstalledApps.filter((app) => app.isSystemApp === true || app.appType === 'system');
  }, [allInstalledApps]);

  const userAppsList = useMemo(() => {
    return allInstalledApps.filter((app) => !app.isSystemApp && app.appType !== 'system');
  }, [allInstalledApps]);

  const filteredDirectoryApps = useMemo(() => {
    const baseList =
      appLibraryTypeFilter === 'system'
        ? systemAppsList
        : appLibraryTypeFilter === 'user'
          ? userAppsList
          : allInstalledApps;

    if (!directoryQuery.trim()) return baseList;
    const q = directoryQuery.toLowerCase();
    return baseList.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        (app.tagline && app.tagline.toLowerCase().includes(q)) ||
        (app.category && app.category.toLowerCase().includes(q)) ||
        getMiniAppPath(app).toLowerCase().includes(q)
    );
  }, [allInstalledApps, systemAppsList, userAppsList, appLibraryTypeFilter, directoryQuery]);

  // Greeting & Date Context
  const { greetingText, gregorianDateStr, ethiopianDateStr } = useMemo(() => {
    const now = new Date();
    const hr = now.getHours();
    const greeting =
      hr < 12 ? 'Selam · Good Morning' : hr < 17 ? 'Selam · Good Afternoon' : 'Selam · Good Evening';
    const greg = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const eth = getEthiopianDateSummary(now);
    return { greetingText: greeting, gregorianDateStr: greg, ethiopianDateStr: eth };
  }, []);

  const upcomingEvent = useMemo(() => {
    if (!calendarEvents || calendarEvents.length === 0) return null;
    return calendarEvents[0];
  }, [calendarEvents]);

  const latestNote = useMemo(() => {
    if (!recentNotes || recentNotes.length === 0) return null;
    return recentNotes[0];
  }, [recentNotes]);

  const getIconComponent = (iconName: string, appId?: string) => {
    return <HabeshawiAppIcon appId={appId} iconName={iconName} className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md" />;
  };

  const getAppIconContainerStyle = (app: MiniAppConfig, _index: number) => {
    if (iconStyle === 'tinted') {
      return 'bg-amber-950/25 backdrop-blur-xl border border-amber-400/40 text-amber-300 shadow-lg';
    }
    if (iconStyle === 'dark-glass') {
      return 'bg-neutral-950/90 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/30';
    }
    if (iconStyle === 'monochrome') {
      return isDarkMode
        ? 'bg-neutral-900 border border-neutral-700 text-white'
        : 'bg-neutral-100 border border-neutral-300 text-neutral-900';
    }
    return `bg-gradient-to-br ${app.colorGradient} border border-white/25 text-white shadow-lg shadow-black/30`;
  };

  const gridColumnsClass = useMemo(() => {
    if (gridDensity === 'spacious') {
      return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3.5 sm:gap-5';
    }
    if (gridDensity === 'compact') {
      return 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3.5';
    }
    return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 sm:gap-4';
  }, [gridDensity]);

  const handleOpenInSeparateWindow = (e: React.MouseEvent, app: MiniAppConfig) => {
    e.stopPropagation();
    soundManager.playClickSound();
    triggerHaptic('light');
    window.open(getMiniAppUrl(app), '_blank', 'noopener,noreferrer');
  };

  const pageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] as const }
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
        className="flex-1 w-full h-full flex flex-col justify-between overflow-hidden px-3 sm:px-6 lg:px-8 pt-2 pb-1 max-w-7xl mx-auto select-none relative"
      >
        {/* ================= SUPER APP COMMAND HEADER ================= */}
        <div className="w-full shrink-0 z-20 mb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Left: Cultural Greeting & Dual Calendar Metadata */}
            <div className="flex items-center justify-between md:justify-start gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  <span>{gregorianDateStr}</span>
                  <span className="opacity-50">·</span>
                  <span>{ethiopianDateStr}</span>
                </div>
                <h1
                  className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {greetingText}
                  {userDisplayName ? `, ${userDisplayName.split(' ')[0]}` : ''}
                </h1>
              </div>

              {/* Mobile Action Triggers */}
              <div className="flex md:hidden items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenSpotlight}
                  className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center transition-colors ${
                    isDarkMode
                      ? 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white'
                      : 'bg-white/85 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                  title="Spotlight Search (⌘K)"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClickSound();
                    setShowQuickCustomizer(!showQuickCustomizer);
                  }}
                  className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center transition-colors ${
                    showQuickCustomizer || isEditMode
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                      : isDarkMode
                        ? 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white'
                        : 'bg-white/85 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                  title="Customize Workspace"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center transition-colors ${
                    isDarkMode
                      ? 'bg-slate-900/80 border-white/10 text-amber-400 hover:bg-slate-800'
                      : 'bg-white/85 border-slate-200 text-amber-600 hover:bg-slate-100'
                  }`}
                  title="Account & Cloud Sync"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right / Center: Segmented Workspace Switcher + Desktop Spotlight & Controls */}
            <div className="flex items-center justify-between md:justify-end gap-2">
              {/* Interactive Segmented Workspace Navigation */}
              <div
                role="tablist"
                aria-label="Super App Workspace Views"
                className={`p-1 rounded-xl border flex items-center gap-0.5 flex-1 md:flex-initial ${
                  isDarkMode
                    ? 'bg-slate-900/85 border-white/10 backdrop-blur-xl'
                    : 'bg-white/85 border-slate-200/90 backdrop-blur-xl shadow-2xs'
                }`}
              >
                {(
                  [
                    { id: 'hub', label: 'Command Hub', icon: Compass },
                    { id: 'springboard', label: 'Apps', icon: Grid },
                    { id: 'widgets', label: 'Widgets', icon: Layers },
                    { id: 'directory', label: 'Directory', icon: Folder }
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={active}
                      type="button"
                      onClick={() => handleSelectTab(tab.id)}
                      className={`flex-1 md:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? isDarkMode
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                            : 'bg-slate-900 text-white shadow-sm font-bold'
                          : isDarkMode
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Spotlight Search Trigger */}
              <motion.button
                id="btn-spotlight-search"
                type="button"
                onClick={onOpenSpotlight}
                whileTap={{ scale: 0.98 }}
                className={`hidden md:flex py-2 px-3.5 rounded-xl border items-center justify-between gap-4 transition-all text-xs min-w-[210px] lg:min-w-[250px] cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900/85 border-white/10 text-slate-400 hover:text-white hover:border-amber-500/50'
                    : 'bg-white/85 border-slate-200/90 text-slate-500 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Search apps, notes, docs...</span>
                </span>
                <kbd
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  ⌘K
                </kbd>
              </motion.button>

              {/* Desktop Edit / Customize & Profile Buttons */}
              <div className="hidden md:flex items-center gap-1.5">
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setIsEditMode(false);
                      setShowQuickCustomizer(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Done</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setShowQuickCustomizer(!showQuickCustomizer);
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      showQuickCustomizer
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : isDarkMode
                          ? 'bg-slate-900/85 border-white/10 text-slate-300 hover:text-white'
                          : 'bg-white/85 border-slate-200 text-slate-700 hover:text-slate-900'
                    }`}
                    title="Customize Launcher & Theme"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenAuth}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-900/85 border-white/10 text-slate-200 hover:border-amber-500/40'
                      : 'bg-white/85 border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                  title="Account & Cloud Sync"
                >
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span className="max-w-[90px] truncate">{userDisplayName || 'Account'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= QUICK CUSTOMIZER DRAWER ================= */}
        <AnimatePresence>
          {showQuickCustomizer && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`w-full mb-2.5 p-3 rounded-2xl border shadow-xl shrink-0 z-30 ${
                isDarkMode
                  ? 'bg-slate-900/95 border-white/15 text-white'
                  : 'bg-white/95 border-slate-200 text-slate-900'
              } backdrop-blur-2xl`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  Super App Workspace Customizer
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      onOpenSettings();
                      setShowQuickCustomizer(false);
                    }}
                    className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>System Settings</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickCustomizer(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1 block">
                    App Icon Aesthetics
                  </label>
                  <select
                    value={iconStyle}
                    onChange={(e) => {
                      soundManager.playClickSound();
                      onUpdateSettings?.({ launcherIconStyle: e.target.value as LauncherIconStyle });
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold border ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="vibrant">Vibrant Habeshawi Gradients</option>
                    <option value="tinted">Tinted Gold Glass</option>
                    <option value="dark-glass">Obsidian OLED</option>
                    <option value="monochrome">Minimal Monochrome</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1 block">
                    Springboard Grid Density
                  </label>
                  <select
                    value={gridDensity}
                    onChange={(e) => {
                      soundManager.playClickSound();
                      onUpdateSettings?.({ launcherGridDensity: e.target.value as LauncherGridDensity });
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold border ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="spacious">Spacious (4×4)</option>
                    <option value="standard">Standard (4×5)</option>
                    <option value="compact">Compact (5×6)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1 block">
                    Hub Launchpad Layout
                  </label>
                  <select
                    value={hubLaunchpadView}
                    onChange={(e) => {
                      soundManager.playClickSound();
                      setHubLaunchpadView(e.target.value as 'icons' | 'cards');
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold border ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="icons">Draggable Squircle Icons</option>
                    <option value="cards">Super App Bento Cards</option>
                  </select>
                </div>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClickSound();
                    setIsEditMode(!isEditMode);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isEditMode
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : isDarkMode
                        ? 'text-slate-200 border-slate-700 hover:bg-white/5'
                        : 'text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isEditMode ? 'Exit Reorder Mode' : 'Reorder Pinned Apps'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCustomizer(false);
                    onOpenHomeScreenSetup?.();
                  }}
                  className="text-xs text-amber-500 hover:text-amber-400 font-semibold cursor-pointer"
                >
                  Wallpapers, Themes & Widgets Studio →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= MAIN WORKSPACE CANVAS ================= */}
        <div className="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait" custom={slideDirection}>
            {activeTab === 'hub' ? (
              /* =========================================================================
               * TAB 1: UNIFIED SUPER APP COMMAND HUB (DEFAULT LANDING EXPERIENCE)
               * ========================================================================= */
              <motion.div
                key="workspace-hub"
                custom={slideDirection}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full overflow-y-auto pr-0.5 pb-3 space-y-3.5 overscroll-contain"
              >
                {/* 1. LIVE ECOSYSTEM PULSE BENTO ROW */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3">
                  {/* Card A: Habeshawi Finance & Wealth Pulse (5 cols on desktop) */}
                  <div
                    onClick={() => onOpenApp('harmony-finance')}
                    className={`md:col-span-5 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                      isDarkMode
                        ? 'bg-slate-900/80 hover:bg-slate-900/95 border-white/10 hover:border-emerald-500/40 shadow-lg shadow-black/25'
                        : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-emerald-400 shadow-sm'
                    } backdrop-blur-xl`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xs">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 block font-semibold">
                            HABESHAWI FINANCE · LIVE LEDGER
                          </span>
                          <h2 className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            Total Net Worth & Cash Flow
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            const finApp = HARMONY_APPS.find((a) => a.id === 'harmony-finance');
                            if (finApp) handleOpenInSeparateWindow(e, finApp);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isDarkMode
                              ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                              : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                          title="Open Habeshawi Finance in Separate Window (/harmony-finance)"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-3 my-1">
                      <div>
                        <p
                          className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          ${financeSummary.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {financeSummary.accountCount} Active Accounts · {financeSummary.txCount} Ledger Entries
                        </p>
                      </div>

                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${
                            financeSummary.netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {financeSummary.netFlow >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {financeSummary.netFlow >= 0 ? '+' : '-'}$
                            {Math.abs(financeSummary.netFlow).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <span className="block text-[10px] text-slate-400 font-mono">This Month Net</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-3 font-mono tabular-nums">
                        <span className="text-emerald-500 font-semibold">
                          In: +${financeSummary.monthlyIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-rose-400 font-semibold">
                          Out: -${financeSummary.monthlyExpense.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <span className="text-emerald-500 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Ledger</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Card B: Schedule & Knowledge Brief (4 cols on desktop) */}
                  <div
                    className={`md:col-span-4 p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between ${
                      isDarkMode
                        ? 'bg-slate-900/80 border-white/10 shadow-lg shadow-black/25'
                        : 'bg-white/90 border-slate-200/90 shadow-sm'
                    } backdrop-blur-xl`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-xs">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 block font-semibold">
                            AGENDA & NOTES
                          </span>
                          <h2 className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            Daily Workspace Brief
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenApp('harmony-calendar')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'border-white/10 text-slate-300 hover:bg-white/10'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Calendar
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenApp('harmony-notes')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'border-white/10 text-slate-300 hover:bg-white/10'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Notes
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 my-1">
                      {/* Next Calendar Event */}
                      <div
                        onClick={() => onOpenApp('harmony-calendar')}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isDarkMode
                            ? 'bg-slate-950/60 border-white/5 hover:border-amber-500/30'
                            : 'bg-slate-50 border-slate-200/70 hover:border-amber-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-amber-500 block">
                            UPCOMING EVENT
                          </span>
                          <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {upcomingEvent ? upcomingEvent.title : 'Tri-Calendar Sync Ready'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {upcomingEvent ? upcomingEvent.startTime || upcomingEvent.gregorianDate : ethiopianDateStr.split(',')[0]}
                        </span>
                      </div>

                      {/* Latest Note Snippet */}
                      <div
                        onClick={() => onOpenApp('harmony-notes')}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isDarkMode
                            ? 'bg-slate-950/60 border-white/5 hover:border-amber-500/30'
                            : 'bg-slate-50 border-slate-200/70 hover:border-amber-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-400 block">
                            RECENT NOTE ({recentNotes.length})
                          </span>
                          <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {latestNote ? latestNote.title : 'Tap to capture a quick note'}
                          </p>
                        </div>
                        <Notebook className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Card C: Audio & Intelligence Deck (3 cols on desktop) */}
                  <div
                    className={`md:col-span-3 p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between ${
                      isDarkMode
                        ? 'bg-slate-900/80 border-white/10 shadow-lg shadow-black/25'
                        : 'bg-white/90 border-slate-200/90 shadow-sm'
                    } backdrop-blur-xl`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-400 font-semibold">
                        MEDIA & AI STUDIO
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenApp('harmony-music-player')}
                        className="text-[10px] font-semibold text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Player</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Music Mini Deck */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 mb-2 ${
                        isDarkMode ? 'bg-slate-950/70 border-white/5' : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div
                        onClick={() => onOpenApp('harmony-music-player')}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                          <Disc className={`w-4 h-4 ${isPlayingMusic ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {currentTrack?.title || 'Ethio-Jazz Synth'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {currentTrack?.artist || 'Habeshawi Sound'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playClickSound();
                          onTogglePlayMusic();
                        }}
                        className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        title={isPlayingMusic ? 'Pause' : 'Play'}
                      >
                        {isPlayingMusic ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                      </button>
                    </div>

                    {/* Quick AI & Voice Launchers */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenApp('harmony-docs-ai')}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                          isDarkMode
                            ? 'bg-violet-500/10 border-violet-500/25 hover:bg-violet-500/20 text-violet-200'
                            : 'bg-violet-50 border-violet-200 hover:bg-violet-100 text-violet-900'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="text-[11px] font-bold truncate">AI Copilot</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenApp('harmony-voice')}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                          isDarkMode
                            ? 'bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-500/20 text-cyan-200'
                            : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-900'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-[11px] font-bold truncate">Voice Live</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. PINNED MINI-APPS LAUNCHPAD */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border ${
                    isDarkMode
                      ? 'bg-slate-900/65 border-white/10'
                      : 'bg-white/80 border-slate-200/80 shadow-2xs'
                  } backdrop-blur-xl`}
                >
                  {/* Launchpad Header & Category Filter Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center justify-between sm:justify-start gap-2.5">
                      <h2
                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                        <span>Applications Launchpad</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          · {filteredLaunchpadApps.length} Apps
                        </span>
                      </h2>

                      {/* Mobile View Toggle */}
                      <div className="flex sm:hidden items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setHubLaunchpadView(hubLaunchpadView === 'icons' ? 'cards' : 'icons')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${
                            isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          {hubLaunchpadView === 'icons' ? 'Cards View' : 'Icons View'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-0.5 sm:pb-0">
                      {/* Interactive Category Filter Buttons */}
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { id: 'all', label: 'All' },
                            { id: 'productivity', label: 'Productivity' },
                            { id: 'ai', label: 'AI & Audio' },
                            { id: 'finance-tools', label: 'Finance & Tools' }
                          ] as const
                        ).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              soundManager.playClickSound();
                              setLaunchpadCategory(cat.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                              launchpadCategory === cat.id
                                ? isDarkMode
                                  ? 'bg-white/15 text-white'
                                  : 'bg-slate-900 text-white'
                                : isDarkMode
                                  ? 'text-slate-400 hover:text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playClickSound();
                            setHubLaunchpadView(hubLaunchpadView === 'icons' ? 'cards' : 'icons');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                              : 'border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {hubLaunchpadView === 'icons' ? 'Bento Cards' : 'Icon Grid'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenInstalledApps?.()}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>All Apps</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Launchpad Content: Either Draggable iOS Squircle Icons OR Super App Bento Cards */}
                  {hubLaunchpadView === 'icons' ? (
                    <div className={`w-full grid ${gridColumnsClass} justify-items-center items-start py-1`}>
                      {filteredLaunchpadApps.map((app, index) => (
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

                      {/* System Settings Shortcut Icon */}
                      {launchpadCategory === 'all' && (
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
                          <div
                            className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] p-0.5 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:shadow-lg ${
                              iconStyle === 'tinted'
                                ? 'bg-white/10 backdrop-blur-xl border border-indigo-400/40 text-indigo-300'
                                : iconStyle === 'dark-glass'
                                  ? 'bg-neutral-900 border border-purple-500/40 text-purple-400'
                                  : iconStyle === 'monochrome'
                                    ? isDarkMode
                                      ? 'bg-neutral-800 text-white'
                                      : 'bg-neutral-200 text-neutral-900'
                                    : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-slate-200 shadow-md shadow-black/30 border border-white/20'
                            }`}
                          >
                            <Settings className="w-6 h-6 z-10" />
                          </div>
                          {showLabels && (
                            <span
                              className={`mt-1.5 text-[10.5px] sm:text-[11.5px] text-center tracking-tight leading-tight select-none ${
                                isDarkMode
                                  ? 'text-white/95 font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]'
                                  : 'text-neutral-900 font-bold drop-shadow-xs'
                              }`}
                            >
                              Settings
                            </span>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    /* Super App Bento Cards Mode with Direct Standalone Window Expand Button */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {filteredLaunchpadApps.map((app, index) => (
                        <motion.div
                          key={app.id}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => onOpenApp(app.id)}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all group ${
                            isDarkMode
                              ? 'bg-slate-950/65 hover:bg-slate-950 border-white/10 hover:border-amber-500/40'
                              : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden ${getAppIconContainerStyle(
                                app,
                                index
                              )}`}
                            >
                              {getIconComponent(app.iconName, app.id)}
                            </div>
                            <div className="min-w-0">
                              <h3
                                className={`text-xs font-bold truncate ${
                                  isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {app.name}
                              </h3>
                              <p className="text-[10px] text-slate-400 truncate">{app.tagline}</p>
                              <span className="text-[9px] font-mono text-amber-500/90 block mt-0.5 truncate">
                                {getMiniAppPath(app)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleOpenInSeparateWindow(e, app)}
                            className={`min-h-[36px] min-w-[36px] rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                              isDarkMode
                                ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                                : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title={`Open ${app.name} in separate window (${getMiniAppPath(app)})`}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. INTERACTIVE SMART STACK WIDGETS ON HUB */}
                <div className="w-full pt-0.5">
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
              </motion.div>
            ) : activeTab === 'springboard' ? (
              /* =========================================================================
               * TAB 2: CLASSIC APPLE HIG SPRINGBOARD APP GRID
               * ========================================================================= */
              <motion.div
                key="workspace-springboard"
                custom={slideDirection}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full flex flex-col justify-between overflow-y-auto py-2"
              >
                <div className="w-full flex items-center justify-between mb-3 px-1 shrink-0">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 block">
                      SPRINGBOARD LAUNCHER · DRAG TO REORDER
                    </span>
                    <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Pinned Applications ({orderedApps.length})
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClickSound();
                        setIsEditMode(!isEditMode);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        isEditMode
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : isDarkMode
                            ? 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {isEditMode ? 'Done Editing' : 'Edit Icons'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className={`w-full grid ${gridColumnsClass} justify-items-center items-center`}>
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
                      <div
                        className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] p-0.5 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:shadow-lg ${
                          iconStyle === 'tinted'
                            ? 'bg-white/10 backdrop-blur-xl border border-indigo-400/40 text-indigo-300'
                            : iconStyle === 'dark-glass'
                              ? 'bg-neutral-900 border border-purple-500/40 text-purple-400'
                              : iconStyle === 'monochrome'
                                ? isDarkMode
                                  ? 'bg-neutral-800 text-white'
                                  : 'bg-neutral-200 text-neutral-900'
                                : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-slate-200 shadow-md shadow-black/30 border border-white/20'
                        }`}
                      >
                        <Settings className="w-6 h-6 z-10" />
                      </div>
                      {showLabels && (
                        <span
                          className={`mt-1.5 text-[10.5px] sm:text-[11.5px] text-center tracking-tight leading-tight select-none ${
                            isDarkMode
                              ? 'text-white/95 font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]'
                              : 'text-neutral-900 font-bold drop-shadow-xs'
                          }`}
                        >
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
                      <div
                        className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] p-0.5 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:shadow-lg ${
                          iconStyle === 'tinted'
                            ? 'bg-white/10 backdrop-blur-xl border border-blue-400/40 text-blue-300'
                            : iconStyle === 'dark-glass'
                              ? 'bg-neutral-900 border border-blue-500/40 text-blue-400'
                              : iconStyle === 'monochrome'
                                ? isDarkMode
                                  ? 'bg-neutral-800 text-white'
                                  : 'bg-neutral-200 text-neutral-900'
                                : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-md shadow-black/30 border border-white/20'
                        }`}
                      >
                        <ShoppingBag className="w-6 h-6 z-10" />
                      </div>
                      {showLabels && (
                        <span
                          className={`mt-1.5 text-[10.5px] sm:text-[11.5px] text-center tracking-tight leading-tight select-none ${
                            isDarkMode
                              ? 'text-white/95 font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]'
                              : 'text-neutral-900 font-bold drop-shadow-xs'
                          }`}
                        >
                          App Store
                        </span>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'widgets' ? (
              /* =========================================================================
               * TAB 3: SMART STACK WIDGETS STUDIO
               * ========================================================================= */
              <motion.div
                key="workspace-widgets"
                custom={slideDirection}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full overflow-y-auto pr-0.5 pb-3 space-y-3"
              >
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
              </motion.div>
            ) : (
              /* =========================================================================
               * TAB 4: ECOSYSTEM DIRECTORY & STANDALONE ROUTER
               * ========================================================================= */
              <motion.div
                key="workspace-directory"
                custom={slideDirection}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full flex flex-col justify-between overflow-hidden"
              >
                {/* Directory Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 shrink-0">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={directoryQuery}
                      onChange={(e) => setDirectoryQuery(e.target.value)}
                      placeholder="Filter mini-apps by name, category, or route (/harmony-...)..."
                      className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs font-medium focus:outline-none ${
                        isDarkMode
                          ? 'bg-slate-900/90 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/60'
                          : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                      }`}
                    />
                    {directoryQuery && (
                      <button
                        type="button"
                        onClick={() => setDirectoryQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Segmented Filter Control: All | System | User */}
                  <div
                    className={`grid grid-cols-3 p-1 rounded-xl border text-xs font-semibold shrink-0 ${
                      isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClickSound();
                        setAppLibraryTypeFilter('all');
                      }}
                      className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        appLibraryTypeFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>All ({allInstalledApps.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClickSound();
                        setAppLibraryTypeFilter('system');
                      }}
                      className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        appLibraryTypeFilter === 'system'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-blue-400'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>System ({systemAppsList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClickSound();
                        setAppLibraryTypeFilter('user');
                      }}
                      className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        appLibraryTypeFilter === 'user'
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>User ({userAppsList.length})</span>
                    </button>
                  </div>
                </div>

                {/* Directory Cards Grid */}
                <div className="w-full flex-1 min-h-0 overflow-y-auto pr-0.5 pb-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {filteredDirectoryApps.map((app, index) => {
                      const isPinned = pinnedAppIds ? pinnedAppIds.includes(app.id) : true;
                      return (
                        <div
                          key={app.id}
                          onClick={() => onOpenApp(app.id)}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 cursor-pointer transition-all hover:scale-[1.005] ${
                            isDarkMode
                              ? 'bg-slate-900/85 hover:bg-slate-900 border-white/10 hover:border-amber-500/40'
                              : 'bg-white/95 hover:bg-white border-slate-200/90 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 p-1.5 ${getAppIconContainerStyle(
                                  app,
                                  index
                                )}`}
                              >
                                {getIconComponent(app.iconName, app.id)}
                              </div>
                              <div className="min-w-0">
                                <h3
                                  className={`text-sm font-bold truncate ${
                                    isDarkMode ? 'text-white' : 'text-slate-900'
                                  }`}
                                >
                                  {app.name}
                                </h3>
                                <p className="text-[11px] text-slate-400 truncate">{app.tagline}</p>
                                <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  <span className="text-amber-500">{getMiniAppPath(app)}</span>
                                  <span>·</span>
                                  <span>v{app.version || '1.0'}</span>
                                  <span>·</span>
                                  <span className="uppercase">{app.isSystemApp ? 'System' : 'User'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {onTogglePinApp && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundManager.playClickSound();
                                    onTogglePinApp(app.id);
                                  }}
                                  className={`p-2 rounded-xl border transition-colors ${
                                    isPinned
                                      ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                                      : isDarkMode
                                        ? 'border-white/10 text-slate-500 hover:text-white'
                                        : 'border-slate-200 text-slate-400 hover:text-slate-800'
                                  }`}
                                  title={isPinned ? 'Pinned to Home' : 'Pin to Home'}
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleOpenInSeparateWindow(e, app)}
                                className={`p-2 rounded-xl border transition-colors ${
                                  isDarkMode
                                    ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                                title={`Open ${app.name} in separate window (${getMiniAppPath(app)})`}
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= BOTTOM WORKSPACE PAGINATION & GESTURE HINTS ================= */}
        {showPageDots && (
          <div className="w-full pt-1 pb-0.5 flex items-center justify-between px-1 shrink-0 z-10">
            <button
              type="button"
              onClick={() => onOpenInstalledApps?.()}
              className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              title="Open All Installed Applications Drawer"
            >
              <ArrowUp className="w-3 h-3 text-amber-500" />
              <span className="hidden xs:inline">All Apps Drawer</span>
            </button>

            {/* Interactive 4-View Indicator Dots */}
            <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-black/25 backdrop-blur-md border border-white/10">
              {tabOrder.map((tabId) => {
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => handleSelectTab(tabId)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? 'w-5 bg-amber-500'
                        : 'w-1.5 bg-slate-500/60 hover:bg-slate-400'
                    }`}
                    title={`Switch to ${tabId} view`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onOpenNotifications?.()}
              className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              title="Open Notification Center"
            >
              <span className="hidden xs:inline">Notification Shade</span>
              <ArrowDown className="w-3 h-3 text-amber-500" />
            </button>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export const HomeScreen = React.memo(HomeScreenComponent);
