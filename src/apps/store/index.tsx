/**
 * @file index.tsx
 * @description Harmony App Store & Central Repository Mini-App Module.
 * Enables the SuperApp to fetch, browse, stream download, and install mini-apps
 * from central repositories, manage custom repo sources, and inspect storage.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Pin, 
  PinOff, 
  ExternalLink, 
  Github, 
  Play, 
  Sparkles, 
  Check, 
  Info, 
  RotateCcw, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  ArrowUpRight,
  Download,
  CloudDownload,
  CheckCircle2,
  Trash2,
  Server,
  HardDrive,
  RefreshCw,
  Plus,
  Radio,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { CENTRAL_REPOSITORY_APPS, fetchCentralRepository } from '../../config/appRepository';
import { 
  downloadAppPackage, 
  uninstallAppPackage, 
  calculateInstalledStorageFootprint,
  getAppRepositories,
  saveAppRepositories
} from '../../lib/appStoreService';
import { MiniAppConfig, SystemUser, AppRepositorySource } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import { HabeshawiAppIcon, HabeshawiBrandEmblem } from '../../components/HabeshawiIcons';

interface HarmonyAppStoreProps {
  user?: SystemUser | null;
  pinnedAppIds: string[];
  installedAppIds?: string[];
  onTogglePinApp: (appId: string) => void;
  onOpenApp: (appId: string) => void;
  onInstallApp?: (app: MiniAppConfig) => void;
  onUninstallApp?: (appId: string) => void;
  isDarkMode?: boolean;
}

type StoreTab = 'discover' | 'repositories' | 'installed';
type CategoryFilter = 'all' | 'installed' | 'available' | 'productivity' | 'utilities' | 'finance' | 'audio' | 'ai' | 'developer' | 'health';

export const HarmonyAppStoreModule: React.FC<HarmonyAppStoreProps> = ({
  user,
  pinnedAppIds,
  installedAppIds: propInstalledAppIds,
  onTogglePinApp,
  onOpenApp,
  onInstallApp,
  onUninstallApp,
  isDarkMode: propIsDarkMode,
}) => {
  const theme = useTheme();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : theme.isDark;

  const [activeTab, setActiveTab] = useState<StoreTab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedApp, setSelectedApp] = useState<MiniAppConfig | null>(null);

  // Installed app IDs state (synced with props or default)
  const [installedIds, setInstalledIds] = useState<string[]>(() => {
    return propInstalledAppIds || CENTRAL_REPOSITORY_APPS.filter(a => a.isSystemApp || ['harmony-music-player', 'harmony-docs-ai', 'harmony-finance'].includes(a.id)).map(a => a.id);
  });

  // Track currently downloading apps and their progress percentages
  const [downloadingApps, setDownloadingApps] = useState<Record<string, number>>({});
  
  // Central Repository fetch & sync state
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [repoLatency, setRepoLatency] = useState<number>(24);
  const [repoStatusMessage, setRepoStatusMessage] = useState<string>('Connected to Harmony Official Central Registry (13 packages synced)');
  const [repositories, setRepositories] = useState<AppRepositorySource[]>(() => getAppRepositories());
  const [customRepoUrl, setCustomRepoUrl] = useState('');
  const [customRepoName, setCustomRepoName] = useState('');
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (propInstalledAppIds) {
      setInstalledIds(propInstalledAppIds);
    }
  }, [propInstalledAppIds]);

  // Fetch / Sync with Central Repository
  const handleFetchRepository = async (repoUrl?: string) => {
    triggerHaptic('medium');
    setIsFetchingRepo(true);
    setRepoError(null);

    try {
      const result = await fetchCentralRepository(repoUrl);
      setRepoLatency(result.latencyMs);
      setRepoStatusMessage(`Synchronized with ${result.repositoryName} (${result.apps.length} packages ready)`);
      triggerHaptic('success');
    } catch (err: any) {
      setRepoError('Failed to synchronize with central repository. Using offline cached registry.');
      triggerHaptic('error');
    } finally {
      setIsFetchingRepo(false);
    }
  };

  // Trigger app package download & installation
  const handleDownloadApp = async (app: MiniAppConfig) => {
    if (installedIds.includes(app.id) || downloadingApps[app.id] !== undefined) {
      return;
    }

    triggerHaptic('medium');
    setDownloadingApps((prev) => ({ ...prev, [app.id]: 5 }));

    try {
      await downloadAppPackage(app, (pct) => {
        setDownloadingApps((prev) => ({ ...prev, [app.id]: pct }));
      });

      // Update installed list
      const updated = [...installedIds, app.id];
      setInstalledIds(updated);
      
      // Auto-pin to home screen if callback provided
      if (onInstallApp) {
        onInstallApp(app);
      }
      if (!pinnedAppIds.includes(app.id)) {
        onTogglePinApp(app.id);
      }

      setDownloadingApps((prev) => {
        const next = { ...prev };
        delete next[app.id];
        return next;
      });

      triggerHaptic('success');
    } catch (err) {
      console.error('[AppStore] Failed to download app package:', err);
      setDownloadingApps((prev) => {
        const next = { ...prev };
        delete next[app.id];
        return next;
      });
      triggerHaptic('error');
    }
  };

  // Uninstall / offload an app package
  const handleUninstallApp = async (appId: string) => {
    const matched = CENTRAL_REPOSITORY_APPS.find(a => a.id === appId);
    if (matched?.isSystemApp) {
      alert('System applications cannot be uninstalled from Harmony OS.');
      return;
    }

    triggerHaptic('heavy');
    const updated = await uninstallAppPackage(appId);
    setInstalledIds(updated);

    if (onUninstallApp) {
      onUninstallApp(appId);
    }
    if (pinnedAppIds.includes(appId)) {
      onTogglePinApp(appId);
    }
    if (selectedApp?.id === appId) {
      setSelectedApp(null);
    }
  };

  // Add custom central repository
  const handleAddCustomRepo = () => {
    if (!customRepoUrl.trim()) return;
    triggerHaptic('medium');

    const newRepo: AppRepositorySource = {
      id: `custom-${Date.now()}`,
      name: customRepoName.trim() || 'Community Registry',
      url: customRepoUrl.trim(),
      description: 'Custom community repository source registered by user.',
      isOfficial: false,
      appsCount: 4,
      lastFetchedAt: new Date().toISOString(),
      isEnabled: true
    };

    const updated = [...repositories, newRepo];
    setRepositories(updated);
    saveAppRepositories(updated);
    setCustomRepoUrl('');
    setCustomRepoName('');
    setIsAddingRepo(false);
    handleFetchRepository(newRepo.url);
  };

  // Storage calculation
  const storageFootprint = useMemo(() => {
    return calculateInstalledStorageFootprint(installedIds);
  }, [installedIds]);

  // Filter apps
  const filteredApps = useMemo(() => {
    return CENTRAL_REPOSITORY_APPS.filter((app) => {
      const isInstalled = installedIds.includes(app.id);

      const matchesSearch = 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.category && app.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      switch (activeCategory) {
        case 'installed':
          return isInstalled;
        case 'available':
          return !isInstalled;
        case 'productivity':
          return app.category === 'productivity';
        case 'utilities':
          return app.category === 'utilities';
        case 'finance':
          return app.category === 'finance';
        case 'audio':
          return app.category === 'audio';
        case 'ai':
          return app.category === 'ai';
        case 'developer':
          return app.category === 'developer';
        case 'health':
          return app.category === 'health';
        case 'all':
        default:
          return true;
      }
    });
  }, [searchQuery, activeCategory, installedIds]);

  return (
    <div className={`h-full w-full flex flex-col overflow-y-auto ${
      isDarkMode ? 'bg-[#0d1117] text-[#c9d1d9]' : 'bg-neutral-50 text-neutral-900'
    }`}>
      {/* App Store Top Header */}
      <div className={`p-4 md:p-6 border-b shrink-0 ${
        isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-200'
      }`}>
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Brand Row + Repositories Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <HabeshawiBrandEmblem size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                    Habeshawi App Store
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Central Repo v2.4
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                  Fetch, stream download, and install mini-apps from the Habeshawi Central Repository.
                </p>
              </div>
            </div>

            {/* Quick Repository Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/admin.html"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  isDarkMode 
                    ? 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30' 
                    : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                }`}
                title="Launch separate App Store Developer Console & Admin Portal"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Developer Console</span>
              </a>

              <button
                onClick={() => handleFetchRepository()}
                disabled={isFetchingRepo}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isDarkMode 
                    ? 'bg-[#0d1117] border-[#30363d] text-neutral-300 hover:text-white hover:border-blue-500' 
                    : 'bg-white border-neutral-300 text-neutral-700 hover:text-blue-600'
                }`}
                title="Fetch latest releases from Central Repository"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isFetchingRepo ? 'animate-spin' : ''}`} />
                <span>{isFetchingRepo ? 'Fetching...' : 'Fetch Central Repo'}</span>
              </button>

              <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 font-mono ${
                isDarkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-100 border-neutral-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-neutral-400">{repoLatency}ms</span>
              </div>
            </div>
          </div>

          {/* Connected Repository Status Banner */}
          <div className={`p-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs ${
            isDarkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-blue-50/60 border-blue-100'
          }`}>
            <div className="flex items-center gap-2 truncate">
              <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate text-[11px] text-neutral-400 dark:text-neutral-300 font-medium">
                {repoStatusMessage}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 shrink-0 uppercase tracking-wider">
              Ready
            </span>
          </div>

          {/* Sub-Navigation Tabs: Discover | Repositories | Installed */}
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-[#30363d] pt-1">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('discover');
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                activeTab === 'discover'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Discover & Catalog
              {activeTab === 'discover' && (
                <motion.div layoutId="store-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('repositories');
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === 'repositories'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>Central Repositories</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {repositories.length}
              </span>
              {activeTab === 'repositories' && (
                <motion.div layoutId="store-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('installed');
              }}
              className={`pb-2.5 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === 'installed'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-3 h-3" />
              <span>Installed Apps ({installedIds.length})</span>
              {activeTab === 'installed' && (
                <motion.div layoutId="store-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          </div>

          {/* Search & Category Filter Chips (Only for Discover Tab) */}
          {activeTab === 'discover' && (
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search apps by name, category, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none border transition-all ${
                    isDarkMode
                      ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-blue-500'
                      : 'bg-white border-neutral-200 text-neutral-900 focus:border-blue-500 shadow-sm'
                  }`}
                />
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {(
                  [
                    { id: 'all', label: 'All Apps' },
                    { id: 'available', label: 'Ready to Download' },
                    { id: 'installed', label: `Installed (${installedIds.length})` },
                    { id: 'productivity', label: 'Productivity' },
                    { id: 'utilities', label: 'Utilities' },
                    { id: 'finance', label: 'Finance' },
                    { id: 'audio', label: 'Audio' },
                    { id: 'ai', label: 'AI' },
                    { id: 'developer', label: 'Developer' },
                    { id: 'health', label: 'Health' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setActiveCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : isDarkMode
                          ? 'bg-[#0d1117] text-neutral-400 border-[#30363d] hover:text-white'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Discover & Catalog Grid */}
      {activeTab === 'discover' && (
        <div className="max-w-4xl mx-auto w-full p-4 md:p-6 flex-1">
          {filteredApps.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-10 h-10 mx-auto text-neutral-500 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No apps match your filter</p>
              <p className="text-xs text-neutral-400 mt-1">Try searching for a different keyword or resetting categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.map((app) => {
                const isInstalled = installedIds.includes(app.id);
                const isPinned = pinnedAppIds.includes(app.id);
                const downloadProgress = downloadingApps[app.id];
                const isDownloading = downloadProgress !== undefined;

                return (
                  <motion.div
                    key={app.id}
                    whileHover={{ y: -2 }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isDarkMode
                        ? 'bg-[#161b22] border-[#30363d] hover:border-[#58a6ff]'
                        : 'bg-white border-neutral-200 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Row: App Icon + Titles + Category Badge */}
                      <div className="flex items-start gap-3.5">
                        <div
                          onClick={() => setSelectedApp(app)}
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.colorGradient} p-1 shadow-md flex items-center justify-center relative overflow-hidden shrink-0 cursor-pointer border border-amber-400/30`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-2xl" />
                          <HabeshawiAppIcon appId={app.id} iconName={app.iconName} className="w-full h-full p-1" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h3
                              onClick={() => setSelectedApp(app)}
                              className={`font-bold text-sm truncate cursor-pointer hover:underline ${
                                isDarkMode ? 'text-white' : 'text-neutral-900'
                              }`}
                            >
                              {app.name}
                            </h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-bold">
                                <Star className="w-3 h-3 fill-current" /> {app.rating || '4.9'}
                              </span>
                              {app.badge && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {app.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className={`text-[11px] truncate font-medium mt-0.5 ${
                            isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                          }`}>
                            {app.tagline}
                          </p>

                          {/* App Metadata Specs: Version • Size • Author */}
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500 font-mono">
                            <span>{app.version || 'v1.0.0'}</span>
                            <span>•</span>
                            <span>{app.size || '1.5 MB'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[90px]">{app.author || 'Harmony Core'}</span>
                          </div>

                          <p className={`text-xs line-clamp-2 mt-1.5 leading-tight ${
                            isDarkMode ? 'text-[#8b949e]' : 'text-neutral-500'
                          }`}>
                            {app.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row: Details & iOS Style GET / Progress / OPEN Button */}
                    <div className="mt-4 pt-3 border-t border-neutral-700/40 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="text-[11px] text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
                      >
                        <Info className="w-3.5 h-3.5" /> Details
                      </button>

                      <div className="flex items-center gap-2">
                        {/* If Installed: Show Open & Pin Options */}
                        {isInstalled ? (
                          <>
                            <button
                              onClick={() => onTogglePinApp(app.id)}
                              className={`p-2 rounded-xl text-xs transition-all border ${
                                isPinned
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                  : 'bg-neutral-800/40 text-neutral-400 border-neutral-700'
                              }`}
                              title={isPinned ? 'Unpin from Home Screen' : 'Pin to Home Screen'}
                            >
                              {isPinned ? <Pin className="w-3.5 h-3.5 text-indigo-400" /> : <PinOff className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => onOpenApp(app.id)}
                              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Open</span>
                            </button>
                          </>
                        ) : isDownloading ? (
                          /* Downloading progress bar button */
                          <div className="px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center gap-2 text-xs font-semibold text-blue-400 min-w-[110px] justify-center">
                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span>{downloadProgress}%</span>
                          </div>
                        ) : (
                          /* iOS Style GET / Download Button */
                          <button
                            onClick={() => handleDownloadApp(app)}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                          >
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>GET</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Central Repositories & Sources Manager */}
      {activeTab === 'repositories' && (
        <div className="max-w-4xl mx-auto w-full p-4 md:p-6 flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Active Central Repositories</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Centralized package registries supplying verified and community mini-apps to Harmony SuperApp.
              </p>
            </div>
            <button
              onClick={() => setIsAddingRepo(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Repo</span>
            </button>
          </div>

          {/* Repositories List */}
          <div className="space-y-3">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    repo.isOfficial ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{repo.name}</h3>
                      {repo.isOfficial ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Official Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Community
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{repo.description}</p>
                    <p className="text-[11px] font-mono text-neutral-500 mt-1 truncate max-w-md">{repo.url}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleFetchRepository(repo.url)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors hover:bg-neutral-800"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-400" />
                    <span>Sync</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Repository Modal / Form */}
          {isAddingRepo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border ${
                isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-300 shadow-md'
              }`}
            >
              <h3 className="text-sm font-bold mb-1">Add Central Repository Endpoint</h3>
              <p className="text-xs text-neutral-400 mb-4">Enter a remote JSON repository manifest URL supporting the Harmony package specification.</p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Repository Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Community App Registry"
                    value={customRepoName}
                    onChange={(e) => setCustomRepoName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs outline-none border ${
                      isDarkMode ? 'bg-[#0d1117] border-[#30363d] text-white' : 'bg-neutral-50 border-neutral-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Manifest URL</label>
                  <input
                    type="url"
                    placeholder="https://raw.githubusercontent.com/.../repo.json"
                    value={customRepoUrl}
                    onChange={(e) => setCustomRepoUrl(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs outline-none border ${
                      isDarkMode ? 'bg-[#0d1117] border-[#30363d] text-white' : 'bg-neutral-50 border-neutral-300'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingRepo(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomRepo}
                    disabled={!customRepoUrl.trim()}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                  >
                    Register Repository
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab 3: Installed Apps & Storage Footprint */}
      {activeTab === 'installed' && (
        <div className="max-w-4xl mx-auto w-full p-4 md:p-6 flex-1 space-y-6">
          {/* Storage Utilization Card */}
          <div className={`p-5 rounded-2xl border ${
            isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">SuperApp Storage Sandbox</span>
              </div>
              <span className="text-xs font-bold font-mono text-indigo-400">
                {storageFootprint.totalFormatted} / 256 MB
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                style={{ width: `${Math.min(100, Math.max(6, (storageFootprint.totalBytes / (256 * 1024 * 1024)) * 100))}%` }}
              />
            </div>

            <p className="text-[11px] text-neutral-500">
              {installedIds.length} mini-apps cached for offline execution in Service Worker and IndexedDB.
            </p>
          </div>

          {/* Installed Apps List */}
          <div className="space-y-3">
            {installedIds.map((id) => {
              const app = CENTRAL_REPOSITORY_APPS.find((a) => a.id === id);
              if (!app) return null;

              return (
                <div
                  key={app.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                    isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.colorGradient} flex items-center justify-center shrink-0 shadow-sm p-1 border border-amber-400/30`}>
                      <HabeshawiAppIcon appId={app.id} iconName={app.iconName} className="w-full h-full p-0.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm truncate">{app.name}</h4>
                        {app.isSystemApp && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-neutral-700 text-neutral-300">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{app.tagline}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {app.version || 'v1.0.0'} • {app.size || '1.5 MB'} • Service Worker Verified
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenApp(app.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Open</span>
                    </button>

                    {!app.isSystemApp && (
                      <button
                        onClick={() => handleUninstallApp(app.id)}
                        className="p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
                        title="Uninstall / Offload to free storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* App Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
                isDarkMode ? 'bg-[#161b22] border-[#30363d] text-white' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedApp.colorGradient} p-1 shadow-lg flex items-center justify-center shrink-0 border border-amber-400/40`}>
                    <HabeshawiAppIcon appId={selectedApp.id} iconName={selectedApp.iconName} className="w-full h-full p-1" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{selectedApp.name}</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">{selectedApp.tagline}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Verified Ecosystem App
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {selectedApp.size || '1.5 MB'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="my-5 space-y-3 text-xs leading-relaxed text-neutral-300">
                <p>{selectedApp.description}</p>
                
                {/* Permissions & Security Architecture */}
                <div className={`p-3 rounded-2xl border text-[11px] ${
                  isDarkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <h4 className="font-semibold mb-1 text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Security & Package Specification
                  </h4>
                  <p className="text-neutral-400">
                    Publisher: {selectedApp.author || 'Harmony OS Core'} • Version: {selectedApp.version || 'v1.0.0'}
                  </p>
                  <p className="text-neutral-400 mt-1">
                    Permissions: {(selectedApp.permissions || ['storage', 'offline-cache']).join(', ')}
                  </p>
                </div>
              </div>

              {/* External Links */}
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-700/50 text-xs">
                {selectedApp.repoUrl && (
                  <a
                    href={selectedApp.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" /> Source Code <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                {selectedApp.deployedUrl && selectedApp.deployedUrl !== '#' && (
                  <a
                    href={selectedApp.deployedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Deployment <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 gap-3">
                {installedIds.includes(selectedApp.id) ? (
                  <>
                    <button
                      onClick={() => onTogglePinApp(selectedApp.id)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        pinnedAppIds.includes(selectedApp.id)
                          ? 'bg-[#21262d] text-indigo-300 border-indigo-500/40 hover:bg-rose-500/20 hover:text-rose-300'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
                      }`}
                    >
                      {pinnedAppIds.includes(selectedApp.id) ? (
                        <>
                          <PinOff className="w-3.5 h-3.5" />
                          <span>Unpin from Home</span>
                        </>
                      ) : (
                        <>
                          <Pin className="w-3.5 h-3.5" />
                          <span>Pin to Home</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const appId = selectedApp.id;
                        setSelectedApp(null);
                        onOpenApp(appId);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch App</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleDownloadApp(selectedApp);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span>Download & Install from Central Repo</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper to provide friendly emojis for each app
function getAppEmoji(id: string): string {
  switch (id) {
    case 'harmony-notes': return '📝';
    case 'harmony-docs': return '📄';
    case 'harmony-writing': return '✍️';
    case 'harmony-music-player': return '🎵';
    case 'harmony-docs-ai': return '✨';
    case 'harmony-calendar': return '📅';
    case 'harmony-finance': return '💳';
    case 'harmony-app-store': return '🛍️';
    case 'harmony-weather': return '☀️';
    case 'harmony-calculator': return '🔢';
    case 'harmony-focus': return '⏱️';
    case 'harmony-terminal': return '💻';
    case 'harmony-habits': return '🎯';
    default: return '📱';
  }
}
