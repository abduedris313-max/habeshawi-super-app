/**
 * @file DraggablePinnedApp.tsx
 * @description Draggable & Droppable Pinned Application icon component using React DnD.
 * Allows users to intuitively reorder Home Screen springboard applications via drag-and-drop,
 * and provides an iOS-style long-press context menu with quick actions (App Info, Remove from Home, Share).
 */

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDrag, useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Minus, 
  Info, 
  Share2, 
  Trash2, 
  ExternalLink, 
  X, 
  Check, 
  Layers, 
  ShieldCheck, 
  HardDrive, 
  Sparkles,
  Zap,
  Bell,
  BellOff,
  RefreshCw,
  Volume2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { MiniAppConfig, LauncherIconStyle } from '../types';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';
import { 
  getAppNotificationEnabled, 
  setAppNotificationEnabled, 
  getAppCacheInfo, 
  clearAppCache, 
  factoryResetApp,
  triggerAppTestAlert, 
  AppCacheInfo 
} from '../lib/appQuickActions';

export const DND_ITEM_TYPE_PINNED_APP = 'PINNED_APP';

export interface DragPinnedAppItem {
  id: string;
  index: number;
}

interface DraggablePinnedAppProps {
  app: MiniAppConfig;
  index: number;
  isEditMode: boolean;
  onOpenApp: (appId: string) => void;
  onTogglePinApp?: (appId: string) => void;
  moveApp: (dragIndex: number, hoverIndex: number) => void;
  onCommitReorder: () => void;
  iconStyle: LauncherIconStyle;
  isDarkMode: boolean;
  showLabels: boolean;
  getAppIconContainerStyle: (app: MiniAppConfig, index: number) => string;
  getIconComponent: (iconName: string, appId?: string) => React.ReactNode;
}

interface MenuPosition {
  x: number;
  y: number;
  placement: 'below' | 'above';
}

export const DraggablePinnedApp: React.FC<DraggablePinnedAppProps> = ({
  app,
  index,
  isEditMode,
  onOpenApp,
  onTogglePinApp,
  moveApp,
  onCommitReorder,
  iconStyle: _iconStyle,
  isDarkMode,
  showLabels,
  getAppIconContainerStyle,
  getIconComponent,
}) => {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const dragStartTimeRef = useRef<number>(0);

  // Long-press & context menu state
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [showAppInfo, setShowAppInfo] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0, placement: 'below' });
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Quick Actions & App Info modal states
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => getAppNotificationEnabled(app.id));
  const [cacheInfo, setCacheInfo] = useState<AppCacheInfo | null>(null);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState<boolean>(false);
  const [testAlertSent, setTestAlertSent] = useState<boolean>(false);

  // Factory reset states
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Sync Quick Action preferences and live cache details whenever modal opens or changes
  useEffect(() => {
    if (showAppInfo) {
      setNotificationsEnabled(getAppNotificationEnabled(app.id));
      setCacheInfo(getAppCacheInfo(app.id));
      setCacheClearedSuccess(false);
      setTestAlertSent(false);
      setShowResetConfirm(false);
      setResetSuccess(false);
      setIsResetting(false);
    }
  }, [showAppInfo, app.id]);

  // Synchronize with external preference changes, cache clears, or factory reset
  useEffect(() => {
    const handleNotifUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.appId === app.id) {
        setNotificationsEnabled(detail.enabled);
      }
    };
    const handleCacheCleared = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.appId === app.id) {
        setCacheInfo(getAppCacheInfo(app.id));
      }
    };
    const handleFactoryResetEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.appId === app.id) {
        setCacheInfo(getAppCacheInfo(app.id));
        setNotificationsEnabled(true);
      }
    };
    window.addEventListener('habeshawi_app_notifications_updated', handleNotifUpdate);
    window.addEventListener('habeshawi_app_cache_cleared', handleCacheCleared);
    window.addEventListener('habeshawi_app_factory_reset', handleFactoryResetEvent);
    return () => {
      window.removeEventListener('habeshawi_app_notifications_updated', handleNotifUpdate);
      window.removeEventListener('habeshawi_app_cache_cleared', handleCacheCleared);
      window.removeEventListener('habeshawi_app_factory_reset', handleFactoryResetEvent);
    };
  }, [app.id]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressedRef = useRef<boolean>(false);

  // Helper to calculate context menu coordinates anchored to the app icon
  const calculateMenuPosition = () => {
    if (!itemRef.current || typeof window === 'undefined') return;
    const rect = itemRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 232;
    const estimatedMenuHeight = 220;

    // Center horizontally on the icon, clamped within screen padding
    let x = rect.left + rect.width / 2 - menuWidth / 2;
    x = Math.max(12, Math.min(viewportWidth - menuWidth - 12, x));

    // Determine vertical placement (below or above)
    const spaceBelow = viewportHeight - rect.bottom;
    const placement: 'below' | 'above' = spaceBelow >= estimatedMenuHeight + 16 ? 'below' : 'above';
    const y = placement === 'below' 
      ? rect.bottom + 8 
      : Math.max(12, rect.top - estimatedMenuHeight - 8);

    setMenuPosition({ x, y, placement });
  };

  // React DnD Drag hook
  const [{ isDragging }, dragRef] = useDrag({
    type: DND_ITEM_TYPE_PINNED_APP,
    item: () => {
      // Clear any pending long-press timers when drag begins
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setShowContextMenu(false);

      dragStartTimeRef.current = Date.now();
      triggerHaptic('medium');
      soundManager.playClickSound();
      return { id: app.id, index } as DragPinnedAppItem;
    },
    end: (_item, monitor) => {
      onCommitReorder();
      if (monitor.didDrop()) {
        triggerHaptic('light');
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // React DnD Drop hook
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: DND_ITEM_TYPE_PINNED_APP,
    hover: (draggedItem: DragPinnedAppItem) => {
      if (!itemRef.current) return;
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Perform the repositioning in local springboard state
      moveApp(dragIndex, hoverIndex);

      // Mutate the draggedItem index for smooth continuous dragging
      draggedItem.index = hoverIndex;
    },
    drop: () => {
      onCommitReorder();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Attach both drag and drop connectors to the item container
  dragRef(dropRef(itemRef));

  // Global listeners for closing context menu on escape, scroll, or resize
  useEffect(() => {
    if (!showContextMenu && !showAppInfo) return;

    const handleClose = () => {
      setShowContextMenu(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowContextMenu(false);
        setShowAppInfo(false);
      }
    };

    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showContextMenu, showAppInfo]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Pointer event handlers for iOS-style long-press detection
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditMode) return;
    // Only primary button (left mouse) or touch pointers
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isLongPressedRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      if (isDragging) return;

      isLongPressedRef.current = true;
      triggerHaptic('heavy');
      soundManager.playClickSound();
      calculateMenuPosition();
      setShowContextMenu(true);
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartPosRef.current || !longPressTimerRef.current) return;
    const dx = e.clientX - pointerStartPosRef.current.x;
    const dy = e.clientY - pointerStartPosRef.current.y;
    // If movement exceeds 10px, it's a drag or scroll gesture -> cancel long-press
    if (Math.hypot(dx, dy) > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartPosRef.current = null;
  };

  // Right-click context menu handler for desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    if (isEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    isLongPressedRef.current = true;
    triggerHaptic('medium');
    soundManager.playClickSound();
    calculateMenuPosition();
    setShowContextMenu(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    // If long-press just occurred or context menu is active, prevent opening the app
    if (isLongPressedRef.current || showContextMenu) {
      isLongPressedRef.current = false;
      e.stopPropagation();
      return;
    }

    // If we just dragged, prevent triggering click to open app
    const dragDuration = Date.now() - dragStartTimeRef.current;
    if (dragStartTimeRef.current > 0 && dragDuration > 250) {
      dragStartTimeRef.current = 0;
      e.stopPropagation();
      return;
    }

    if (!isEditMode) {
      onOpenApp(app.id);
    }
  };

  // Quick Action: App Info
  const handleOpenAppInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    soundManager.playClickSound();
    setShowContextMenu(false);
    setShowAppInfo(true);
  };

  // Quick Action: Share App
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    soundManager.playClickSound();

    const shareData = {
      title: `${app.name} • Harmony OS`,
      text: `${app.name}: ${app.tagline || app.description}`,
      url: window.location.href,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShowContextMenu(false);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${app.name} (${window.location.href})\n${app.tagline || app.description}`);
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
          setShowContextMenu(false);
        }, 1200);
      } else {
        setShowContextMenu(false);
      }
    } catch (err) {
      console.debug('[DraggablePinnedApp] Share canceled or dismissed:', err);
    }
  };

  // Quick Action: Remove from Home Screen
  const handleRemoveFromHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    soundManager.playClickSound();
    setShowContextMenu(false);
    onTogglePinApp?.(app.id);
  };

  // Quick Action: Launch App directly
  const handleLaunchApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    soundManager.playClickSound();
    setShowContextMenu(false);
    onOpenApp(app.id);
  };

  // Quick Action: Toggle per-app notification settings
  const handleToggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClickSound();
    triggerHaptic('light');
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    setAppNotificationEnabled(app.id, next);
  };

  // Quick Action: Clear local app cache directly from modal
  const handleClearCache = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isClearingCache) return;
    setIsClearingCache(true);
    try {
      await clearAppCache(app.id);
      setCacheInfo(getAppCacheInfo(app.id));
      setCacheClearedSuccess(true);
      setTimeout(() => {
        setCacheClearedSuccess(false);
      }, 2500);
    } finally {
      setIsClearingCache(false);
    }
  };

  // Quick Action: Test incoming notification for this app
  const handleTestAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    soundManager.playClickSound();
    const sent = triggerAppTestAlert(app);
    if (sent) {
      setTestAlertSent(true);
      setTimeout(() => {
        setTestAlertSent(false);
      }, 2000);
    }
  };

  // Quick Action: Prompt user to confirm Factory Reset
  const handleInitiateFactoryReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('warning');
    soundManager.playClickSound();
    setShowResetConfirm(true);
  };

  // Quick Action: Cancel Factory Reset prompt
  const handleCancelFactoryReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    soundManager.playClickSound();
    setShowResetConfirm(false);
  };

  // Quick Action: Execute Factory Reset for this specific mini app
  const handleExecuteFactoryReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isResetting) return;
    setIsResetting(true);
    setShowResetConfirm(false);

    try {
      await factoryResetApp(app.id);
      setCacheInfo(getAppCacheInfo(app.id));
      setNotificationsEnabled(true);
      setResetSuccess(true);
      // Explicit Haptic feedback success trigger as required by user directive
      triggerHaptic('success');
      soundManager.playClickSound();
      setTimeout(() => {
        setResetSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('[DraggablePinnedApp] Factory Reset failed:', err);
      triggerHaptic('error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div
        ref={itemRef}
        id={`draggable-app-${app.id}`}
        data-testid={`draggable-app-${app.id}`}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={handleContextMenu}
        className={`relative flex flex-col items-center group select-none transition-all ${
          isDragging 
            ? 'opacity-30 scale-95 z-40' 
            : isOver && canDrop
              ? 'scale-105 z-30'
              : showContextMenu
                ? 'z-40'
                : 'opacity-100 z-10'
        }`}
        style={{ touchAction: 'none' }}
      >
        <motion.div
          whileHover={isEditMode ? {} : { scale: 1.06 }}
          whileTap={isEditMode ? {} : { scale: 0.92 }}
          className={`flex flex-col items-center cursor-grab active:cursor-grabbing relative ${
            isEditMode ? (index % 2 === 0 ? 'animate-jiggle' : 'animate-jiggle-alt') : ''
          }`}
        >
          {/* Jiggle / Edit Mode Minus (Unpin) Button */}
          {isEditMode && onTogglePinApp && (
            <button
              id={`btn-unpin-${app.id}`}
              type="button"
              aria-label={`Unpin ${app.name}`}
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClickSound();
                onTogglePinApp(app.id);
              }}
              className="absolute -top-1.5 -left-1.5 z-30 w-5 h-5 rounded-full bg-neutral-800 text-white border border-neutral-600 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            >
              <Minus className="w-3 h-3 stroke-[3]" />
            </button>
          )}

          {/* Squircle App Icon Container */}
          <div 
            id={`app-icon-${app.id}`}
            className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] p-1 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:shadow-lg ${
              showContextMenu
                ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-neutral-900 shadow-indigo-500/40 shadow-xl scale-105'
                : isOver && canDrop
                  ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-neutral-900 shadow-indigo-500/40 shadow-lg'
                  : ''
            } ${getAppIconContainerStyle(app, index)}`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none rounded-[16px]" />
            <div className="z-10 flex flex-col items-center justify-center w-full h-full">
              {getIconComponent(app.iconName, app.id)}
            </div>
            {app.badge && !isEditMode && (
              <span className="absolute top-0.5 right-0.5 px-1.5 py-0.2 rounded-full bg-red-500 text-[8px] font-bold text-white shadow-xs">
                {app.badge}
              </span>
            )}
          </div>

          {/* App Text Label */}
          {showLabels && (
            <span className={`mt-1.5 text-[10.5px] sm:text-[11.5px] text-center tracking-tight leading-tight line-clamp-2 max-w-[74px] sm:max-w-[82px] select-none ${
              isDarkMode
                ? 'text-white/95 font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]'
                : 'text-neutral-900 font-bold drop-shadow-xs'
            }`}>
              {app.name}
            </span>
          )}
        </motion.div>
      </div>

      {/* ================= PORTAL-MOUNTED CONTEXT MENU & APP INFO MODAL ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {/* Backdrop for Context Menu */}
          {showContextMenu && (
            <motion.div
              key={`backdrop-${app.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
              }}
              className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
            />
          )}

          {/* iOS-Style Long-Press Context Menu */}
          {showContextMenu && (
            <motion.div
              key={`context-menu-${app.id}`}
              id={`context-menu-${app.id}`}
              initial={{ 
                opacity: 0, 
                scale: 0.85, 
                y: menuPosition.placement === 'below' ? -8 : 8 
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              style={{
                position: 'fixed',
                left: `${menuPosition.x}px`,
                top: `${menuPosition.y}px`,
                width: '232px',
                zIndex: 101,
              }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-1.5 shadow-2xl border backdrop-blur-2xl select-none ${
                isDarkMode
                  ? 'bg-neutral-900/95 border-white/10 text-white shadow-black/80'
                  : 'bg-white/95 border-neutral-200/90 text-neutral-900 shadow-neutral-900/20'
              }`}
            >
              {/* Header: App Identity Preview */}
              <div className="flex items-center gap-2.5 px-2 py-1.5 border-b border-neutral-200/60 dark:border-neutral-800/80 mb-1">
                <div className={`w-8 h-8 rounded-[10px] p-0.5 shrink-0 flex items-center justify-center relative overflow-hidden shadow-xs ${getAppIconContainerStyle(app, index)}`}>
                  <div className="z-10 flex items-center justify-center w-full h-full scale-75">
                    {getIconComponent(app.iconName, app.id)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate leading-tight flex items-center gap-1.5">
                    <span className="truncate">{app.name}</span>
                    {app.badge && (
                      <span className="px-1 py-0.2 rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">
                        {app.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-tight capitalize">
                    {app.category || app.tagline || 'Application'}
                  </div>
                </div>
              </div>

              {/* Action List */}
              <div className="space-y-0.5">
                {/* Open App */}
                <button
                  id={`action-open-${app.id}`}
                  type="button"
                  onClick={handleLaunchApp}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:bg-neutral-200 dark:active:bg-neutral-700/80"
                >
                  <span className="font-semibold">Open App</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                </button>

                {/* App Info */}
                <button
                  id={`action-info-${app.id}`}
                  type="button"
                  onClick={handleOpenAppInfo}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:bg-neutral-200 dark:active:bg-neutral-700/80"
                >
                  <span>App Info</span>
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                </button>

                {/* Share App */}
                <button
                  id={`action-share-${app.id}`}
                  type="button"
                  onClick={handleShare}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:bg-neutral-200 dark:active:bg-neutral-700/80"
                >
                  <span>{isCopied ? 'Link Copied!' : 'Share'}</span>
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </button>

                {/* Remove from Home Screen */}
                {onTogglePinApp && (
                  <>
                    <div className="h-px bg-neutral-200/60 dark:bg-neutral-800/80 my-1" />
                    <button
                      id={`action-remove-home-${app.id}`}
                      type="button"
                      onClick={handleRemoveFromHome}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                    >
                      <span>Remove from Home</span>
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* App Info Modal Dialog */}
          {showAppInfo && (
            <motion.div
              key={`app-info-backdrop-${app.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowAppInfo(false)}
            >
              <motion.div
                key={`app-info-modal-${app.id}`}
                id={`app-info-dialog-${app.id}`}
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 8 }}
                transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-sm max-h-[90vh] flex flex-col rounded-3xl p-5 shadow-2xl border overflow-hidden relative ${
                  isDarkMode
                    ? 'bg-neutral-900 border-neutral-800 text-white'
                    : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              >
                {/* Header with Title & Close Button */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80 mb-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Application Details</span>
                  </div>
                  <button
                    id={`btn-close-info-${app.id}`}
                    type="button"
                    onClick={() => setShowAppInfo(false)}
                    className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Modal Content */}
                <div className="overflow-y-auto pr-1 -mr-1 space-y-3.5 flex-1 overscroll-contain">
                  {/* App Hero Display */}
                  <div className="flex flex-col items-center text-center pt-1">
                    <div className={`w-16 h-16 rounded-[20px] p-2 flex items-center justify-center relative overflow-hidden shadow-lg mb-2.5 ${getAppIconContainerStyle(app, index)}`}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none" />
                      <div className="z-10 flex items-center justify-center w-full h-full scale-110">
                        {getIconComponent(app.iconName, app.id)}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">{app.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[260px] line-clamp-2">
                      {app.tagline || app.description}
                    </p>
                  </div>

                  {/* Metadata Chips Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-2.5 border border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-neutral-400 uppercase font-medium tracking-wider">Category</div>
                        <div className="text-xs font-semibold capitalize truncate">{app.category || 'Productivity'}</div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-2.5 border border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-neutral-400 uppercase font-medium tracking-wider">Version</div>
                        <div className="text-xs font-semibold truncate">{app.version || 'v1.0.0'}</div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-2.5 border border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-neutral-400 uppercase font-medium tracking-wider">Size</div>
                        <div className="text-xs font-semibold truncate">{app.size || '380 KB'}</div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-2.5 border border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-neutral-400 uppercase font-medium tracking-wider">Storage</div>
                        <div className="text-xs font-semibold truncate">Offline Ready</div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACTIONS SECTION */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Quick Actions</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium">App Settings</span>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 divide-y divide-neutral-200/60 dark:divide-neutral-700/60 overflow-hidden shadow-xs">
                      {/* Notification Settings Toggle */}
                      <div className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            notificationsEnabled
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                              : 'bg-neutral-200/80 text-neutral-400 dark:bg-neutral-700/60 dark:text-neutral-500'
                          }`}>
                            {notificationsEnabled ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              <span>Notifications</span>
                              <span 
                                title={notificationsEnabled ? 'Alerts active' : 'Muted'}
                                className={`w-1.5 h-1.5 rounded-full ${notificationsEnabled ? 'bg-emerald-500' : 'bg-neutral-400'}`} 
                              />
                            </div>
                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                              {notificationsEnabled ? 'Alerts & banners enabled' : 'Muted for this app'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {notificationsEnabled && (
                            <button
                              type="button"
                              id={`btn-test-alert-${app.id}`}
                              onClick={handleTestAlert}
                              title="Send simulated test notification"
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 text-purple-600 dark:text-purple-400 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {testAlertSent ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-bold">Sent</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>Test</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* iOS Style Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={notificationsEnabled}
                            id={`toggle-notifications-${app.id}`}
                            onClick={handleToggleNotifications}
                            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer ${
                              notificationsEnabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                            }`}
                          >
                            <motion.div
                              layout
                              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                              className={`w-5 h-5 rounded-full bg-white shadow-md transform ${
                                notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Clear Local App Cache */}
                      <div className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            cacheClearedSuccess
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          }`}>
                            {cacheClearedSuccess ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <HardDrive className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              <span>Local App Cache</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-700/80 text-neutral-600 dark:text-neutral-300 font-medium">
                                {cacheInfo ? cacheInfo.formattedSize : '0 B'}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                              {cacheClearedSuccess 
                                ? 'Cache wiped & reset' 
                                : cacheInfo && cacheInfo.totalBytes > 0 
                                  ? `${cacheInfo.itemCount} items stored locally` 
                                  : 'Offline ready • 0 B cached'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          id={`btn-clear-cache-${app.id}`}
                          disabled={isClearingCache || (cacheInfo?.totalBytes === 0 && !cacheClearedSuccess)}
                          onClick={handleClearCache}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                            cacheClearedSuccess
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : cacheInfo && cacheInfo.totalBytes > 0
                                ? 'bg-neutral-200/90 hover:bg-neutral-300/90 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 shadow-xs'
                                : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 cursor-not-allowed border border-neutral-200/40 dark:border-neutral-700/40'
                          }`}
                        >
                          {isClearingCache ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Clearing...</span>
                            </>
                          ) : cacheClearedSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Cleared!</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                              <span>Clear Cache</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Factory Reset Mini App Action */}
                      <div className="p-3 flex flex-col gap-2 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              resetSuccess
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : showResetConfirm
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-red-500/15 text-red-500 dark:text-red-400'
                            }`}>
                              {resetSuccess ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : showResetConfirm ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold flex items-center gap-1.5">
                                <span>Factory Reset</span>
                                {resetSuccess && (
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-md">
                                    Reset Complete
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                {resetSuccess
                                  ? 'Storage, cached media & prefs cleared'
                                  : showResetConfirm
                                    ? 'Wipe all data, media & settings?'
                                    : 'Clear persistent storage, media & prefs'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {showResetConfirm ? (
                              <>
                                <button
                                  type="button"
                                  id={`btn-cancel-factory-reset-${app.id}`}
                                  onClick={handleCancelFactoryReset}
                                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-200/60 dark:bg-neutral-700/60 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  id={`btn-confirm-factory-reset-${app.id}`}
                                  disabled={isResetting}
                                  onClick={handleExecuteFactoryReset}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                                >
                                  {isResetting ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span>Resetting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="w-3 h-3" />
                                      <span>Confirm</span>
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                id={`btn-factory-reset-${app.id}`}
                                disabled={isResetting}
                                onClick={handleInitiateFactoryReset}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                                  resetSuccess
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/30'
                                }`}
                              >
                                {isResetting ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Resetting...</span>
                                  </>
                                ) : resetSuccess ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Done!</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline confirmation warning */}
                        {showResetConfirm && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[10px] leading-tight text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-start gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              Permanently removes all offline records, cached media, IndexedDB files, and custom preferences for <strong>{app.name}</strong>.
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description Text */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">About</div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed max-h-24 overflow-y-auto">
                      {app.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-3 shrink-0">
                  <button
                    id={`btn-modal-open-${app.id}`}
                    type="button"
                    onClick={() => {
                      setShowAppInfo(false);
                      onOpenApp(app.id);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open {app.name}</span>
                  </button>

                  {onTogglePinApp && (
                    <button
                      id={`btn-modal-remove-${app.id}`}
                      type="button"
                      onClick={() => {
                        setShowAppInfo(false);
                        onTogglePinApp(app.id);
                      }}
                      className="w-full py-2 px-3 text-xs text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-colors text-center cursor-pointer"
                    >
                      Remove from Home Screen
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

