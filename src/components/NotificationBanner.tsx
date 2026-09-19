/**
 * @file NotificationBanner.tsx
 * @description iOS 18 Dynamic Island / Top Banner notification toast.
 * Shown only when Focus Mode is OFF; suppressed when Focus Mode is ON.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { Bell, X, ArrowUp } from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationBannerProps {
  notification: SystemNotification | null;
  onDismiss: () => void;
  isDarkMode?: boolean;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  isDarkMode = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss after 4.5s unless paused by user touch or hover
  useEffect(() => {
    if (!notification) return;
    if (isHovered || isDragging) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, 4500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification, onDismiss, isHovered, isDragging]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // Dismiss if swiped up by more than 28px or flicked upward rapidly
    if (info.offset.y < -28 || info.velocity.y < -250) {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          drag="y"
          dragConstraints={{ top: -140, bottom: 15 }}
          dragElastic={{ top: 0.7, bottom: 0.15 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          initial={{ y: -70, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0, scale: 0.92, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed top-8 sm:top-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-auto touch-none select-none cursor-grab active:cursor-grabbing"
        >
          <div
            className={`flex flex-col p-3 rounded-2xl shadow-2xl backdrop-blur-2xl border transition-all ${
              isDarkMode
                ? 'bg-[#161b22]/95 text-[#c9d1d9] border-[#30363d] shadow-black/70'
                : 'bg-white/95 text-neutral-800 border-neutral-200/90 shadow-neutral-400/30'
            }`}
          >
            {/* iOS Swipe-up Pill Grab Bar Indicator */}
            <div className="flex items-center justify-center -mt-0.5 mb-1.5 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-1 rounded-full bg-neutral-400 dark:bg-neutral-500" />
            </div>

            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {notification.appName || 'Habeshawi'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                      <span>now</span>
                      <span className="opacity-40">•</span>
                      <span className="flex items-center gap-0.5 text-[9px] text-indigo-400/80 font-sans">
                        <ArrowUp className="w-2.5 h-2.5" /> swipe up
                      </span>
                    </div>
                  </div>
                  <h4
                    className={`text-xs font-semibold truncate mt-0.5 ${
                      isDarkMode ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {notification.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">
                    {notification.message}
                  </p>
                </div>
              </div>

              <button
                onClick={onDismiss}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-neutral-500/10 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
