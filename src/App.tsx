/**
 * @file App.tsx
 * @description Main application controller for Harmony OS Super App ecosystem.
 * Integrates all Harmony WebApps (Notes, Docs, Writing, Music Player, Docs AI) in iOS style UI with Firebase sync.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HARMONY_APPS } from './config/apps';
import { 
  MiniAppConfig, 
  SystemSettings, 
  SystemUser, 
  HarmonyNote, 
  HarmonyDoc, 
  HarmonyWritingDraft, 
  HarmonyPlaylist, 
  HarmonyAiChat,
  HarmonyCalendarEvent,
  Track,
  SystemNotification
} from './types';
import { 
  auth,
  subscribeToAuth, 
  loginAnonymously, 
  checkAuthRedirectResult,
  subscribeHarmonyNotes, 
  saveHarmonyNote, 
  deleteHarmonyNote, 
  subscribeHarmonyDocs, 
  saveHarmonyDoc, 
  deleteHarmonyDoc, 
  subscribeHarmonyDrafts, 
  saveHarmonyDraft, 
  deleteHarmonyDraft, 
  subscribeHarmonyPlaylists, 
  saveHarmonyPlaylist, 
  subscribeHarmonyAiChats, 
  saveHarmonyAiChat,
  saveHarmonyCalendarEvent,
  deleteHarmonyCalendarEvent,
  subscribeHarmonyCalendarEvents,
  saveSystemSettings,
  subscribeSystemSettings
} from './lib/firebase';
import { 
  getLocalItem, 
  setLocalItem,
  STORAGE_KEYS, 
  INITIAL_OFFLINE_NOTES, 
  INITIAL_OFFLINE_DOCS, 
  INITIAL_OFFLINE_DRAFTS, 
  INITIAL_OFFLINE_PLAYLISTS,
  INITIAL_OFFLINE_EVENTS,
  DEFAULT_SYSTEM_SETTINGS,
  ACTIVE_MANUAL_USER_KEY
} from './lib/offlinePersistence';
import { getInstalledAppIds, saveInstalledAppIds, syncInstalledAppsFromCloud } from './lib/appStoreService';
import { soundManager } from './lib/soundManager';
import { isNotificationAllowedForApp } from './lib/appQuickActions';
import { triggerHaptic } from './utils/haptics';
import { HomeScreen } from './components/HomeScreen';
import { Dock } from './components/Dock';
import { ControlCenter } from './components/ControlCenter';
import { SpotlightSearch } from './components/SpotlightSearch';
import { AppSwitcher } from './components/AppSwitcher';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeScreenSetupModal, WALLPAPER_PRESETS } from './components/HomeScreenSetupModal';
import { HomeWidgetId } from './components/widgets/types';
import { AppRunner } from './components/AppRunner';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { NotificationBanner } from './components/NotificationBanner';
import { InstalledAppsModal } from './components/InstalledAppsModal';
import { NotificationCenter } from './components/NotificationCenter';
import { LockScreen } from './components/LockScreen';
import { HabeshawiSplashScreen } from './components/HabeshawiSplashScreen';
import { HabeshawiLoadingScreen } from './components/HabeshawiLoadingScreen';
import { HabeshawiPopupProvider } from './components/HabeshawiPopup';

export default function App() {
  // Navigation & View States
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [openAppIds, setOpenAppIds] = useState<string[]>([]);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isAppSwitcherOpen, setIsAppSwitcherOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Modals & User Journey States
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [globalLoading, setGlobalLoading] = useState<{ isOpen: boolean; title?: string; subtitle?: string; amharicText?: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot' | 'profile'>('signin');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstalledAppsOpen, setIsInstalledAppsOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !getLocalItem<boolean>(STORAGE_KEYS.ONBOARDED, false);
  });
  const [isHomeScreenSetupOpen, setIsHomeScreenSetupOpen] = useState(false);

  // Wallpaper Theme State
  const [wallpaperTheme, setWallpaperTheme] = useState<string>(() => {
    return getLocalItem<string>(STORAGE_KEYS.WALLPAPER, 'obsidian');
  });

  // Smart Stack Widgets State
  const [enabledWidgetIds, setEnabledWidgetIds] = useState<HomeWidgetId[]>(() => {
    return getLocalItem<HomeWidgetId[]>(STORAGE_KEYS.HOME_WIDGETS, ['calendar', 'finance', 'music', 'docs-ai']);
  });

  // Audio & Music State
  const [currentTrack, setCurrentTrack] = useState<Track | undefined>({
    id: 't-1',
    title: 'Habeshawi Tizita Acoustic',
    artist: 'Habeshawi Soundscapes',
    album: 'Abyssinian Waves Vol. 1',
    duration: 180,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
    genre: 'Ethio-Jazz & Acoustic'
  });
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // User Auth State
  const [user, setUser] = useState<SystemUser | null>(null);

  // Synced Firestore Data with Offline Cache Fallback
  const [notes, setNotes] = useState<HarmonyNote[]>(() => {
    return getLocalItem<HarmonyNote[]>(STORAGE_KEYS.NOTES, INITIAL_OFFLINE_NOTES);
  });
  const [docs, setDocs] = useState<HarmonyDoc[]>(() => {
    return getLocalItem<HarmonyDoc[]>(STORAGE_KEYS.DOCS, INITIAL_OFFLINE_DOCS);
  });
  const [drafts, setDrafts] = useState<HarmonyWritingDraft[]>(() => {
    return getLocalItem<HarmonyWritingDraft[]>(STORAGE_KEYS.DRAFTS, INITIAL_OFFLINE_DRAFTS);
  });
  const [playlists, setPlaylists] = useState<HarmonyPlaylist[]>(() => {
    return getLocalItem<HarmonyPlaylist[]>(STORAGE_KEYS.PLAYLISTS, INITIAL_OFFLINE_PLAYLISTS);
  });
  const [aiChats, setAiChats] = useState<HarmonyAiChat[]>(() => {
    return getLocalItem<HarmonyAiChat[]>(STORAGE_KEYS.AI_CHATS, []);
  });
  const [calendarEvents, setCalendarEvents] = useState<HarmonyCalendarEvent[]>(() => {
    return getLocalItem<HarmonyCalendarEvent[]>(STORAGE_KEYS.CALENDAR, INITIAL_OFFLINE_EVENTS);
  });

  // Installed App Packages from Central Repository
  const [installedAppIds, setInstalledAppIds] = useState<string[]>(() => {
    return getInstalledAppIds();
  });

  // Pinned Apps for Home Screen personalization
  const DEFAULT_PINNED_APPS = HARMONY_APPS.filter(a => a.isSystemApp || ['harmony-music-player', 'harmony-docs-ai', 'harmony-finance'].includes(a.id)).map(a => a.id);
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(() => {
    return getLocalItem<string[]>(STORAGE_KEYS.PINNED_APPS, DEFAULT_PINNED_APPS);
  });

  // Handle installing app package downloaded from Central Repository
  const handleInstallApp = (app: MiniAppConfig) => {
    setInstalledAppIds((prev) => {
      const next = prev.includes(app.id) ? prev : [...prev, app.id];
      saveInstalledAppIds(next, user?.uid);
      return next;
    });
    setPinnedAppIds((prev) => {
      if (!prev.includes(app.id)) {
        const next = [...prev, app.id];
        setLocalItem(STORAGE_KEYS.PINNED_APPS, next);
        return next;
      }
      return prev;
    });
    triggerNotification('App Installed', `${app.name} downloaded & added to Home Screen`, 'App Store');
  };

  // Handle uninstalling app package
  const handleUninstallApp = (appId: string) => {
    const matched = HARMONY_APPS.find(a => a.id === appId);
    const appName = matched ? matched.name : 'App';
    setInstalledAppIds((prev) => {
      const next = prev.filter(id => id !== appId);
      saveInstalledAppIds(next, user?.uid);
      return next;
    });
    setPinnedAppIds((prev) => {
      const next = prev.filter(id => id !== appId);
      setLocalItem(STORAGE_KEYS.PINNED_APPS, next);
      return next;
    });
    triggerNotification('App Uninstalled', `${appName} removed from storage`, 'App Store');
  };

  // Toggle pinning/unpinning apps from the Home Screen
  const handleTogglePinApp = (appId: string) => {
    setPinnedAppIds((prev) => {
      let next: string[];
      const appConfig = HARMONY_APPS.find(a => a.id === appId);
      const appName = appConfig ? appConfig.name : 'App';
      if (prev.includes(appId)) {
        if (prev.length <= 1) {
          triggerNotification('Layout Notice', 'At least 1 app must remain pinned to your Home Screen.', 'App Store');
          return prev;
        }
        next = prev.filter(id => id !== appId);
        triggerNotification('App Unpinned', `${appName} moved to App Library.`, 'App Store');
      } else {
        next = [...prev, appId];
        triggerNotification('App Pinned', `${appName} is now pinned to Home Screen.`, 'App Store');
      }
      setLocalItem(STORAGE_KEYS.PINNED_APPS, next);
      soundManager.playClickSound();
      return next;
    });
  };

  // Reorder pinned apps on the Home Screen via Drag-and-Drop (React DnD)
  const handleReorderPinnedApps = (newOrder: string[]) => {
    setPinnedAppIds(newOrder);
    setLocalItem(STORAGE_KEYS.PINNED_APPS, newOrder);
  };

  // System Settings with Offline Storage Cache & soundManager synchronization
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = getLocalItem<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SYSTEM_SETTINGS);
    soundManager.setSettings(saved);
    return saved;
  });

  // Notifications State (Focus Mode suppression engine & history)
  const [activeNotification, setActiveNotification] = useState<SystemNotification | null>(null);
  const [suppressedNotifications, setSuppressedNotifications] = useState<SystemNotification[]>(() => {
    return getLocalItem<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  });
  const [allNotifications, setAllNotifications] = useState<SystemNotification[]>(() => {
    const saved = getLocalItem<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (saved.length > 0) return saved;
    return [
      {
        id: 'system-initial-welcome',
        title: 'Welcome to Habeshawi',
        message: 'Swipe left/right to change pages, swipe up for all apps, and swipe down for notifications.',
        appName: 'Habeshawi',
        timestamp: new Date().toISOString(),
        suppressedByFocus: false
      }
    ];
  });

  // Keep soundManager updated when settings change
  useEffect(() => {
    soundManager.setSettings(settings);
  }, [settings]);

  // Start in Fullscreen Mode per user requirement
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Handled silently if browser requires explicit user gesture
      }
    };

    enterFullscreen();

    // Browser security may require a user gesture; trigger on first user interaction
    const handleFirstTouchOrClick = () => {
      enterFullscreen();
      window.removeEventListener('click', handleFirstTouchOrClick);
      window.removeEventListener('touchend', handleFirstTouchOrClick);
    };

    window.addEventListener('click', handleFirstTouchOrClick, { once: true });
    window.addEventListener('touchend', handleFirstTouchOrClick, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstTouchOrClick);
      window.removeEventListener('touchend', handleFirstTouchOrClick);
    };
  }, []);

  // Unified Notification Trigger respecting Focus Mode and Per-App Notification preferences
  const triggerNotification = useCallback((title: string, message: string, appName: string = 'Habeshawi', appId?: string) => {
    // Check per-app notification preferences
    if (!isNotificationAllowedForApp(appId || appName)) {
      console.debug(`[App] Notification suppressed by app preference for: ${appName} (${appId})`);
      return;
    }

    const notif: SystemNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title,
      message,
      appName,
      timestamp: new Date().toISOString(),
      suppressedByFocus: settings.focusMode
    };

    // Store in all notifications history
    setAllNotifications((prev) => {
      const next = [notif, ...prev].slice(0, 50);
      setLocalItem(STORAGE_KEYS.NOTIFICATIONS, next);
      return next;
    });

    if (settings.focusMode) {
      // Silently log to suppressed notifications - no visual banner, no chime
      setSuppressedNotifications((prev) => {
        const next = [notif, ...prev].slice(0, 30);
        return next;
      });
    } else {
      // Normal mode: Play harmonic chime and display animated iOS top banner
      soundManager.playNotificationChime();
      setActiveNotification(notif);
    }
  }, [settings.focusMode]);

  // Global listener for test or triggered notifications from components / Quick Actions
  useEffect(() => {
    const handleCustomTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        title: string;
        message: string;
        appName?: string;
        appId?: string;
      }>;
      if (customEvent.detail) {
        triggerNotification(
          customEvent.detail.title,
          customEvent.detail.message,
          customEvent.detail.appName || 'Habeshawi',
          customEvent.detail.appId
        );
      }
    };
    window.addEventListener('habeshawi_trigger_notification', handleCustomTrigger);
    return () => {
      window.removeEventListener('habeshawi_trigger_notification', handleCustomTrigger);
    };
  }, [triggerNotification]);

  // Test notification helper for Control Center & Notification Center
  const handleTriggerTestNotification = () => {
    if (settings.focusMode) {
      triggerNotification(
        'Calendar Event: Sprint Review',
        'Silently suppressed by Focus Mode to prevent interruption.',
        'Habeshawi Focus'
      );
    } else {
      triggerNotification(
        'Cloud Sync Successful',
        'Your theme preferences and volume settings are synced to Firebase.',
        'Habeshawi Cloud'
      );
    }
  };

  const handleClearSuppressedNotifications = () => {
    setSuppressedNotifications([]);
    soundManager.playHapticClick();
  };

  const handleClearAllNotifications = () => {
    setAllNotifications([]);
    setSuppressedNotifications([]);
    setLocalItem(STORAGE_KEYS.NOTIFICATIONS, []);
    soundManager.playHapticClick();
  };

  // Update System Settings with instant local persistence & Firestore multi-device synchronization
  const handleUpdateSettings = (updated: Partial<SystemSettings>) => {
    setSettings((prev) => {
      let resolvedDarkMode = updated.isDarkMode ?? prev.isDarkMode;
      if (updated.themeMode === 'system') {
        resolvedDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else if (updated.themeMode === 'dark') {
        resolvedDarkMode = true;
      } else if (updated.themeMode === 'light') {
        resolvedDarkMode = false;
      }

      const next: SystemSettings = { 
        ...prev, 
        ...updated,
        isDarkMode: resolvedDarkMode
      };
      setLocalItem(STORAGE_KEYS.SETTINGS, next);
      soundManager.setSettings(next);

      // Persist to Firebase if user is logged in
      if (user?.uid) {
        saveSystemSettings(user.uid, next).catch((err) => {
          console.warn('[Firebase SystemSettings Save Error]', err);
        });
      }
      return next;
    });
  };

  // Helper to convert hex to rgb string "r, g, b"
  const hexToRgb = (hex: string) => {
    const cleaned = (hex || '#6366f1').replace('#', '');
    if (cleaned.length === 3) {
      const r = parseInt(cleaned[0] + cleaned[0], 16) || 99;
      const g = parseInt(cleaned[1] + cleaned[1], 16) || 102;
      const b = parseInt(cleaned[2] + cleaned[2], 16) || 241;
      return `${r}, ${g}, ${b}`;
    }
    if (cleaned.length === 6) {
      const r = parseInt(cleaned.slice(0, 2), 16) || 99;
      const g = parseInt(cleaned.slice(2, 4), 16) || 102;
      const b = parseInt(cleaned.slice(4, 6), 16) || 241;
      return `${r}, ${g}, ${b}`;
    }
    return '99, 102, 241';
  };

  // Sync document root class, data-theme, font family, scaling, and display accessibility properties
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (settings.isDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.setAttribute('data-theme', settings.themePreset || 'slate');
      root.setAttribute('data-font', settings.fontFamily || 'system');
      root.setAttribute('data-font-scale', settings.fontSizeScale || 'standard');

      // Sync master display brightness custom property
      root.style.setProperty('--display-brightness', String(settings.brightness ?? 1));

      // Accessibility & Visual toggles
      if (settings.boldText) {
        root.classList.add('system-bold-text');
      } else {
        root.classList.remove('system-bold-text');
      }

      if (settings.highContrast) {
        root.classList.add('system-high-contrast');
      } else {
        root.classList.remove('system-high-contrast');
      }

      if (settings.reduceTransparency) {
        root.classList.add('system-reduce-transparency');
      } else {
        root.classList.remove('system-reduce-transparency');
      }

      if (settings.reduceMotion) {
        root.classList.add('system-reduce-motion');
      } else {
        root.classList.remove('system-reduce-motion');
      }

      // Eye comfort / Night shift color temperature
      root.classList.remove('system-night-shift-warm', 'system-night-shift-cool', 'system-brightness-standard');
      if (settings.nightShift || settings.colorTemperature === 'warm') {
        root.classList.add('system-night-shift-warm');
      } else if (settings.colorTemperature === 'cool') {
        root.classList.add('system-night-shift-cool');
      } else {
        root.classList.add('system-brightness-standard');
      }

      // Sync accent color CSS variables
      if (settings.accentColor) {
        const hex = settings.accentColor;
        const rgbStr = hexToRgb(hex);
        const [r, g, b] = rgbStr.split(',').map(n => parseInt(n.trim(), 10) || 0);
        const hoverR = Math.max(0, Math.min(255, Math.round(r * 0.88)));
        const hoverG = Math.max(0, Math.min(255, Math.round(g * 0.88)));
        const hoverB = Math.max(0, Math.min(255, Math.round(b * 0.88)));
        const hoverHex = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;
        
        const darkR = Math.max(0, Math.min(255, Math.round(r * 0.5)));
        const darkG = Math.max(0, Math.min(255, Math.round(g * 0.5)));
        const darkB = Math.max(0, Math.min(255, Math.round(b * 0.5)));
        const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;

        root.style.setProperty('--accent-color', hex);
        root.style.setProperty('--accent-color-rgb', rgbStr);
        root.style.setProperty('--accent-color-hover', hoverHex);
        root.style.setProperty('--accent-color-light', `rgba(${rgbStr}, 0.18)`);
        root.style.setProperty('--accent-color-dark', darkHex);
        root.style.setProperty('--accent-glow', `rgba(${rgbStr}, 0.38)`);
      }
    }
  }, [
    settings.isDarkMode, 
    settings.themePreset, 
    settings.accentColor, 
    settings.fontFamily, 
    settings.fontSizeScale, 
    settings.boldText, 
    settings.brightness, 
    settings.highContrast, 
    settings.reduceTransparency, 
    settings.reduceMotion, 
    settings.nightShift, 
    settings.colorTemperature
  ]);

  // Listen for OS system color scheme changes when themeMode is 'system'
  useEffect(() => {
    if (settings.themeMode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSchemeChange = (e: MediaQueryListEvent) => {
      handleUpdateSettings({ isDarkMode: e.matches });
    };

    // Ensure initial sync
    if (mediaQuery.matches !== settings.isDarkMode) {
      handleUpdateSettings({ isDarkMode: mediaQuery.matches });
    }

    mediaQuery.addEventListener('change', handleSchemeChange);
    return () => mediaQuery.removeEventListener('change', handleSchemeChange);
  }, [settings.themeMode]);

  // Service Worker Registration for PWA & Auth Redirect Check
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
    }
    // Process any returning Google Auth redirect in mobile/iframe environments
    checkAuthRedirectResult().catch((err) => {
      console.debug('[Firebase Auth] No pending redirect credentials:', err?.message || err);
    });
  }, []);

  // Firebase Auth Subscription
  useEffect(() => {
    const savedManualUser = getLocalItem<SystemUser | null>(ACTIVE_MANUAL_USER_KEY, null);

    const unsubscribe = subscribeToAuth((fbUser) => {
      if (fbUser && !fbUser.isAnonymous) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || (fbUser.isAnonymous ? 'Guest User' : fbUser.email?.split('@')[0] || 'User'),
          photoURL: fbUser.photoURL,
          isAnonymous: false
        });
      } else if (savedManualUser && !savedManualUser.isAnonymous) {
        setUser(savedManualUser);
      } else if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Guest User',
          photoURL: fbUser.photoURL,
          isAnonymous: true
        });
      } else {
        // Fallback to local guest profile for offline mode
        setUser({
          uid: 'local-guest-user',
          displayName: 'Guest User',
          email: 'guest@harmony.os',
          photoURL: null,
          isAnonymous: true
        });
        // Attempt anonymous sign in if supported
        loginAnonymously().catch(() => {});
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Data & Settings Listeners (Firebase Skill: Only attach onSnapshot if auth ready & authenticated)
  useEffect(() => {
    if (!user || user.uid === 'local-guest-user' || !auth.currentUser) return;

    const unsubNotes = subscribeHarmonyNotes(user.uid, (data) => setNotes(data));
    const unsubDocs = subscribeHarmonyDocs(user.uid, (data) => setDocs(data));
    const unsubDrafts = subscribeHarmonyDrafts(user.uid, (data) => setDrafts(data));
    const unsubPlaylists = subscribeHarmonyPlaylists(user.uid, (data) => setPlaylists(data));
    const unsubChats = subscribeHarmonyAiChats(user.uid, (data) => setAiChats(data));
    const unsubCalendar = subscribeHarmonyCalendarEvents(user.uid, (data) => {
      if (data && data.length > 0) {
        setCalendarEvents(data);
        setLocalItem(STORAGE_KEYS.CALENDAR, data);
      }
    });

    // Multi-device sync for SystemSettings (theme, volume, focusMode)
    const unsubSettings = subscribeSystemSettings(user.uid, (remoteSettings) => {
      if (remoteSettings) {
        setSettings((current) => {
          // Merge remote settings only if there are genuine updates
          const merged: SystemSettings = {
            ...current,
            ...remoteSettings,
          };
          setLocalItem(STORAGE_KEYS.SETTINGS, merged);
          soundManager.setSettings(merged);
          return merged;
        });
      }
    });

    return () => {
      if (unsubNotes) unsubNotes();
      if (unsubDocs) unsubDocs();
      if (unsubDrafts) unsubDrafts();
      if (unsubPlaylists) unsubPlaylists();
      if (unsubChats) unsubChats();
      if (unsubCalendar) unsubCalendar();
      if (unsubSettings) unsubSettings();
    };
  }, [user]);

  // Keyboard shortcut listener for Spotlight (Cmd+K / Ctrl+K) and Lock (Cmd+L / Ctrl+Alt+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
      // Lock screen shortcut
      if ((e.metaKey && e.key.toLowerCase() === 'l') || (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        if (settings.lockScreenEnabled !== false) {
          soundManager.playLockSound();
          setIsLocked(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.lockScreenEnabled]);

  // Auto-lock inactivity timer listener
  useEffect(() => {
    if (settings.lockScreenEnabled === false || isLocked) return;
    const timeoutSetting = settings.lockScreenAutoLockTimeout || '5min';
    if (timeoutSetting === 'never') return;

    let timeoutMs = 5 * 60 * 1000;
    if (timeoutSetting === '1min') timeoutMs = 1 * 60 * 1000;
    if (timeoutSetting === '2min') timeoutMs = 2 * 60 * 1000;
    if (timeoutSetting === '5min') timeoutMs = 5 * 60 * 1000;

    let timerId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        soundManager.playLockSound();
        setIsLocked(true);
      }, timeoutMs);
    };

    resetTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      clearTimeout(timerId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [settings.lockScreenEnabled, settings.lockScreenAutoLockTimeout, isLocked]);

  // Launch Mini App
  const handleOpenApp = (appId: string) => {
    triggerHaptic('medium');
    setActiveAppId(appId);
    if (!openAppIds.includes(appId)) {
      setOpenAppIds(prev => [...prev, appId]);
    }
  };

  const handleCloseActiveApp = () => {
    triggerHaptic('dismiss');
    setActiveAppId(null);
  };

  const handleCloseAppFromSwitcher = (appId: string) => {
    triggerHaptic('heavy');
    setOpenAppIds(prev => prev.filter(id => id !== appId));
    if (activeAppId === appId) {
      setActiveAppId(null);
    }
  };

  const handleCloseAllApps = () => {
    triggerHaptic('heavy');
    setOpenAppIds([]);
    setActiveAppId(null);
    setIsAppSwitcherOpen(false);
  };

  // Home Navigation trigger to return springboard to Page 1 and dismiss overlays
  const [homeTrigger, setHomeTrigger] = useState(0);

  const handleGoHome = useCallback(() => {
    soundManager.playClickSound();
    triggerHaptic('light');
    if (activeAppId) {
      setActiveAppId(null);
    }
    setIsAppSwitcherOpen(false);
    setIsSpotlightOpen(false);
    setIsInstalledAppsOpen(false);
    setIsNotificationCenterOpen(false);
    setIsControlCenterOpen(false);
    setIsSettingsOpen(false);
    setIsHomeScreenSetupOpen(false);
    setHomeTrigger(prev => prev + 1);
  }, [activeAppId]);

  const activeAppConfig = HARMONY_APPS.find(a => a.id === activeAppId);

  // Auth Modal trigger with optional initial mode
  const handleOpenAuth = (mode: 'signin' | 'signup' | 'forgot' | 'profile' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Wallpaper Theme Handlers
  const handleUpdateWallpaperTheme = (themeId: string) => {
    setWallpaperTheme(themeId);
    setLocalItem(STORAGE_KEYS.WALLPAPER, themeId);
    triggerNotification('Wallpaper Updated', 'New home screen ambience applied', 'Habeshawi');
  };

  // Smart Stack Widgets Handlers
  const handleUpdateWidgets = (newWidgets: HomeWidgetId[]) => {
    setEnabledWidgetIds(newWidgets);
    setLocalItem(STORAGE_KEYS.HOME_WIDGETS, newWidgets);
  };

  // Onboarding Finish Handler
  const handleFinishOnboarding = () => {
    setLocalItem(STORAGE_KEYS.ONBOARDED, true);
    setIsOnboardingOpen(false);
    triggerNotification('Welcome to Habeshawi', 'Your unified workspace is ready to use.', 'Habeshawi');
  };

  const getWallpaperBackground = () => {
    const isDark = settings.isDarkMode;
    const matched = WALLPAPER_PRESETS.find(p => p.id === wallpaperTheme);
    if (matched) {
      const gradient = isDark ? matched.darkBgClass : matched.lightBgClass;
      return `bg-gradient-to-br ${gradient}`;
    }
    switch (settings.themePreset) {
      case 'habeshawi-gold':
        return isDark
          ? 'bg-gradient-to-br from-[#14100c] via-[#1a140e] to-[#0a0806]'
          : 'bg-gradient-to-br from-[#fcfaf5] via-[#f7f2e7] to-[#ede4d1]';
      case 'axum-emerald':
        return isDark
          ? 'bg-gradient-to-br from-[#061c14] via-[#0b1f17] to-[#040e0a]'
          : 'bg-gradient-to-br from-[#f0fdf4] via-[#dcfce7] to-[#e6f4ea]';
      case 'sheba-crimson':
        return isDark
          ? 'bg-gradient-to-br from-[#21090f] via-[#17060a] to-[#0d0306]'
          : 'bg-gradient-to-br from-[#fff1f2] via-[#ffe4e6] to-[#fee2e2]';
      case 'lalibela-stone':
        return isDark
          ? 'bg-gradient-to-br from-[#1c0e08] via-[#140a06] to-[#0d0704]'
          : 'bg-gradient-to-br from-[#fff7ed] via-[#ffedd5] to-[#fef3c7]';
      case 'birana-parchment':
        return isDark
          ? 'bg-gradient-to-br from-[#16120c] via-[#1a150e] to-[#0f0c08]'
          : 'bg-gradient-to-br from-[#fdfbf7] via-[#f7f3e8] to-[#eee6d3]';
      case 'oled':
        return isDark ? 'bg-black' : 'bg-white';
      case 'sunset':
        return isDark
          ? 'bg-gradient-to-br from-[#271026] via-[#160d1f] to-[#0d0714]'
          : 'bg-gradient-to-br from-[#fff7ed] via-[#ffedd5] to-[#fef2f2]';
      case 'emerald':
        return isDark
          ? 'bg-gradient-to-br from-[#06201a] via-[#081512] to-[#040c0a]'
          : 'bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#f0fdf4]';
      case 'lavender':
        return isDark
          ? 'bg-gradient-to-br from-[#1a122c] via-[#100e1e] to-[#080713]'
          : 'bg-gradient-to-br from-[#faf5ff] via-[#f3e8ff] to-[#ede9fe]';
      case 'slate':
      default:
        return isDark
          ? 'bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0a0d12]'
          : 'bg-gradient-to-br from-[#f1f5f9] via-[#e2e8f0] to-[#f8fafc]';
    }
  };

  return (
    <HabeshawiPopupProvider isDarkMode={settings.isDarkMode}>
      <div 
        id="habeshawi-os-root" 
        className={`w-screen h-screen flex flex-col font-sans overflow-hidden select-none relative transition-colors duration-300 ${
          settings.isDarkMode ? 'bg-[#0d1117] text-[#c9d1d9] dark' : 'bg-[#f8fafc] text-neutral-900'
        }`}
      >
      {/* Dynamic Background Wallpaper Glow */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-all duration-500 opacity-100 ${getWallpaperBackground()}`} 
      />

      {/* iOS Notification Banner (Shown ONLY when Focus Mode is OFF) */}
      <NotificationBanner
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
        isDarkMode={settings.isDarkMode}
      />

      {/* Primary View Router: Active Mini App OR Home Screen with iOS Transitions */}
      <main className="flex-1 w-full flex flex-col relative z-10 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {activeAppConfig ? (
            <AppRunner
              key={activeAppConfig.id}
              app={activeAppConfig}
              onClose={handleCloseActiveApp}
              user={user}
              defaultMode={settings.defaultViewMode}
              notes={notes}
              onSaveNote={async (note) => {
                const res = await saveHarmonyNote(user?.uid || 'guest', note);
                triggerNotification('Note Saved', `"${note.title}" synced to cloud`, 'Habeshawi Notes');
                return res;
              }}
              onDeleteNote={(id) => deleteHarmonyNote(id)}
              docs={docs}
              onSaveDoc={async (docItem) => {
                const res = await saveHarmonyDoc(user?.uid || 'guest', docItem);
                triggerNotification('Document Saved', `"${docItem.title}" synced to cloud`, 'Habeshawi Docs');
                return res;
              }}
              onDeleteDoc={(id) => deleteHarmonyDoc(id)}
              drafts={drafts}
              onSaveDraft={async (draft) => {
                const res = await saveHarmonyDraft(user?.uid || 'guest', draft);
                triggerNotification('Draft Auto-saved', `"${draft.title}" updated`, 'Habeshawi Writing');
                return res;
              }}
              onDeleteDraft={(id) => deleteHarmonyDraft(id)}
              playlists={playlists}
              onSavePlaylist={(pl) => saveHarmonyPlaylist(user?.uid || 'guest', pl)}
              aiChats={aiChats}
              onSaveAiChat={(chat) => saveHarmonyAiChat(user?.uid || 'guest', chat)}
              calendarEvents={calendarEvents}
              onSaveCalendarEvent={async (calEv) => {
                const res = await saveHarmonyCalendarEvent(user?.uid || 'guest', calEv);
                triggerNotification('Calendar Updated', `"${calEv.title}" synced to cloud`, 'Habeshawi Calendar');
                return res;
              }}
              onDeleteCalendarEvent={(id) => deleteHarmonyCalendarEvent(id)}
              onPlayTrack={(track) => {
                setCurrentTrack(track);
                setIsPlayingMusic(true);
              }}
              pinnedAppIds={pinnedAppIds}
              onTogglePinApp={handleTogglePinApp}
              onOpenApp={handleOpenApp}
              onOpenAppSwitcher={() => setIsAppSwitcherOpen(true)}
              installedAppIds={installedAppIds}
              onInstallApp={handleInstallApp}
              onUninstallApp={handleUninstallApp}
            />
          ) : (
            <motion.div
              key="home-screen-container"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="flex-1 w-full flex flex-col min-h-0 overflow-hidden"
            >
              <HomeScreen
                onOpenApp={handleOpenApp}
                onOpenSpotlight={() => setIsSpotlightOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenAuth={() => handleOpenAuth('signin')}
                onOpenInstalledApps={() => setIsInstalledAppsOpen(true)}
                onOpenNotifications={() => setIsNotificationCenterOpen(true)}
                onOpenHomeScreenSetup={() => setIsHomeScreenSetupOpen(true)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                recentNotes={notes}
                latestDraft={drafts[0]}
                currentTrack={currentTrack}
                isPlayingMusic={isPlayingMusic}
                onTogglePlayMusic={() => setIsPlayingMusic(!isPlayingMusic)}
                userDisplayName={user?.displayName}
                isDarkMode={settings.isDarkMode}
                calendarEvents={calendarEvents}
                pinnedAppIds={pinnedAppIds}
                installedAppIds={installedAppIds}
                onTogglePinApp={handleTogglePinApp}
                onReorderPinnedApps={handleReorderPinnedApps}
                enabledWidgetIds={enabledWidgetIds}
                onUpdateWidgets={handleUpdateWidgets}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                wallpaperTheme={wallpaperTheme}
                onUpdateWallpaperTheme={handleUpdateWallpaperTheme}
                homeTrigger={homeTrigger}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* iOS Bottom Floating Dock with entrance/exit spring */}
      <AnimatePresence>
        {!activeAppId && (
          <motion.div
            key="ios-floating-dock"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="w-full pointer-events-auto"
          >
            <Dock
              onOpenApp={handleOpenApp}
              onOpenAppSwitcher={() => setIsAppSwitcherOpen(true)}
              onOpenInstalledApps={() => setIsInstalledAppsOpen(true)}
              onGoHome={handleGoHome}
              activeAppId={activeAppId}
              isDarkMode={settings.isDarkMode}
              dockAppIds={settings.dockAppIds}
              dockMaxSmallScreen={settings.dockMaxSmallScreen}
              dockMaxLargeScreen={settings.dockMaxLargeScreen}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onUpdateSettings={handleUpdateSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays & Modals */}
      <ControlCenter
        isOpen={isControlCenterOpen}
        onClose={() => setIsControlCenterOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isFirebaseConnected={!!user}
        userEmail={user?.email || user?.displayName}
        suppressedNotifications={suppressedNotifications}
        onClearSuppressedNotifications={handleClearSuppressedNotifications}
        onTriggerTestNotification={handleTriggerTestNotification}
        onLockScreen={() => {
          soundManager.playLockSound();
          setIsLocked(true);
        }}
      />

      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onOpenApp={handleOpenApp}
        notes={notes}
        docs={docs}
        drafts={drafts}
        isDarkMode={settings.isDarkMode}
      />

      <AppSwitcher
        isOpen={isAppSwitcherOpen}
        onClose={() => setIsAppSwitcherOpen(false)}
        openAppIds={openAppIds}
        activeAppId={activeAppId}
        onSelectApp={(appId) => handleOpenApp(appId)}
        onCloseApp={handleCloseAppFromSwitcher}
        onCloseAllApps={handleCloseAllApps}
        isDarkMode={settings.isDarkMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        currentUser={user}
        onOpenAuth={(m) => handleOpenAuth(m)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenHomeScreenSetup={() => setIsHomeScreenSetupOpen(true)}
        wallpaperTheme={wallpaperTheme}
        onUpdateWallpaperTheme={handleUpdateWallpaperTheme}
        enabledWidgetIds={enabledWidgetIds}
        onUpdateWidgets={handleUpdateWidgets}
        pinnedAppIds={pinnedAppIds}
        onUpdatePinnedApps={(apps) => {
          setPinnedAppIds(apps);
          setLocalItem(STORAGE_KEYS.PINNED_APPS, apps);
        }}
        installedAppIds={installedAppIds}
        onLockScreenNow={() => {
          soundManager.playLockSound();
          setIsLocked(true);
        }}
      />

      {/* First-Time User Onboarding & Welcome Tour */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        pinnedAppIds={pinnedAppIds}
        onUpdatePinnedApps={(apps) => {
          setPinnedAppIds(apps);
          setLocalItem(STORAGE_KEYS.PINNED_APPS, apps);
        }}
        currentUser={user}
        onOpenAuth={(m) => handleOpenAuth(m)}
        onFinish={handleFinishOnboarding}
      />

      {/* Dedicated Home Screen Setup & Personalization Modal */}
      <HomeScreenSetupModal
        isOpen={isHomeScreenSetupOpen}
        onClose={() => setIsHomeScreenSetupOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        pinnedAppIds={pinnedAppIds}
        onUpdatePinnedApps={(apps) => {
          setPinnedAppIds(apps);
          setLocalItem(STORAGE_KEYS.PINNED_APPS, apps);
        }}
        enabledWidgetIds={enabledWidgetIds}
        onUpdateWidgets={handleUpdateWidgets}
        wallpaperTheme={wallpaperTheme}
        onUpdateWallpaperTheme={handleUpdateWallpaperTheme}
        onSaveToast={(msg) => triggerNotification('Home Screen', msg, 'Habeshawi')}
      />

      {/* Installed Applications Modal & Separate App List */}
      <InstalledAppsModal
        isOpen={isInstalledAppsOpen}
        onClose={() => setIsInstalledAppsOpen(false)}
        onOpenApp={handleOpenApp}
        installedAppIds={installedAppIds}
        pinnedAppIds={pinnedAppIds}
        onTogglePinApp={handleTogglePinApp}
        isDarkMode={settings.isDarkMode}
      />

      {/* iOS Style Notification Center Shade */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={allNotifications}
        onClearNotifications={handleClearAllNotifications}
        onTriggerTestNotification={handleTriggerTestNotification}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isDarkMode={settings.isDarkMode}
      />

      {/* Topmost Authentication Sheet Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        isDarkMode={settings.isDarkMode}
        initialMode={authModalMode}
        onAuthSuccess={(msg) => triggerNotification('Account Synced', msg, 'Habeshawi Auth')}
        onUserChange={(newUser) => setUser(newUser)}
      />

      {/* Mobile PWA Installation Banner */}
      <PwaInstallPrompt />

      {/* iOS Lock Screen Overlay */}
      <AnimatePresence>
        {isLocked && settings.lockScreenEnabled !== false && (
          <LockScreen
            isLocked={isLocked}
            onUnlock={() => setIsLocked(false)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            notifications={allNotifications}
            currentTrack={currentTrack}
            isPlayingMusic={isPlayingMusic}
            onTogglePlayMusic={() => setIsPlayingMusic(!isPlayingMusic)}
            wallpaperTheme={wallpaperTheme}
            onOpenControlCenter={() => setIsControlCenterOpen(true)}
            onOpenApp={(appId) => {
              setIsLocked(false);
              handleOpenApp(appId);
            }}
          />
        )}
      </AnimatePresence>

      {/* Global Habeshawi Fullscreen Splash Screen */}
      <AnimatePresence>
        {showSplashScreen && (
          <HabeshawiSplashScreen
            onComplete={() => setShowSplashScreen(false)}
            isDarkMode={settings.isDarkMode}
            onToggleTheme={() =>
              handleUpdateSettings({
                isDarkMode: !settings.isDarkMode,
                themeMode: !settings.isDarkMode ? 'dark' : 'light',
              })
            }
          />
        )}
      </AnimatePresence>

      {/* Global Habeshawi Loading Overlay */}
      <HabeshawiLoadingScreen
        isOpen={!!globalLoading?.isOpen}
        title={globalLoading?.title}
        subtitle={globalLoading?.subtitle}
        amharicText={globalLoading?.amharicText}
        isDarkMode={settings.isDarkMode}
        onCancel={() => setGlobalLoading(null)}
      />
    </div>
  </HabeshawiPopupProvider>
  );
}
