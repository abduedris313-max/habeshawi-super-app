/**
 * @file appQuickActions.ts
 * @description Quick actions management module for Habeshawi Super App applications.
 * Provides fine-grained control over per-app notification preferences and isolated local cache clearing.
 * Fully compliant with Apple iOS Human Interface Guidelines (HIG).
 */

import { STORAGE_KEYS, getLocalItem, setLocalItem } from './offlinePersistence';
import { soundManager } from './soundManager';
import { triggerHaptic } from '../utils/haptics';
import { audioStorage } from '../apps/music/utils/audioStorage';

export interface AppCacheInfo {
  appId: string;
  totalBytes: number;
  formattedSize: string;
  itemCount: number;
  keys: string[];
}

export interface AppNotificationPrefs {
  [appId: string]: boolean;
}

export interface FactoryResetResult {
  success: boolean;
  appId: string;
  bytesFreed: number;
  storageKeysCleared: number;
  mediaCleared: boolean;
  preferencesCleared: boolean;
}

/**
 * Comprehensive mapping of mini-app IDs to known persistent storage, media, and preference keys
 */
export const APP_STORAGE_KEY_MAP: Record<string, string[]> = {
  'harmony-notes': [
    STORAGE_KEYS.NOTES,
    STORAGE_KEYS.SYSTEM_NOTES,
    'harmony_notes_data',
    'harmony_notes_sidebar_collapsed',
    'harmony_notes_active_id',
    'habeshawi_snapshot_harmony-notes',
    'habeshawi_cache_harmony-notes'
  ],
  'harmony-docs': [
    STORAGE_KEYS.DOCS,
    STORAGE_KEYS.SYSTEM_DOCS,
    'harmony_docs_data',
    'harmony_docs_sidebar_collapsed',
    'harmony_docs_active_id',
    'habeshawi_snapshot_harmony-docs',
    'habeshawi_cache_harmony-docs'
  ],
  'harmony-writing': [
    STORAGE_KEYS.DRAFTS,
    STORAGE_KEYS.SYSTEM_DRAFTS,
    'harmony_writing_data',
    'harmony_writing_sidebar_collapsed',
    'harmony_writing_active_id',
    'habeshawi_snapshot_harmony-writing',
    'habeshawi_cache_harmony-writing'
  ],
  'harmony-music-player': [
    STORAGE_KEYS.PLAYLISTS,
    STORAGE_KEYS.SYSTEM_PLAYLISTS,
    'harmony_music_tracks',
    'harmony_music_favorites',
    'harmony_music_player_state',
    'harmony_music_volume',
    'harmony_music_recent',
    'habeshawi_music_data',
    'habeshawi_snapshot_harmony-music-player',
    'habeshawi_cache_harmony-music-player'
  ],
  'harmony-calendar': [
    STORAGE_KEYS.CALENDAR,
    STORAGE_KEYS.SYSTEM_CALENDAR,
    'harmony_calendar_view',
    'harmony_calendar_selected_date',
    'habeshawi_calendar_data',
    'habeshawi_snapshot_harmony-calendar',
    'habeshawi_cache_harmony-calendar'
  ],
  'harmony-finance': [
    STORAGE_KEYS.FINANCE_TRANSACTIONS,
    STORAGE_KEYS.FINANCE_ACCOUNTS,
    STORAGE_KEYS.FINANCE_BUDGETS,
    STORAGE_KEYS.FINANCE_LOANS,
    STORAGE_KEYS.FINANCE_SUBSCRIPTIONS,
    'harmony_finance_currency',
    'harmony_finance_active_tab',
    'habeshawi_snapshot_harmony-finance',
    'habeshawi_cache_harmony-finance'
  ],
  'harmony-docs-ai': [
    STORAGE_KEYS.AI_CHATS,
    STORAGE_KEYS.SYSTEM_CHATS,
    'harmony_docs_ai_sidebar_collapsed',
    'habeshawi_snapshot_harmony-docs-ai',
    'habeshawi_cache_harmony-docs-ai'
  ],
  'harmony-app-store': [
    STORAGE_KEYS.APP_REPOSITORIES,
    STORAGE_KEYS.DOWNLOADED_APP_BUNDLES,
    STORAGE_KEYS.INSTALLED_APPS,
    'habeshawi_snapshot_harmony-app-store',
    'habeshawi_cache_harmony-app-store'
  ],
  'harmony-voice': [
    'habeshawi_voice_sessions_v1',
    'habeshawi_voice_pref_v1_voice',
    'habeshawi_voice_pref_v1_persona',
    'habeshawi_voice_history',
    'habeshawi_snapshot_harmony-voice',
    'habeshawi_cache_harmony-voice'
  ],
  'harmony-ajam-script': [
    'harmony_ajam_offline_meta_v1',
    'harmony_ajam_user_manuscripts',
    'harmony_ajam_bookmarks',
    'harmony_ajam_history',
    'habeshawi_snapshot_harmony-ajam-script',
    'habeshawi_cache_harmony-ajam-script'
  ],
  'harmony-weather': [
    'harmony_weather_cities',
    'harmony_weather_active_city',
    'harmony_weather_unit',
    'habeshawi_snapshot_harmony-weather',
    'habeshawi_cache_harmony-weather'
  ],
  'harmony-calculator': [
    'harmony_calculator_tape',
    'harmony_calculator_history',
    'harmony_calculator_unit_category',
    'habeshawi_snapshot_harmony-calculator',
    'habeshawi_cache_harmony-calculator'
  ],
  'harmony-focus': [
    'harmony_focus_state',
    'harmony_focus_sessions',
    'harmony_focus_sound',
    'harmony_focus_settings',
    'habeshawi_snapshot_harmony-focus',
    'habeshawi_cache_harmony-focus'
  ],
  'harmony-terminal': [
    'harmony_terminal_history',
    'habeshawi_snapshot_harmony-terminal',
    'habeshawi_cache_harmony-terminal'
  ],
  'harmony-habits': [
    'harmony_habits_data',
    'harmony_habits_goals',
    'harmony_habits_streak',
    'habeshawi_snapshot_harmony-habits',
    'habeshawi_cache_harmony-habits'
  ]
};

/**
 * Mapping of App Names to App IDs for notification filtering
 */
const APP_NAME_TO_ID_LOOKUP: Record<string, string> = {
  'habeshawi notes': 'harmony-notes',
  'notes': 'harmony-notes',
  'habeshawi docs': 'harmony-docs',
  'docs': 'harmony-docs',
  'habeshawi writing': 'harmony-writing',
  'writing': 'harmony-writing',
  'habeshawi music': 'harmony-music-player',
  'habeshawi music player': 'harmony-music-player',
  'music': 'harmony-music-player',
  'music player': 'harmony-music-player',
  'habeshawi calendar': 'harmony-calendar',
  'calendar': 'harmony-calendar',
  'habeshawi finance': 'harmony-finance',
  'finance': 'harmony-finance',
  'habeshawi docs ai': 'harmony-docs-ai',
  'docs ai': 'harmony-docs-ai',
  'habeshawi voice': 'harmony-voice',
  'habeshawi voice live': 'harmony-voice',
  'voice': 'harmony-voice',
  'voice live': 'harmony-voice',
  'app store': 'harmony-app-store',
  'habeshawi app store': 'harmony-app-store',
  'weather': 'harmony-weather',
  'habeshawi weather': 'harmony-weather',
  'calculator': 'harmony-calculator',
  'habeshawi calculator': 'harmony-calculator',
  'focus': 'harmony-focus',
  'habeshawi focus': 'harmony-focus',
  'terminal': 'harmony-terminal',
  'habeshawi terminal': 'harmony-terminal',
  'habits': 'harmony-habits',
  'habeshawi habits': 'harmony-habits',
  'ajam': 'harmony-ajam-script',
  'habeshawi ajam': 'harmony-ajam-script',
  'ajam script': 'harmony-ajam-script',
  'habeshawi ajam script': 'harmony-ajam-script'
};

/**
 * Format bytes to human readable string (e.g. "0 B", "420 B", "14.2 KB")
 */
export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Returns whether notifications are allowed for a specific application.
 * Defaults to true.
 */
export function getAppNotificationEnabled(appId: string): boolean {
  if (!appId) return true;
  const prefs = getLocalItem<AppNotificationPrefs>(STORAGE_KEYS.APP_NOTIFICATIONS, {});
  // Explicit false means user muted this specific app; undefined/true means allowed
  return prefs[appId] !== false;
}

/**
 * Updates notification permission for an app.
 */
export function setAppNotificationEnabled(appId: string, enabled: boolean): void {
  if (!appId) return;
  const prefs = getLocalItem<AppNotificationPrefs>(STORAGE_KEYS.APP_NOTIFICATIONS, {});
  prefs[appId] = enabled;
  setLocalItem(STORAGE_KEYS.APP_NOTIFICATIONS, prefs);

  // Dispatch custom window event so listeners immediately synchronize
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('habeshawi_app_notifications_updated', {
        detail: { appId, enabled }
      })
    );
  }
}

/**
 * Toggles notification permission for an app.
 */
export function toggleAppNotification(appId: string): boolean {
  const current = getAppNotificationEnabled(appId);
  const next = !current;
  setAppNotificationEnabled(appId, next);
  return next;
}

/**
 * Helper to check if an incoming notification by title, appName, or appId is permitted.
 */
export function isNotificationAllowedForApp(appIdOrName?: string): boolean {
  if (!appIdOrName) return true;
  
  // Direct app ID lookup
  if (appIdOrName.startsWith('harmony-')) {
    return getAppNotificationEnabled(appIdOrName);
  }

  // Name based lookup
  const normalized = appIdOrName.toLowerCase().trim();
  const mappedId = APP_NAME_TO_ID_LOOKUP[normalized];
  if (mappedId) {
    return getAppNotificationEnabled(mappedId);
  }

  // Check if any app ID matches
  return getAppNotificationEnabled(appIdOrName);
}

/**
 * Dispatches a simulated test notification for the specified app.
 */
export function triggerAppTestAlert(app: { id: string; name: string }): boolean {
  if (!getAppNotificationEnabled(app.id)) {
    return false;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('habeshawi_trigger_notification', {
        detail: {
          title: `${app.name} Alert`,
          message: `Notifications for ${app.name} are active with banner previews and chimes.`,
          appName: app.name,
          appId: app.id
        }
      })
    );
  }
  return true;
}

/**
 * Discovers all localStorage keys associated with a specific app ID.
 */
export function getAppStorageKeys(appId: string): string[] {
  const matchedKeys = new Set<string>();

  // 1. Explicit mapping
  const mapped = APP_STORAGE_KEY_MAP[appId];
  if (mapped) {
    mapped.forEach((k) => matchedKeys.add(k));
  }

  // 2. Generic prefix conventions
  matchedKeys.add(`habeshawi_snapshot_${appId}`);
  matchedKeys.add(`habeshawi_cache_${appId}`);
  matchedKeys.add(`cache_${appId}`);
  matchedKeys.add(`snapshot_${appId}`);

  const appSlug = appId.replace('harmony-', '').replace(/-/g, '_');

  // 3. Scan existing localStorage keys for matches
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const totalKeys = window.localStorage.length;
      for (let i = 0; i < totalKeys; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey.includes(appId.toLowerCase()) ||
            lowerKey.startsWith(`app_${appId}`) ||
            lowerKey.startsWith(`harmony_${appSlug}`) ||
            lowerKey.startsWith(`habeshawi_${appSlug}`) ||
            lowerKey.startsWith(`pref_${appId}`) ||
            lowerKey.startsWith(`${appId}_`)
          ) {
            matchedKeys.add(key);
          }
        }
      }
    } catch {
      // Ignore security/access exceptions
    }
  }

  return Array.from(matchedKeys);
}

/**
 * Computes exact byte size and item count of cached data for a specific app.
 */
export function getAppCacheInfo(appId: string): AppCacheInfo {
  const keys = getAppStorageKeys(appId);
  let totalBytes = 0;
  let itemCount = 0;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      keys.forEach((key) => {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          itemCount++;
          // UTF-16 characters take 2 bytes per char
          totalBytes += (key.length + val.length) * 2;
        }
      });
    } catch {
      // Storage access blocked
    }
  }

  return {
    appId,
    totalBytes,
    formattedSize: formatByteSize(totalBytes),
    itemCount,
    keys
  };
}

/**
 * Clears all cached snapshots, temporary state, and offline persistence for an app.
 */
export async function clearAppCache(appId: string): Promise<{ success: boolean; bytesFreed: number; itemsCleared: number }> {
  const info = getAppCacheInfo(appId);
  let itemsCleared = 0;

  // 1. Clear LocalStorage entries
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      info.keys.forEach((key) => {
        if (window.localStorage.getItem(key) !== null) {
          // If it's a primary data collection, clear content safely or remove
          if (
            key === STORAGE_KEYS.NOTES ||
            key === STORAGE_KEYS.DOCS ||
            key === STORAGE_KEYS.DRAFTS ||
            key === STORAGE_KEYS.PLAYLISTS ||
            key === STORAGE_KEYS.CALENDAR ||
            key === STORAGE_KEYS.AI_CHATS ||
            key === STORAGE_KEYS.FINANCE_TRANSACTIONS
          ) {
            window.localStorage.setItem(key, JSON.stringify([]));
          } else {
            window.localStorage.removeItem(key);
          }
          itemsCleared++;
        }
      });
    } catch (err) {
      console.warn('[appQuickActions] Error removing localStorage keys:', err);
    }
  }

  // 2. Clear Service Worker CacheStorage entries if available
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      for (const cacheName of cacheNames) {
        if (cacheName.includes('firestore') || cacheName.includes('data')) {
          const cache = await window.caches.open(cacheName);
          const requests = await cache.keys();
          for (const req of requests) {
            if (req.url.includes(appId)) {
              await cache.delete(req);
            }
          }
        }
      }
    } catch (err) {
      console.debug('[appQuickActions] CacheStorage cleanup skipped:', err);
    }
  }

  // 3. Post Message to active Service Worker controller
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_APP_CACHE',
        appId
      });
    } catch {
      // SW message skipped
    }
  }

  // 4. Trigger Haptic & Audio confirmation
  triggerHaptic('success');
  soundManager.playClickSound();

  // 5. Dispatch Custom Event for real-time UI synchronization
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('habeshawi_app_cache_cleared', {
        detail: { appId, bytesFreed: info.totalBytes, itemsCleared }
      })
    );
  }

  return {
    success: true,
    bytesFreed: info.totalBytes,
    itemsCleared
  };
}

/**
 * Factory Reset a specific mini-app.
 * Clears ALL local persistent storage, cached media (IndexedDB audio files, CacheStorage media, manuscripts),
 * and user preferences for that specific mini app, followed by an iOS Haptic feedback success trigger.
 * 
 * @param appId The unique identifier of the mini app to factory reset (e.g. 'harmony-notes', 'harmony-music-player')
 * @returns Details on freed bytes, removed keys, media cleared, and operation success.
 */
export async function factoryResetApp(appId: string): Promise<FactoryResetResult> {
  const initialCacheInfo = getAppCacheInfo(appId);
  let storageKeysCleared = 0;
  let mediaCleared = false;
  let preferencesCleared = false;

  // 1. Wipe all LocalStorage keys associated with this app
  const storageKeys = getAppStorageKeys(appId);

  // Also include any preference keys matching the app's normalized name
  const appSlug = appId.replace('harmony-', '').replace(/-/g, '_');
  const appSlugHyphen = appId.replace('harmony-', '');

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Find dynamic preference and state keys
      const totalKeys = window.localStorage.length;
      for (let i = 0; i < totalKeys; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey.includes(appId.toLowerCase()) ||
            lowerKey.includes(appSlug.toLowerCase()) ||
            lowerKey.includes(appSlugHyphen.toLowerCase()) ||
            lowerKey.startsWith(`pref_${appId}`) ||
            lowerKey.startsWith(`${appId}_`)
          ) {
            storageKeys.push(key);
          }
        }
      }

      // Deduplicate keys
      const uniqueKeys = Array.from(new Set(storageKeys));
      uniqueKeys.forEach((key) => {
        if (window.localStorage.getItem(key) !== null) {
          window.localStorage.removeItem(key);
          storageKeysCleared++;
        }
      });
    } catch (err) {
      console.warn('[appQuickActions] Error wiping localStorage in factoryResetApp:', err);
    }

    // Reset notification preference for this specific app
    try {
      const notifPrefs = getLocalItem<AppNotificationPrefs>(STORAGE_KEYS.APP_NOTIFICATIONS, {});
      if (appId in notifPrefs) {
        delete notifPrefs[appId];
        setLocalItem(STORAGE_KEYS.APP_NOTIFICATIONS, notifPrefs);
        preferencesCleared = true;
      }
    } catch (err) {
      console.warn('[appQuickActions] Error resetting notification preference:', err);
    }
  }

  // 2. Wipe SessionStorage keys matching this app
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const sessionKeys: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && (key.includes(appId) || key.includes(appSlug))) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach((k) => window.sessionStorage.removeItem(k));
    } catch (err) {
      console.debug('[appQuickActions] SessionStorage cleanup skipped:', err);
    }
  }

  // 3. Clear Cached Media
  // A. IndexedDB Audio Files & Metadata
  if (appId === 'harmony-music-player' || appId.includes('music')) {
    try {
      await audioStorage.clearAll();
      mediaCleared = true;
    } catch (err) {
      console.warn('[appQuickActions] Error clearing audioStorage IndexedDB:', err);
    }

    // Also attempt database deletion for pristine factory reset state
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('harmony_music_player_db');
      } catch (err) {
        console.debug('[appQuickActions] IndexedDB deleteDatabase skipped:', err);
      }
    }
  }

  // B. CacheStorage (Service Worker caches)
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await window.caches.open(cacheName);
        const requests = await cache.keys();
        for (const req of requests) {
          const reqUrl = req.url.toLowerCase();
          if (
            reqUrl.includes(appId.toLowerCase()) ||
            reqUrl.includes(appSlug.toLowerCase()) ||
            (appId === 'harmony-ajam-script' && cacheName.includes('ajam'))
          ) {
            await cache.delete(req);
            mediaCleared = true;
          }
        }
      }
    } catch (err) {
      console.debug('[appQuickActions] CacheStorage media cleanup skipped:', err);
    }
  }

  // C. Notify Service Worker controller
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'FACTORY_RESET_APP',
        appId
      });
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_APP_CACHE',
        appId
      });
    } catch (err) {
      console.debug('[appQuickActions] SW postMessage skipped:', err);
    }
  }

  // 4. Haptic Feedback Success Trigger
  // Mandated requirement: "followed by a Haptic feedback success trigger"
  triggerHaptic('success');
  soundManager.playClickSound();

  // 5. Broadcast synchronization events
  if (typeof window !== 'undefined') {
    // Notify app notification settings listeners
    window.dispatchEvent(
      new CustomEvent('habeshawi_app_notifications_updated', {
        detail: { appId, enabled: true }
      })
    );

    // Notify cache info listeners
    window.dispatchEvent(
      new CustomEvent('habeshawi_app_cache_cleared', {
        detail: { appId, bytesFreed: initialCacheInfo.totalBytes, itemsCleared: storageKeysCleared }
      })
    );

    // Dispatch primary factory reset event
    window.dispatchEvent(
      new CustomEvent('habeshawi_app_factory_reset', {
        detail: {
          appId,
          bytesFreed: initialCacheInfo.totalBytes,
          storageKeysCleared,
          mediaCleared,
          preferencesCleared,
          timestamp: Date.now()
        }
      })
    );
  }

  return {
    success: true,
    appId,
    bytesFreed: initialCacheInfo.totalBytes,
    storageKeysCleared,
    mediaCleared,
    preferencesCleared
  };
}
