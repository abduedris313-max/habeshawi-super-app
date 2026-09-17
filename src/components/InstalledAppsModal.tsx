/**
 * @file InstalledAppsModal.tsx
 * @description Dedicated Installed Applications sheet & app list.
 * Accessible via the Super App Dock or swiping up on the Home Screen.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Layers, 
  Pin, 
  Check, 
  ExternalLink, 
  ShoppingBag, 
  Grid, 
  List, 
  Sparkles,
  Notebook,
  FileText,
  PenTool,
  Disc,
  Calendar,
  Wallet,
  CloudSun,
  Calculator,
  Clock,
  Terminal,
  Activity,
  ChevronRight,
  Sliders,
  Info
} from 'lucide-react';
import { HARMONY_APPS } from '../config/apps';
import { MiniAppConfig } from '../types';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';
import { HabeshawiAppIcon } from './HabeshawiIcons';

interface InstalledAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  installedAppIds?: string[];
  pinnedAppIds?: string[];
  onTogglePinApp?: (appId: string) => void;
  isDarkMode?: boolean;
}

export const InstalledAppsModal: React.FC<InstalledAppsModalProps> = ({
  isOpen,
  onClose,
  onOpenApp,
  installedAppIds,
  pinnedAppIds = [],
  onTogglePinApp,
  isDarkMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter to installed apps based on installedAppIds list
  const installedApps = useMemo(() => {
    if (!installedAppIds || installedAppIds.length === 0) {
      return HARMONY_APPS;
    }
    return HARMONY_APPS.filter(app => installedAppIds.includes(app.id));
  }, [installedAppIds]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    installedApps.forEach(app => {
      if (app.category) set.add(app.category);
    });
    return ['all', ...Array.from(set)];
  }, [installedApps]);

  // Filtered apps by search and category
  const filteredApps = useMemo(() => {
    return installedApps.filter(app => {
      const matchesSearch = 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.tagline && app.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [installedApps, searchQuery, selectedCategory]);

  const getIcon = (iconName: string, appId?: string) => {
    return <HabeshawiAppIcon appId={appId} iconName={iconName} className="w-full h-full p-1 drop-shadow-md" />;
  };

  const handleLaunch = (appId: string) => {
    soundManager.playClickSound();
    triggerHaptic('light');
    onOpenApp(appId);
    onClose();
  };

  const handleTogglePin = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    soundManager.playClickSound();
    triggerHaptic('selection');
    onTogglePinApp?.(appId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="installed-apps-overlay" 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md transition-all"
        onClick={onClose}
      >
        <motion.div
          id="installed-apps-sheet"
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl max-h-[88vh] sm:max-h-[85vh] rounded-t-[28px] sm:rounded-[28px] border shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ${
            isDarkMode 
              ? 'bg-[#161b22]/95 border-[#30363d] text-[#c9d1d9]' 
              : 'bg-white/95 border-neutral-200 text-neutral-900'
          }`}
        >
          {/* iOS Sheet Pull Handle */}
          <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden">
            <div className="w-10 h-1.5 rounded-full bg-neutral-400/40" />
          </div>

          {/* Header Bar */}
          <div className="px-5 py-3.5 border-b border-neutral-700/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Grid className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight truncate flex items-center gap-2">
                  <span>Installed Applications</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                    isDarkMode ? 'bg-[#21262d] text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {installedApps.length}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400 truncate">
                  Launch, pin to Springboard, or browse all installed system packages
                </p>
              </div>
            </div>

            {/* View Mode Toggle & Close Button */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center p-0.5 rounded-lg border ${
                isDarkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-100 border-neutral-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'list' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-600'
                }`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Category Filter Toolbar */}
          <div className="px-5 pt-3 pb-2 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search installed apps by title, keyword, or features..."
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border transition-all outline-hidden ${
                  isDarkMode 
                    ? 'bg-[#0d1117] border-[#30363d] text-white placeholder-neutral-500 focus:border-indigo-500' 
                    : 'bg-neutral-100 border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-indigo-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDarkMode
                          ? 'bg-[#21262d] text-neutral-400 hover:text-white border border-[#30363d]'
                          : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Applications' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* App List Container */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {filteredApps.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800/40 flex items-center justify-center text-neutral-400 mb-3 border border-neutral-700/50">
                  <Search className="w-6 h-6 opacity-60" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-300">No applications found</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  No installed application matches "{searchQuery}". Browse the App Store to download additional packages.
                </p>
                <button
                  type="button"
                  onClick={() => handleLaunch('harmony-app-store')}
                  className="mt-4 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Open Habeshawi App Store</span>
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredApps.map((app) => {
                  const isPinned = pinnedAppIds.includes(app.id);
                  return (
                    <motion.div
                      key={app.id}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLaunch(app.id)}
                      className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all group relative ${
                        isDarkMode
                          ? 'bg-[#0d1117] hover:bg-[#161b22] border-[#30363d] hover:border-indigo-500/50 shadow-md'
                          : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-indigo-400 shadow-sm'
                      }`}
                    >
                      {/* Top Row: Icon + Pin Button */}
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${app.colorGradient} flex items-center justify-center shadow-md p-1 relative overflow-hidden shrink-0 border border-amber-400/30`}>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-[14px]" />
                          {getIcon(app.iconName, app.id)}
                        </div>

                        {onTogglePinApp && (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(e, app.id)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isPinned
                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                : 'text-neutral-400 hover:text-white border-transparent hover:border-neutral-700'
                            }`}
                            title={isPinned ? 'Pinned to Home Screen' : 'Pin to Home Screen'}
                          >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-indigo-400' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div className="mt-3">
                        <h4 className="text-xs font-bold truncate group-hover:text-indigo-400 transition-colors">
                          {app.name}
                        </h4>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                          {app.tagline || app.description}
                        </p>
                      </div>

                      {/* Footer: Version & Open */}
                      <div className="mt-3 pt-2 border-t border-neutral-700/20 flex items-center justify-between text-[9px] text-neutral-500">
                        <span className="font-mono">{app.version || 'v1.0'}</span>
                        <span className="text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
                          Open <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-2">
                {filteredApps.map((app) => {
                  const isPinned = pinnedAppIds.includes(app.id);
                  return (
                    <motion.div
                      key={app.id}
                      whileHover={{ x: 2 }}
                      onClick={() => handleLaunch(app.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isDarkMode
                          ? 'bg-[#0d1117] hover:bg-[#161b22] border-[#30363d] hover:border-indigo-500/50'
                          : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-indigo-400 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${app.colorGradient} flex items-center justify-center text-white shadow-md shrink-0 p-0.5 border border-amber-400/30`}>
                          {getIcon(app.iconName, app.id)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold truncate">{app.name}</h4>
                            {app.badge && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-neutral-700 text-neutral-300">
                                {app.badge}
                              </span>
                            )}
                            <span className="text-[9px] text-neutral-500 font-mono hidden sm:inline">
                              {app.size}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {app.tagline || app.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onTogglePinApp && (
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(e, app.id)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                              isPinned
                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                                : isDarkMode
                                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                                  : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                            }`}
                          >
                            <Pin className={`w-3 h-3 ${isPinned ? 'fill-indigo-400' : ''}`} />
                            <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleLaunch(app.id)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          Launch
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3 border-t border-neutral-700/20 flex items-center justify-between bg-neutral-900/30 text-xs">
            <span className="text-neutral-400 text-[11px]">
              Tip: Swipe down from the top to view Notifications
            </span>
            <button
              type="button"
              onClick={() => handleLaunch('harmony-app-store')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Get More Apps</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
