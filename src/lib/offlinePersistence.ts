/**
 * @file offlinePersistence.ts
 * @description Resilient offline persistence layer and Service Worker caching interface for Harmony OS Super App.
 * Ensures all mini-apps (Notes, Docs, Writing, Music Player, Docs AI) remain fully accessible and editable offline.
 */

import { useState, useEffect, useCallback } from 'react';
import { HarmonyNote, HarmonyDoc, HarmonyWritingDraft, HarmonyPlaylist, HarmonyAiChat, HarmonyCalendarEvent, SystemSettings } from '../types';
import { FinanceTransaction, FinanceAccount, FinanceBudget, FinanceLoan, FinanceSubscription } from '../apps/finance/types';

// Storage keys used across AppRunner and individual mini-apps
export const STORAGE_KEYS = {
  NOTES: 'habeshawi_notes_data',
  DOCS: 'habeshawi_docs_data',
  DRAFTS: 'habeshawi_writing_data',
  PLAYLISTS: 'habeshawi_music_data',
  AI_CHATS: 'habeshawi_docs_ai_data',
  CALENDAR: 'habeshawi_calendar_data',
  FINANCE_TRANSACTIONS: 'habeshawi_finance_transactions_data',
  FINANCE_ACCOUNTS: 'habeshawi_finance_accounts_data',
  FINANCE_BUDGETS: 'habeshawi_finance_budgets_data',
  FINANCE_LOANS: 'habeshawi_finance_loans_data',
  FINANCE_SUBSCRIPTIONS: 'habeshawi_finance_subscriptions_data',
  PINNED_APPS: 'habeshawi_pinned_apps_v1',
  HOME_WIDGETS: 'habeshawi_home_widgets_v1',
  WIDGET_SIZES: 'habeshawi_widget_sizes_v1',
  SETTINGS: 'habeshawi_system_settings_v1',
  NOTIFICATIONS: 'habeshawi_system_notifications_v1',
  SYSTEM_NOTES: 'habeshawi_offline_notes',
  SYSTEM_DOCS: 'habeshawi_offline_docs',
  SYSTEM_DRAFTS: 'habeshawi_offline_drafts',
  SYSTEM_PLAYLISTS: 'habeshawi_offline_playlists',
  SYSTEM_CHATS: 'habeshawi_offline_aichats',
  SYSTEM_CALENDAR: 'habeshawi_offline_calendar',
  SYNC_QUEUE: 'habeshawi_offline_sync_queue',
  LAST_SYNC: 'habeshawi_last_sync_timestamp',
  ONBOARDED: 'habeshawi_has_onboarded_v1',
  WALLPAPER: 'habeshawi_wallpaper_v1',
  INSTALLED_APPS: 'habeshawi_installed_apps_v2',
  APP_REPOSITORIES: 'habeshawi_app_repositories_v1',
  DOWNLOADED_APP_BUNDLES: 'habeshawi_downloaded_app_bundles_v1',
} as const;

export const DEFAULT_DOCK_APP_IDS: string[] = [
  'harmony-notes',
  'harmony-docs',
  'harmony-writing',
  'harmony-music-player',
  'harmony-app-store',
  'harmony-calendar',
  'harmony-finance',
  'harmony-docs-ai'
];

export const DEFAULT_WIDGET_SIZES: Record<string, 'small' | 'medium' | 'large'> = {
  calendar: 'medium',
  finance: 'medium',
  music: 'small',
  'docs-ai': 'small',
  notes: 'small',
  writing: 'small',
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  isDarkMode: true,
  themeMode: 'dark',
  themePreset: 'habeshawi-gold',
  volume: 0.8,
  brightness: 1,
  typewriterSounds: true,
  hapticFeedback: true,
  defaultViewMode: 'native',
  accentColor: '#f59e0b',
  focusMode: false,
  dockAppIds: DEFAULT_DOCK_APP_IDS,
  dockMaxSmallScreen: 5,
  dockMaxLargeScreen: 7,
  launcherIconStyle: 'vibrant',
  launcherGridDensity: 'standard',
  launcherIconArrangement: 'bottom',
  launcherShowLabels: true,
  launcherShowPageDots: true,
  launcherJiggleOnLongPress: true,
  lockScreenEnabled: true,
  lockScreenRequirePasscode: false,
  lockScreenPasscode: '1234',
  lockScreenClockStyle: 'default',
  lockScreenShowDate: true,
  lockScreenShowNotifications: true,
  lockScreenShowWidgets: true,
  lockScreenShowControlCenter: true,
  lockScreenAutoLockTimeout: '5min',
  lockScreenWallpaperBlur: false,
  lockScreenOwnerText: 'Habeshawi OS • Selam',
  fontFamily: 'system',
  fontSizeScale: 'standard',
  boldText: false,
  displayScale: 'standard',
  nightShift: false,
  colorTemperature: 'standard',
  highContrast: false,
  reduceTransparency: false,
  reduceMotion: false,
};

export interface QueuedSyncAction {
  id: string;
  entity: 'notes' | 'docs' | 'drafts' | 'playlists' | 'aichats' | 'calendar';
  action: 'save' | 'delete';
  payload: any;
  timestamp: number;
}

// Default initial datasets if storage is empty offline (Clean production state)
export const INITIAL_OFFLINE_NOTES: HarmonyNote[] = [];
export const INITIAL_OFFLINE_DOCS: HarmonyDoc[] = [];
export const INITIAL_OFFLINE_DRAFTS: HarmonyWritingDraft[] = [];
export const INITIAL_OFFLINE_PLAYLISTS: HarmonyPlaylist[] = [];
export const INITIAL_OFFLINE_EVENTS: HarmonyCalendarEvent[] = [];

// In-memory fallback if Tracking Prevention or browser policy blocks window.localStorage
const memoryStorage = new Map<string, string>();

function safeGetStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Tracking Prevention or SecurityError
  }
  return null;
}

// Automatically prune legacy dummy datasets from localStorage
(function cleanupLegacyDummyData() {
  try {
    const storage = safeGetStorage();
    if (!storage) return;

    // Run cleanup flag
    const CLEANUP_KEY = 'harmony_production_cleaned_v6';
    if (storage.getItem(CLEANUP_KEY) === 'true') return;

    // Check & sanitize finance data
    [
      STORAGE_KEYS.FINANCE_TRANSACTIONS,
      STORAGE_KEYS.FINANCE_ACCOUNTS,
      STORAGE_KEYS.FINANCE_BUDGETS,
      STORAGE_KEYS.FINANCE_LOANS,
      STORAGE_KEYS.FINANCE_SUBSCRIPTIONS,
    ].forEach((key) => {
      const raw = storage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Remove any items that look like dummy data
            const cleaned = parsed.filter((item: any) => {
              const str = JSON.stringify(item).toLowerCase();
              return !(
                str.includes('chase sapphire') ||
                str.includes('silicon valley bank') ||
                str.includes('macbook pro m3') ||
                str.includes('netflix 4k') ||
                str.includes('sample') ||
                str.includes('dummy') ||
                (typeof item.id === 'string' && (item.id.startsWith('tx-') || item.id.startsWith('acc-') || item.id.startsWith('loan-') || item.id.startsWith('sub-') || item.id.startsWith('b-')))
              );
            });
            storage.setItem(key, JSON.stringify(cleaned));
          }
        } catch {
          storage.removeItem(key);
        }
      }
    });

    // Check & sanitize notes/docs/playlists/calendar/typewriter
    [
      STORAGE_KEYS.NOTES,
      STORAGE_KEYS.SYSTEM_NOTES,
      STORAGE_KEYS.DOCS,
      STORAGE_KEYS.SYSTEM_DOCS,
      STORAGE_KEYS.PLAYLISTS,
      STORAGE_KEYS.SYSTEM_PLAYLISTS,
      STORAGE_KEYS.CALENDAR,
      STORAGE_KEYS.SYSTEM_CALENDAR,
      'harmony_notes_data',
      'harmony_writing_data',
      'harmony_music_tracks'
    ].forEach((key) => {
      const raw = storage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((item: any) => {
              const str = JSON.stringify(item).toLowerCase();
              if (str.includes('the art of modular systems') || str.includes('chapter 1: the foundations')) return false;
              if (str.includes('midnight coding symphony') || str.includes('cyberpunk neon rain')) return false;
              if (typeof item.id === 'string' && (item.id.startsWith('offline-') || item.id === 'draft-1')) return false;
              return true;
            });
            storage.setItem(key, JSON.stringify(cleaned));
          }
        } catch {
          storage.removeItem(key);
        }
      }
    });

    storage.setItem(CLEANUP_KEY, 'true');
  } catch {
    // Ignore in non-browser context
  }
})();

// Helper to safely read from localStorage (with tracking-prevention resilient memory fallback and legacy key migration)
export function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const storage = safeGetStorage();
    let raw = storage ? storage.getItem(key) : memoryStorage.get(key);
    
    // Check and migrate legacy harmony_ key if present
    if (!raw && key.startsWith('habeshawi_')) {
      const legacyKey = key.replace('habeshawi_', 'harmony_');
      const legacyRaw = storage ? storage.getItem(legacyKey) : memoryStorage.get(legacyKey);
      if (legacyRaw) {
        raw = legacyRaw;
        // Save to new key so subsequent accesses are instant
        try {
          if (storage) storage.setItem(key, legacyRaw);
          memoryStorage.set(key, legacyRaw);
        } catch {
          // ignore
        }
      }
    }

    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    const memoryRaw = memoryStorage.get(key);
    if (memoryRaw) {
      try {
        return JSON.parse(memoryRaw) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

// Helper to safely write to localStorage & notify Service Worker (with tracking-prevention resilient memory fallback)
export function setLocalItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    memoryStorage.set(key, serialized);
    const storage = safeGetStorage();
    if (storage) {
      storage.setItem(key, serialized);
    }
    // Broadcast snapshot to Service Worker if available
    notifyServiceWorkerSnapshot(key, value);
  } catch {
    // Handled silently by in-memory storage fallback
  }
}

// Send snapshot to Service Worker cache
export function notifyServiceWorkerSnapshot(key: string, data: any) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_MINI_APP_SNAPSHOT',
        key,
        data,
        timestamp: Date.now()
      });
    } catch (err) {
      console.debug('[OfflinePersistence] SW postMessage skipped:', err);
    }
  }
}

// Send dedicated Firestore data (notes, docs, calendar events) to Service Worker cache
export function notifyServiceWorkerFirestoreData(entity: 'notes' | 'docs' | 'calendar' | string, data: any) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_FIRESTORE_DATA',
        entity,
        key: `firestore_${entity}`,
        data,
        timestamp: Date.now()
      });
    } catch (err) {
      console.debug('[OfflinePersistence] SW Firestore postMessage skipped:', err);
    }
  }
}

// Queue an action for when connection restores
export function enqueueOfflineAction(entity: QueuedSyncAction['entity'], action: 'save' | 'delete', payload: any): void {
  const queue = getLocalItem<QueuedSyncAction[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  const newAction: QueuedSyncAction = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    entity,
    action,
    payload,
    timestamp: Date.now()
  };
  queue.push(newAction);
  setLocalItem(STORAGE_KEYS.SYNC_QUEUE, queue);
}

// Clear the sync queue
export function clearOfflineQueue(): void {
  setLocalItem(STORAGE_KEYS.SYNC_QUEUE, []);
}

// Hook for AppRunner and components to observe & interact with offline persistence
export function useOfflinePersistence(cloudState?: {
  notes?: HarmonyNote[];
  docs?: HarmonyDoc[];
  drafts?: HarmonyWritingDraft[];
  playlists?: HarmonyPlaylist[];
  aiChats?: HarmonyAiChat[];
  calendarEvents?: HarmonyCalendarEvent[];
}) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    return getLocalItem<QueuedSyncAction[]>(STORAGE_KEYS.SYNC_QUEUE, []).length;
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return getLocalItem<string>(STORAGE_KEYS.LAST_SYNC, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [cachedItemsCount, setCachedItemsCount] = useState<number>(0);

  // Compute total cached records
  const updateCachedCount = useCallback(() => {
    try {
      const notes = getLocalItem<any[]>(STORAGE_KEYS.NOTES, []);
      const docs = getLocalItem<any[]>(STORAGE_KEYS.DOCS, []);
      const drafts = getLocalItem<any[]>(STORAGE_KEYS.DRAFTS, []);
      const playlists = getLocalItem<any[]>(STORAGE_KEYS.PLAYLISTS, []);
      const events = getLocalItem<any[]>(STORAGE_KEYS.CALENDAR, []);
      setCachedItemsCount(notes.length + docs.length + drafts.length + playlists.length + events.length);
    } catch {
      setCachedItemsCount(0);
    }
  }, []);

  // Sync cloud state into local storage when available
  useEffect(() => {
    if (cloudState?.notes && cloudState.notes.length > 0) {
      setLocalItem(STORAGE_KEYS.NOTES, cloudState.notes);
      setLocalItem(STORAGE_KEYS.SYSTEM_NOTES, cloudState.notes);
      updateCachedCount();
    }
  }, [cloudState?.notes, updateCachedCount]);

  useEffect(() => {
    if (cloudState?.docs && cloudState.docs.length > 0) {
      setLocalItem(STORAGE_KEYS.DOCS, cloudState.docs);
      setLocalItem(STORAGE_KEYS.SYSTEM_DOCS, cloudState.docs);
      updateCachedCount();
    }
  }, [cloudState?.docs, updateCachedCount]);

  useEffect(() => {
    if (cloudState?.drafts && cloudState.drafts.length > 0) {
      setLocalItem(STORAGE_KEYS.DRAFTS, cloudState.drafts);
      setLocalItem(STORAGE_KEYS.SYSTEM_DRAFTS, cloudState.drafts);
      updateCachedCount();
    }
  }, [cloudState?.drafts, updateCachedCount]);

  useEffect(() => {
    if (cloudState?.playlists && cloudState.playlists.length > 0) {
      setLocalItem(STORAGE_KEYS.PLAYLISTS, cloudState.playlists);
      setLocalItem(STORAGE_KEYS.SYSTEM_PLAYLISTS, cloudState.playlists);
      updateCachedCount();
    }
  }, [cloudState?.playlists, updateCachedCount]);

  useEffect(() => {
    if (cloudState?.calendarEvents && cloudState.calendarEvents.length > 0) {
      setLocalItem(STORAGE_KEYS.CALENDAR, cloudState.calendarEvents);
      setLocalItem(STORAGE_KEYS.SYSTEM_CALENDAR, cloudState.calendarEvents);
      updateCachedCount();
    }
  }, [cloudState?.calendarEvents, updateCachedCount]);

  useEffect(() => {
    if (cloudState?.aiChats && cloudState.aiChats.length > 0) {
      setLocalItem(STORAGE_KEYS.AI_CHATS, cloudState.aiChats);
      setLocalItem(STORAGE_KEYS.SYSTEM_CHATS, cloudState.aiChats);
    }
  }, [cloudState?.aiChats]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setLocalItem(STORAGE_KEYS.LAST_SYNC, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial cache tally
    updateCachedCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateCachedCount]);

  // Update pending queue count whenever storage changes
  const refreshQueueCount = useCallback(() => {
    const queue = getLocalItem<QueuedSyncAction[]>(STORAGE_KEYS.SYNC_QUEUE, []);
    setPendingSyncCount(queue.length);
  }, []);

  return {
    isOnline,
    pendingSyncCount,
    lastSyncTime,
    isSyncing,
    cachedItemsCount,
    setIsSyncing,
    refreshQueueCount,
    setLastSyncTime,
    snapshotMiniAppData: (appId: string, data: any) => {
      setLocalItem(`habeshawi_snapshot_${appId}`, data);
      notifyServiceWorkerSnapshot(`habeshawi_snapshot_${appId}`, data);
      updateCachedCount();
    },
    // Direct accessors to cached data with fallback
    getCachedNotes: () => getLocalItem<HarmonyNote[]>(STORAGE_KEYS.NOTES, INITIAL_OFFLINE_NOTES),
    getCachedDocs: () => getLocalItem<HarmonyDoc[]>(STORAGE_KEYS.DOCS, INITIAL_OFFLINE_DOCS),
    getCachedDrafts: () => getLocalItem<HarmonyWritingDraft[]>(STORAGE_KEYS.DRAFTS, INITIAL_OFFLINE_DRAFTS),
    getCachedPlaylists: () => getLocalItem<HarmonyPlaylist[]>(STORAGE_KEYS.PLAYLISTS, INITIAL_OFFLINE_PLAYLISTS),
    getCachedAiChats: () => getLocalItem<HarmonyAiChat[]>(STORAGE_KEYS.AI_CHATS, [])
  };
}

// -----------------------------------------------------------------------------
// Initial Offline Datasets for Finance & Ledger Suite (Clean, user-authored start)
// -----------------------------------------------------------------------------
export const INITIAL_OFFLINE_FINANCE_ACCOUNTS: FinanceAccount[] = [];
export const INITIAL_OFFLINE_FINANCE_BUDGETS: FinanceBudget[] = [];
export const INITIAL_OFFLINE_FINANCE_LOANS: FinanceLoan[] = [];
export const INITIAL_OFFLINE_FINANCE_SUBSCRIPTIONS: FinanceSubscription[] = [];
export const INITIAL_OFFLINE_FINANCE_TRANSACTIONS: FinanceTransaction[] = [];

// -----------------------------------------------------------------------------
// Offline Manual User Accounts Persistence
// -----------------------------------------------------------------------------
export interface LocalManualAccount {
  uid: string;
  email: string;
  displayName: string;
  password?: string;
  createdAt: number;
}

const LOCAL_ACCOUNTS_KEY = 'habeshawi_manual_accounts_v1';
export const ACTIVE_MANUAL_USER_KEY = 'habeshawi_active_manual_user';

export function saveLocalManualAccount(account: LocalManualAccount): void {
  const existing = getLocalItem<LocalManualAccount[]>(LOCAL_ACCOUNTS_KEY, []);
  const filtered = existing.filter(a => a.email.toLowerCase() !== account.email.toLowerCase());
  filtered.push(account);
  setLocalItem(LOCAL_ACCOUNTS_KEY, filtered);
}

export function getLocalManualAccount(email: string): LocalManualAccount | null {
  const existing = getLocalItem<LocalManualAccount[]>(LOCAL_ACCOUNTS_KEY, []);
  return existing.find(a => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

