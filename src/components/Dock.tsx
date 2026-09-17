/**
 * @file Dock.tsx
 * @description iOS 18 style floating Dock at bottom of home screen.
 * Highly configurable & editable dock with responsive app counts (5 for small screen, 7 for large screen by default).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HARMONY_APPS } from '../config/apps';
import { DEFAULT_DOCK_APP_IDS } from '../lib/offlinePersistence';
import { SystemSettings } from '../types';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';
import { HabeshawiAppIcon } from './HabeshawiIcons';
import { 
  Notebook, 
  FileText, 
  PenTool, 
  Disc, 
  Sparkles, 
  Layers, 
  Calendar, 
  Wallet, 
  ShoppingBag, 
  Sliders, 
  Check, 
  X, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  LayoutGrid, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface DockProps {
  onOpenApp: (appId: string) => void;
  onOpenAppSwitcher: () => void;
  onOpenInstalledApps?: () => void;
  activeAppId: string | null;
  isDarkMode?: boolean;
  dockAppIds?: string[];
  dockMaxSmallScreen?: number;
  dockMaxLargeScreen?: number;
  onOpenSettings?: () => void;
  onUpdateSettings?: (updated: Partial<SystemSettings>) => void;
}

export const DockComponent: React.FC<DockProps> = ({ 
  onOpenApp, 
  onOpenAppSwitcher, 
  onOpenInstalledApps,
  activeAppId, 
  isDarkMode = true,
  dockAppIds = DEFAULT_DOCK_APP_IDS,
  dockMaxSmallScreen = 5,
  dockMaxLargeScreen = 7,
  onOpenSettings,
  onUpdateSettings
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return true;
  });

  // Long press timer ref for jiggle mode
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDockIcon = (iconName: string, appId?: string) => {
    return <HabeshawiAppIcon appId={appId} iconName={iconName} className="w-5 h-5 text-white drop-shadow-sm" />;
  };

  // Resolve active configured apps from catalog using useMemo
  const currentAppIds = useMemo(() => {
    return dockAppIds && dockAppIds.length > 0 ? dockAppIds : DEFAULT_DOCK_APP_IDS;
  }, [dockAppIds]);

  const configuredApps = useMemo(() => {
    return currentAppIds
      .map((id) => HARMONY_APPS.find((app) => app.id === id))
      .filter((app): app is typeof HARMONY_APPS[number] => Boolean(app));
  }, [currentAppIds]);

  // Determine maximum apps to display based on responsive breakpoint
  const maxVisibleCount = isLargeScreen ? (dockMaxLargeScreen || 7) : (dockMaxSmallScreen || 5);
  
  // When in edit mode, show all configured apps so the user can see and organize their full dock list
  const visibleApps = useMemo(() => {
    return isEditMode ? configuredApps : configuredApps.slice(0, maxVisibleCount);
  }, [isEditMode, configuredApps, maxVisibleCount]);

  // Available apps not currently on the dock
  const unDockedApps = useMemo(() => {
    return HARMONY_APPS.filter((app) => !currentAppIds.includes(app.id));
  }, [currentAppIds]);

  // Reorder app on dock
  const handleMoveApp = (index: number, direction: 'left' | 'right') => {
    soundManager.playClickSound();
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentAppIds.length) return;

    const nextIds = [...currentAppIds];
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(newIndex, 0, moved);

    onUpdateSettings?.({ dockAppIds: nextIds });
  };

  // Remove app from dock
  const handleRemoveApp = (appId: string) => {
    soundManager.playClickSound();
    if (currentAppIds.length <= 1) return;
    const nextIds = currentAppIds.filter((id) => id !== appId);
    onUpdateSettings?.({ dockAppIds: nextIds });
  };

  // Add app to dock
  const handleAddApp = (appId: string) => {
    soundManager.playClickSound();
    if (currentAppIds.includes(appId)) return;
    const nextIds = [...currentAppIds, appId];
    onUpdateSettings?.({ dockAppIds: nextIds });
    setShowAddPicker(false);
  };

  // Handle long press to trigger iOS jiggle edit mode
  const handleTouchStart = () => {
    pressTimerRef.current = setTimeout(() => {
      soundManager.playClickSound();
      triggerHaptic('heavy');
      setIsEditMode(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  return (
    <div id="dock-container" className="w-full flex flex-col items-center pb-2 px-2 pointer-events-auto z-30 select-none">
      {/* Edit Mode Control Header Bar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`mb-2 px-3 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-2.5 text-xs shadow-lg ${
              isDarkMode
                ? 'bg-[#161b22]/90 border-[#30363d] text-white'
                : 'bg-white/90 border-neutral-200 text-neutral-800 shadow-sm'
            }`}
          >
            <span className="font-semibold text-[11px] text-indigo-400 flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              <span>Editing Dock</span>
            </span>

            <span className="text-[10px] text-neutral-400 font-mono">
              {isLargeScreen ? `Desktop: Max ${dockMaxLargeScreen || 7}` : `Mobile: Max ${dockMaxSmallScreen || 5}`}
            </span>

            <div className="flex items-center gap-1.5 ml-1">
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMode(false);
                    onOpenSettings();
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 flex items-center gap-1 transition-colors"
                  title="Configure in System Settings"
                >
                  <SettingsIcon className="w-2.5 h-2.5" />
                  <span>Settings</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setIsEditMode(false);
                  setShowAddPicker(false);
                }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Done</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dock Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`px-3 py-1.5 rounded-[24px] backdrop-blur-2xl border transition-all flex items-center gap-1.5 sm:gap-2.5 ${
          isDarkMode
            ? 'bg-[#161b22]/90 border-[#30363d] shadow-2xl shadow-black/60'
            : 'bg-white/75 border-white/80 shadow-xl shadow-neutral-300/30'
        } ${isEditMode ? 'ring-2 ring-indigo-500/40' : ''}`}
      >
        {visibleApps.map((app, index) => {
          const isActive = activeAppId === app.id;
          return (
            <div key={app.id} className="relative flex flex-col items-center">
              <motion.button
                id={`dock-icon-${app.id}`}
                whileHover={!isEditMode ? { y: -4, scale: 1.12 } : { scale: 1.05 }}
                whileTap={{ scale: 0.88 }}
                animate={isEditMode ? { rotate: [-1.2, 1.2, -1.2] } : { rotate: 0 }}
                transition={isEditMode ? { repeat: Infinity, duration: 0.22, ease: 'easeInOut' } : {}}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                  if (isEditMode) return;
                  onOpenApp(app.id);
                }}
                className="relative group flex flex-col items-center"
                title={app.name}
              >
                <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${app.colorGradient} flex items-center justify-center shadow-md p-1 relative overflow-hidden transition-all group-hover:shadow-amber-500/30 border border-amber-400/30 ${
                  isActive ? (isDarkMode ? 'ring-2 ring-amber-400 scale-105' : 'ring-2 ring-amber-600 scale-105') : ''
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-[12px]" />
                  {getDockIcon(app.iconName, app.id)}
                </div>
                
                {/* iOS Active App Indicator Dot */}
                {!isEditMode && isActive && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 shadow-glow ${isDarkMode ? 'bg-white' : 'bg-neutral-800'}`} />
                )}
              </motion.button>

              {/* Jiggle Edit Mode Controls: Remove & Reorder */}
              {isEditMode && (
                <div className="absolute -top-2 -right-1 z-20 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveApp(app.id);
                    }}
                    className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-rose-500 transition-colors"
                    title={`Remove ${app.name} from Dock`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {/* Reorder Left/Right buttons in edit mode */}
              {isEditMode && (
                <div className="flex items-center gap-1 mt-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveApp(index, 'left');
                    }}
                    className={`w-3.5 h-3.5 rounded bg-neutral-700/80 text-white flex items-center justify-center text-[9px] ${
                      index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-indigo-600'
                    }`}
                    title="Move Left"
                  >
                    <ArrowLeft className="w-2 h-2" />
                  </button>
                  <button
                    type="button"
                    disabled={index === currentAppIds.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveApp(index, 'right');
                    }}
                    className={`w-3.5 h-3.5 rounded bg-neutral-700/80 text-white flex items-center justify-center text-[9px] ${
                      index === currentAppIds.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-indigo-600'
                    }`}
                    title="Move Right"
                  >
                    <ArrowRight className="w-2 h-2" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add App Button in Edit Mode */}
        {isEditMode && unDockedApps.length > 0 && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddPicker(!showAddPicker)}
              className="w-10 h-10 rounded-[12px] border-2 border-dashed border-indigo-400/50 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              title="Add app to dock"
            >
              <Plus className="w-5 h-5" />
            </motion.button>

            {/* Quick App Picker Dropdown */}
            <AnimatePresence>
              {showAddPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-xl border backdrop-blur-2xl shadow-xl w-48 z-40 ${
                    isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-neutral-200'
                  }`}
                >
                  <div className="text-[10px] font-bold text-neutral-400 mb-1.5 uppercase px-1">
                    Add to Dock
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {unDockedApps.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleAddApp(app.id)}
                        className={`w-full p-1.5 rounded-lg flex items-center gap-2 text-left transition-colors ${
                          isDarkMode ? 'hover:bg-[#21262d] text-white' : 'hover:bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${app.colorGradient} flex items-center justify-center text-white shrink-0 p-0.5`}>
                          {getDockIcon(app.iconName, app.id)}
                        </div>
                        <span className="text-xs font-semibold truncate flex-1">{app.name}</span>
                        <Plus className="w-3 h-3 text-indigo-400" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Separator line */}
        <div className={`w-px h-6 mx-0.5 ${isDarkMode ? 'bg-white/20' : 'bg-neutral-300'}`} />

        {/* Edit Dock Toggle Button */}
        <motion.button
          id="btn-dock-edit-toggle"
          whileHover={{ y: -4, scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            soundManager.playClickSound();
            setIsEditMode(!isEditMode);
            if (isEditMode) setShowAddPicker(false);
          }}
          className={`w-10 h-10 rounded-[12px] border flex items-center justify-center shadow-md transition-colors ${
            isEditMode
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : isDarkMode
                ? 'bg-neutral-800/90 border-neutral-700/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                : 'bg-white/90 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
          }`}
          title={isEditMode ? 'Done Editing' : 'Configure & Edit Dock'}
        >
          {isEditMode ? <Check className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
        </motion.button>

        {/* All Installed Applications Launcher */}
        {onOpenInstalledApps && (
          <motion.button
            id="btn-dock-installed-apps"
            whileHover={{ y: -4, scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              soundManager.playClickSound();
              triggerHaptic('light');
              onOpenInstalledApps();
            }}
            className={`w-10 h-10 rounded-[12px] border flex items-center justify-center shadow-md transition-colors ${
              isDarkMode
                ? 'bg-gradient-to-br from-indigo-600/90 to-purple-700/90 border-indigo-400/40 text-white hover:from-indigo-500 hover:to-purple-600 shadow-indigo-500/20'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-300 text-white hover:opacity-90 shadow-indigo-300/30'
            }`}
            title="All Installed Applications (Swipe Up on Home)"
          >
            <LayoutGrid className="w-5 h-5 text-white drop-shadow-xs" />
          </motion.button>
        )}

        {/* App Switcher Launcher */}
        <motion.button
          id="btn-dock-switcher"
          whileHover={{ y: -4, scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={onOpenAppSwitcher}
          className={`w-10 h-10 rounded-[12px] border flex items-center justify-center shadow-md transition-colors ${
            isDarkMode
              ? 'bg-neutral-800/90 border-neutral-700/80 text-white hover:bg-neutral-700'
              : 'bg-white/90 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
          }`}
          title="App Switcher"
        >
          <Layers className="w-5 h-5 text-purple-400" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export const Dock = React.memo(DockComponent);
