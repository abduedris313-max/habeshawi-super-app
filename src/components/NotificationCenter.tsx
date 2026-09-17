/**
 * @file NotificationCenter.tsx
 * @description iOS 18 style Notification Center shade overlay.
 * Triggered by swiping down on the Home Screen or clicking the Top Status Bar notifications.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { 
  Bell, 
  X, 
  Trash2, 
  Moon, 
  Flame, 
  Sliders, 
  Check, 
  Sparkles, 
  Volume2, 
  ChevronUp, 
  Clock, 
  Calendar,
  Send,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { SystemNotification, SystemSettings } from '../types';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onClearNotifications: () => void;
  onTriggerTestNotification?: () => void;
  settings?: SystemSettings;
  onUpdateSettings?: (updated: Partial<SystemSettings>) => void;
  isDarkMode?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearNotifications,
  onTriggerTestNotification,
  settings,
  onUpdateSettings,
  isDarkMode = true,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged upward by more than 40px or flicked up, dismiss
    if (info.offset.y < -40 || info.velocity.y < -250) {
      triggerHaptic('light');
      onClose();
    }
  };

  const handleClear = () => {
    soundManager.playClickSound();
    triggerHaptic('medium');
    onClearNotifications();
  };

  const handleTest = () => {
    soundManager.playClickSound();
    triggerHaptic('light');
    onTriggerTestNotification?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="notification-center-backdrop"
        className="fixed inset-0 z-50 flex flex-col items-center bg-black/60 backdrop-blur-xl transition-all"
        onClick={onClose}
      >
        <motion.div
          id="notification-center-panel"
          drag="y"
          dragConstraints={{ top: -200, bottom: 0 }}
          dragElastic={{ top: 0.15, bottom: 0.05 }}
          onDragEnd={handleDragEnd}
          initial={{ y: '-100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-xl max-h-[85vh] rounded-b-[32px] border-b border-x shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl select-none ${
            isDarkMode
              ? 'bg-[#161b22]/95 border-[#30363d] text-[#c9d1d9]'
              : 'bg-white/95 border-neutral-200 text-neutral-900'
          }`}
        >
          {/* iOS Status & Time Clock Header */}
          <div className="pt-6 pb-4 px-6 flex flex-col items-center text-center border-b border-neutral-700/20">
            <span className={`text-xs font-medium tracking-wide uppercase ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
            }`}>
              {dateStr || 'Sunday, September 6'}
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-0.5 font-sans">
              {timeStr || '9:41'}
            </h1>

            {/* Focus Mode Pill Status */}
            {settings && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClickSound();
                    onUpdateSettings?.({ focusMode: !settings.focusMode });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${
                    settings.focusMode
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : isDarkMode
                        ? 'bg-[#21262d] text-neutral-400 hover:text-white border-[#30363d]'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200'
                  }`}
                >
                  <Moon className={`w-3 h-3 ${settings.focusMode ? 'fill-white' : ''}`} />
                  <span>{settings.focusMode ? 'Focus Active' : 'Focus Mode Off'}</span>
                </button>

                {onTriggerTestNotification && (
                  <button
                    type="button"
                    onClick={handleTest}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      isDarkMode
                        ? 'bg-[#21262d] hover:bg-[#30363d] text-neutral-300 border-[#30363d]'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                    }`}
                    title="Simulate incoming notification"
                  >
                    <Send className="w-3 h-3 text-indigo-400" />
                    <span>Send Test Alert</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Header: Title + Clear All */}
          <div className="px-6 py-2.5 flex items-center justify-between border-b border-neutral-700/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide uppercase text-[11px] text-neutral-400">
                Notification Center ({notifications.length})
              </span>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-rose-500/10"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Notifications List Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20">
                  <Bell className="w-6 h-6 opacity-70" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-300">No Older Notifications</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Your notification history is clear. When system events or app alerts occur, they will appear here.
                </p>
                {onTriggerTestNotification && (
                  <button
                    type="button"
                    onClick={handleTest}
                    className="mt-4 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Trigger Sample Notification</span>
                  </button>
                )}
              </div>
            ) : (
              notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDarkMode
                      ? 'bg-[#0d1117] border-[#30363d] hover:border-neutral-600'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                            {notif.appName || 'Habeshawi'}
                          </span>
                          {notif.suppressedByFocus && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                              Focus Suppressed
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-500 font-mono ml-auto">
                            {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                          {notif.title}
                        </h4>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Swipe Up Grab Handle & Dismiss Bar */}
          <div 
            onClick={onClose}
            className="w-full py-3 flex flex-col items-center justify-center cursor-pointer border-t border-neutral-700/20 hover:bg-neutral-800/20 transition-colors"
          >
            <div className="w-10 h-1 rounded-full bg-neutral-400/50 mb-1" />
            <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
              <ChevronUp className="w-3 h-3" /> Swipe up or click to close
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
