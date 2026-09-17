/**
 * @file appRepository.ts
 * @description Central Repository configuration and application registry for Habeshawi App Store.
 * Provides central repository endpoints, app metadata schemas, versioning, bundle specs,
 * and remote catalog fetching with offline resiliency.
 */

import { MiniAppConfig, AppRepositorySource } from '../types';
import { getLucideCdnIconUrl } from '../lib/cdn';

/**
 * Built-in Central Repositories configured in the SuperApp
 */
export const DEFAULT_REPOSITORIES: AppRepositorySource[] = [
  {
    id: 'harmony-official',
    name: 'Habeshawi Official Registry',
    url: 'https://repo.habeshawi-os.dev/v2/core-apps.json',
    description: 'Verified first-party productivity, creativity, cultural, and financial engines by Habeshawi Core Team.',
    isOfficial: true,
    appsCount: 8,
    lastFetchedAt: new Date().toISOString(),
    isEnabled: true
  },
  {
    id: 'harmony-community',
    name: 'Habeshawi Community Hub',
    url: 'https://repo.habeshawi-os.dev/v2/community-apps.json',
    description: 'Open-source utilities, developer tools, calculators, weather stations, and lifestyle apps.',
    isOfficial: false,
    appsCount: 5,
    lastFetchedAt: new Date().toISOString(),
    isEnabled: true
  }
];

/**
 * Master App Catalog available in the Central Repository
 */
export const CENTRAL_REPOSITORY_APPS: MiniAppConfig[] = [
  // -------------------------------------------------------------
  // Pre-Installed Core Ecosystem Apps
  // -------------------------------------------------------------
  {
    id: 'harmony-notes',
    name: 'Habeshawi Notes',
    tagline: 'Smart Notes & Category Organizers',
    iconName: 'notebook',
    iconCdnUrl: getLucideCdnIconUrl('notebook'),
    colorGradient: 'from-amber-400 via-orange-500 to-amber-600',
    bgHex: '#f59e0b',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-notes/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-notes',
    description: 'Capture quick thoughts, markdown checklists, voice memos, and categorized notebooks with Firestore offline sync.',
    badge: 'Notes',
    version: '1.4.2',
    author: 'Habeshawi Core',
    size: '1.4 MB',
    category: 'productivity',
    rating: 4.9,
    downloadsCount: 142000,
    isSystemApp: true,
    repositoryId: 'harmony-official',
    permissions: ['storage', 'network', 'offline-cache']
  },
  {
    id: 'harmony-docs',
    name: 'Habeshawi Docs',
    tagline: 'Rich Text Workspace & Collaborative Documents',
    iconName: 'file-text',
    iconCdnUrl: getLucideCdnIconUrl('file-text'),
    colorGradient: 'from-blue-500 via-indigo-500 to-cyan-600',
    bgHex: '#3b82f6',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-docs/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-docs',
    description: 'Collaborative document workspace, word count statistics, typography styling, and PDF exports.',
    badge: 'Docs',
    version: '1.3.8',
    author: 'Habeshawi Core',
    size: '2.1 MB',
    category: 'productivity',
    rating: 4.8,
    downloadsCount: 98000,
    isSystemApp: true,
    repositoryId: 'harmony-official',
    permissions: ['storage', 'network', 'offline-cache']
  },
  {
    id: 'harmony-writing',
    name: 'Habeshawi Writing',
    tagline: 'Focus Studio, Soundscapes & Daily Word Target',
    iconName: 'pen-tool',
    iconCdnUrl: getLucideCdnIconUrl('pen-tool'),
    colorGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    bgHex: '#10b981',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-writing/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-writing',
    description: 'Distraction-free typewriter environment, acoustic mechanical keyboard sounds, word goal meters, and dark paper themes.',
    badge: 'Studio',
    version: '1.2.5',
    author: 'Habeshawi Flow',
    size: '1.6 MB',
    category: 'productivity',
    rating: 4.9,
    downloadsCount: 76000,
    isSystemApp: true,
    repositoryId: 'harmony-official',
    permissions: ['storage', 'audio', 'offline-cache']
  },
  {
    id: 'harmony-calendar',
    name: 'Habeshawi Calendar',
    tagline: 'Gregorian • Hijri • Ethiopian with Google Sync',
    iconName: 'calendar',
    iconCdnUrl: getLucideCdnIconUrl('calendar'),
    colorGradient: 'from-rose-500 via-red-600 to-amber-600',
    bgHex: '#ef4444',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-calendar/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-calendar',
    description: 'Tri-calendar engine synchronizing Gregorian, Islamic Hijri, and Ethiopian Ge’ez dates with agenda view and Google Calendar export.',
    badge: 'Calendar',
    version: '1.5.0',
    author: 'Habeshawi Core',
    size: '2.2 MB',
    category: 'productivity',
    rating: 4.9,
    downloadsCount: 115000,
    isSystemApp: true,
    repositoryId: 'harmony-official',
    permissions: ['storage', 'network', 'offline-cache']
  },
  {
    id: 'harmony-finance',
    name: 'Habeshawi Finance',
    tagline: 'Expense Ledger, Budgets & Loan EMI Amortization',
    iconName: 'wallet',
    iconCdnUrl: getLucideCdnIconUrl('wallet'),
    colorGradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    bgHex: '#059669',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-finance/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-finance',
    description: 'Personal finance and cash flow ledger, category budgets, bank account reconciliation, debt amortization calculator, and AI financial advisor.',
    badge: 'Finance',
    version: '1.4.1',
    author: 'Habeshawi Finance Group',
    size: '2.8 MB',
    category: 'finance',
    rating: 4.8,
    downloadsCount: 84000,
    isSystemApp: false,
    repositoryId: 'harmony-official',
    permissions: ['storage', 'network', 'offline-cache']
  },
  {
    id: 'harmony-music-player',
    name: 'Habeshawi Music',
    tagline: 'Hi-Fi Playlists & Ethio-Audio Synth Engine',
    iconName: 'disc',
    iconCdnUrl: getLucideCdnIconUrl('disc'),
    colorGradient: 'from-fuchsia-500 via-purple-600 to-pink-500',
    bgHex: '#d946ef',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-music-player/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-music-player',
    description: 'iOS-styled Music Player with ambient streams, custom playlists, equalizer controls, audio visualizer, and background playback.',
    badge: 'Audio',
    version: '1.3.4',
    author: 'Habeshawi Soundworks',
    size: '3.6 MB',
    category: 'audio',
    rating: 4.7,
    downloadsCount: 92000,
    isSystemApp: false,
    repositoryId: 'harmony-official',
    permissions: ['audio', 'storage', 'offline-cache']
  },
  {
    id: 'harmony-docs-ai',
    name: 'Habeshawi AI Copilot',
    tagline: 'Gemini Document Intelligence & Copilot',
    iconName: 'sparkles',
    iconCdnUrl: getLucideCdnIconUrl('sparkles'),
    colorGradient: 'from-violet-500 via-purple-600 to-indigo-700',
    bgHex: '#8b5cf6',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-docs-ai/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-docs-ai',
    description: 'Gemini-powered workspace copilot: ask questions across documents, draft summaries, generate meeting minutes, and rephrase text.',
    badge: 'AI',
    version: '1.3.0',
    author: 'Habeshawi AI Labs',
    size: '2.5 MB',
    category: 'ai',
    rating: 4.9,
    downloadsCount: 120000,
    isSystemApp: false,
    repositoryId: 'harmony-official',
    permissions: ['network', 'storage', 'ai-copilot']
  },
  {
    id: 'harmony-ajam-script',
    name: 'Habeshawi Ajam Script',
    tagline: 'Preservation, AI OCR & Historical Manuscripts',
    iconName: 'book-open',
    iconCdnUrl: getLucideCdnIconUrl('book-open'),
    colorGradient: 'from-amber-600 via-orange-600 to-emerald-700',
    bgHex: '#d97706',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-ajam-script/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-ajam-script',
    description: 'Digital preservation, AI OCR transcription, verse audio, virtual keyboard, and catalog for historical Ethiopian Sufi Ajam manuscripts.',
    badge: 'Ajam',
    version: '1.0.0',
    author: 'Habeshawi Preservation',
    size: '2.1 MB',
    category: 'productivity',
    rating: 5.0,
    downloadsCount: 65000,
    isSystemApp: true,
    repositoryId: 'harmony-official',
    permissions: ['storage', 'audio', 'offline-cache']
  },
  {
    id: 'harmony-app-store',
    name: 'Habeshawi App Store',
    tagline: 'Central Repository & Ecosystem App Hub',
    iconName: 'shopping-bag',
    iconCdnUrl: getLucideCdnIconUrl('shopping-bag'),
    colorGradient: 'from-blue-600 via-sky-500 to-indigo-600',
    bgHex: '#0284c7',
    deployedUrl: '#',
    repoUrl: 'https://github.com/abduedris313-max/harmony-super-app',
    description: 'Central app marketplace: discover, fetch, download, install, and update mini-apps from central repositories with offline caching.',
    badge: 'Store',
    version: '2.4.0',
    author: 'Habeshawi Core',
    size: '1.8 MB',
    category: 'utilities',
    rating: 5.0,
    downloadsCount: 250000,
    isSystemApp: true,
    repositoryId: 'harmony-official',
    permissions: ['network', 'storage', 'service-worker', 'package-management']
  },

  // -------------------------------------------------------------
  // Downloadable Central Repository Apps (Available to Download & Install)
  // -------------------------------------------------------------
  {
    id: 'harmony-weather',
    name: 'Habeshawi Weather & Radar',
    tagline: 'Atmospheric Canvas, Hourly Curve & Multi-City Forecasts',
    iconName: 'cloud-sun',
    iconCdnUrl: getLucideCdnIconUrl('cloud-sun'),
    colorGradient: 'from-sky-400 via-blue-500 to-indigo-600',
    bgHex: '#0284c7',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-weather/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-weather',
    description: 'Dynamic iOS 18-styled weather station with live atmospheric canvas, 24-hour temperature slider, 7-day outlook, UV index, air quality index, humidity, wind radar, and city manager.',
    badge: 'Weather',
    version: '1.2.0',
    author: 'Habeshawi Weather Lab',
    size: '2.4 MB',
    category: 'utilities',
    rating: 4.9,
    downloadsCount: 42500,
    isSystemApp: false,
    repositoryId: 'harmony-community',
    permissions: ['network', 'storage', 'offline-cache']
  },
  {
    id: 'harmony-calculator',
    name: 'Habeshawi Calculator & Converter',
    tagline: 'iOS Scientific Keypad & Multi-Unit Currency Converter',
    iconName: 'calculator',
    iconCdnUrl: getLucideCdnIconUrl('calculator'),
    colorGradient: 'from-amber-500 via-orange-500 to-rose-600',
    bgHex: '#f59e0b',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-calculator/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-calculator',
    description: 'Standard and scientific calculator with calculation history tape, memory registers, plus real-time currency, length, weight, and temperature unit converters.',
    badge: 'Utility',
    version: '1.1.4',
    author: 'Habeshawi Core Math',
    size: '1.3 MB',
    category: 'utilities',
    rating: 4.8,
    downloadsCount: 68200,
    isSystemApp: false,
    repositoryId: 'harmony-community',
    permissions: ['storage', 'offline-cache']
  },
  {
    id: 'harmony-focus',
    name: 'Habeshawi Focus Studio',
    tagline: 'Aesthetic Pomodoro Timer, Ambient Synth & Productivity Rings',
    iconName: 'timer',
    iconCdnUrl: getLucideCdnIconUrl('timer'),
    colorGradient: 'from-rose-500 via-pink-600 to-purple-600',
    bgHex: '#e11d48',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-focus/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-focus',
    description: 'Distraction-free Pomodoro focus timer with radial SVG progress display, interval breaks, task checklist, ambient white noise/rain generator, and streak tracking.',
    badge: 'Focus',
    version: '2.0.1',
    author: 'Habeshawi Flow Team',
    size: '1.8 MB',
    category: 'productivity',
    rating: 4.9,
    downloadsCount: 35100,
    isSystemApp: false,
    repositoryId: 'harmony-community',
    permissions: ['audio', 'storage', 'notifications', 'offline-cache']
  },
  {
    id: 'harmony-terminal',
    name: 'Habeshawi Terminal & SysDiag',
    tagline: 'Interactive Unix Shell, Repository CLI & Diagnostics',
    iconName: 'terminal',
    iconCdnUrl: getLucideCdnIconUrl('terminal'),
    colorGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    bgHex: '#059669',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-terminal/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-terminal',
    description: 'Unix-styled developer console with command line prompt (repo, fetch, install, uninstall, storage, ping, sysinfo), Service Worker inspection, and real-time system stats.',
    badge: 'DevTools',
    version: '1.0.8',
    author: 'Habeshawi DevTools',
    size: '1.6 MB',
    category: 'developer',
    rating: 4.7,
    downloadsCount: 19400,
    isSystemApp: false,
    repositoryId: 'harmony-community',
    permissions: ['network', 'storage', 'system-diagnostics']
  },
  {
    id: 'harmony-habits',
    name: 'Habeshawi Habits & Rings',
    tagline: 'Activity Rings & Daily Momentum',
    iconName: 'activity',
    iconCdnUrl: getLucideCdnIconUrl('activity'),
    colorGradient: 'from-teal-400 via-emerald-500 to-cyan-600',
    bgHex: '#0d9488',
    deployedUrl: 'https://abduedris313-max.github.io/harmony-habits/',
    repoUrl: 'https://github.com/abduedris313-max/harmony-habits',
    description: 'Track daily micro-habits, hydration, fitness, and mindfulness with visual concentric activity rings, automatic streak calculation, and motivational achievement badges.',
    badge: 'Habits',
    version: '1.3.0',
    author: 'Habeshawi Wellness',
    size: '2.1 MB',
    category: 'health',
    rating: 4.8,
    downloadsCount: 27800,
    isSystemApp: false,
    repositoryId: 'harmony-community',
    permissions: ['storage', 'notifications', 'offline-cache']
  }
];

/**
 * Default Installed Apps on first launch (The core apps)
 */
export const DEFAULT_INSTALLED_APP_IDS: string[] = [
  'harmony-notes',
  'harmony-docs',
  'harmony-writing',
  'harmony-calendar',
  'harmony-music-player',
  'harmony-docs-ai',
  'harmony-finance',
  'harmony-ajam-script',
  'harmony-app-store'
];

/**
 * Simulates or performs a fetch to a Central Repository manifest.
 * With fallback to the offline resilient catalog.
 */
export async function fetchCentralRepository(repoUrl?: string): Promise<{
  success: boolean;
  repositoryName: string;
  apps: MiniAppConfig[];
  latencyMs: number;
  source: 'remote' | 'cached-registry';
}> {
  const startTime = performance.now();

  // 1. If a custom repository URL is passed, attempt a real HTTP GET fetch
  if (repoUrl && repoUrl.startsWith('http')) {
    try {
      const response = await fetch(repoUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });

      if (response.ok) {
        const data = await response.json();
        const appsList: MiniAppConfig[] = Array.isArray(data) ? data : data.apps || [];
        const latency = Math.round(performance.now() - startTime);

        return {
          success: true,
          repositoryName: data.name || 'Custom Central Repository',
          apps: appsList,
          latencyMs: Math.max(12, latency),
          source: 'remote'
        };
      }
    } catch (err) {
      console.warn('[CentralRepo] Remote fetch returned error, using fallback catalog:', err);
    }
  }

  // 2. Check if the Admin Developer Console published apps to shared storage
  try {
    const adminCatalogJson = localStorage.getItem('habeshawi_admin_central_catalog') || localStorage.getItem('harmony_admin_central_catalog');
    if (adminCatalogJson) {
      const parsed = JSON.parse(adminCatalogJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out deprecated or draft apps for user-facing store
        const publishedApps = parsed.filter((a: any) => !a.status || a.status === 'published');
        if (publishedApps.length > 0) {
          const latency = Math.round(performance.now() - startTime);
          return {
            success: true,
            repositoryName: 'Habeshawi Central Repository (Admin Synced)',
            apps: publishedApps,
            latencyMs: Math.max(18, latency),
            source: 'remote'
          };
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Fallback to built-in Central Repository catalog
  await new Promise((res) => setTimeout(res, 200));
  const latency = Math.round(performance.now() - startTime);

  return {
    success: true,
    repositoryName: 'Habeshawi Official Central Registry v2.5',
    apps: CENTRAL_REPOSITORY_APPS,
    latencyMs: Math.max(15, latency),
    source: 'cached-registry'
  };
}
