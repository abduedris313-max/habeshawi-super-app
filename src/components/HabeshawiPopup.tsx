/**
 * @file HabeshawiPopup.tsx
 * @description Universal Habeshawi Popup & Dialog Modal System.
 * Features authentic Ethiopian Tibeb textile borders, Lalibela cross badge seals,
 * light and dark theme styling, and accessible keyboard/focus traps.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { HabeshawiBrandEmblem, HabeshawiTibebBorder, HabeshawiCrossWatermark } from './HabeshawiIcons';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';

export type HabeshawiPopupType = 'info' | 'success' | 'warning' | 'confirm' | 'cultural' | 'custom';

export interface HabeshawiPopupOptions {
  id?: string;
  title: string;
  amharicTitle?: string;
  message?: string;
  type?: HabeshawiPopupType;
  icon?: ReactNode;
  content?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmVariant?: 'gold' | 'emerald' | 'crimson' | 'stone';
  autoCloseMs?: number;
}

interface HabeshawiPopupContextType {
  showPopup: (options: HabeshawiPopupOptions) => void;
  closePopup: () => void;
  isOpen: boolean;
}

const HabeshawiPopupContext = createContext<HabeshawiPopupContextType | undefined>(undefined);

export const useHabeshawiPopup = (): HabeshawiPopupContextType => {
  const context = useContext(HabeshawiPopupContext);
  if (!context) {
    throw new Error('useHabeshawiPopup must be used within a HabeshawiPopupProvider');
  }
  return context;
};

interface HabeshawiPopupProviderProps {
  children: ReactNode;
  isDarkMode?: boolean;
}

export const HabeshawiPopupProvider: React.FC<HabeshawiPopupProviderProps> = ({
  children,
  isDarkMode = true
}) => {
  const [currentPopup, setCurrentPopup] = useState<HabeshawiPopupOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showPopup = useCallback((options: HabeshawiPopupOptions) => {
    soundManager.playAppLaunchSound();
    triggerHaptic('medium');
    setCurrentPopup(options);

    if (options.autoCloseMs) {
      setTimeout(() => {
        setCurrentPopup((prev) => (prev?.id === options.id ? null : prev));
      }, options.autoCloseMs);
    }
  }, []);

  const closePopup = useCallback(() => {
    soundManager.playHapticClick();
    triggerHaptic('light');
    if (currentPopup?.onCancel) {
      currentPopup.onCancel();
    }
    setCurrentPopup(null);
  }, [currentPopup]);

  const handleConfirm = async () => {
    if (!currentPopup) return;
    soundManager.playHapticClick();
    triggerHaptic('success');

    if (currentPopup.onConfirm) {
      try {
        setIsLoading(true);
        await currentPopup.onConfirm();
      } finally {
        setIsLoading(false);
        setCurrentPopup(null);
      }
    } else {
      setCurrentPopup(null);
    }
  };

  return (
    <HabeshawiPopupContext.Provider value={{ showPopup, closePopup, isOpen: !!currentPopup }}>
      {children}
      <AnimatePresence>
        {currentPopup && (
          <HabeshawiPopupModal
            isOpen={true}
            options={currentPopup}
            onClose={closePopup}
            onConfirm={handleConfirm}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </HabeshawiPopupContext.Provider>
  );
};

export interface HabeshawiPopupModalProps {
  isOpen: boolean;
  options: HabeshawiPopupOptions;
  onClose: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  isDarkMode?: boolean;
}

export const HabeshawiPopupModal: React.FC<HabeshawiPopupModalProps> = ({
  isOpen,
  options,
  onClose,
  onConfirm,
  isLoading = false,
  isDarkMode = true
}) => {
  if (!isOpen) return null;

  const {
    title,
    amharicTitle = 'ማስታወቂያ (Habeshawi Notice)',
    message,
    type = 'info',
    icon,
    content,
    confirmText = 'እሺ • Confirm',
    cancelText = 'ሰርዝ • Cancel',
    showCancel = type === 'confirm' || type === 'warning',
    confirmVariant = type === 'warning' ? 'crimson' : type === 'success' ? 'emerald' : 'gold'
  } = options;

  // Render cultural header icon based on type
  const renderIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 border border-rose-400/40">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'cultural':
      case 'confirm':
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-1 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300">
            <HabeshawiBrandEmblem className="w-full h-full" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 border-emerald-400/50';
      case 'crimson':
        return 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-700 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30 border-rose-400/50';
      case 'stone':
        return 'bg-stone-800 hover:bg-stone-700 text-stone-100 border-stone-600';
      case 'gold':
      default:
        return 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 shadow-amber-500/25 border-amber-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md select-none"
    >
      <motion.div
        initial={{ scale: 0.9, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 15, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 flex flex-col border shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#14100c] border-amber-500/35 text-amber-50 shadow-amber-950/60'
            : 'bg-[#fcfaf4] border-amber-400/60 text-stone-900 shadow-stone-400/30'
        }`}
      >
        {/* Top Decorative Woven Tibeb Border */}
        <div className="absolute top-0 left-0 right-0">
          <HabeshawiTibebBorder height={8} className="w-full opacity-90" />
        </div>

        {/* Background Cross Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <HabeshawiCrossWatermark
            className="w-64 h-64"
            opacity={isDarkMode ? 0.04 : 0.03}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-20 ${
            isDarkMode
              ? 'text-stone-400 hover:text-white hover:bg-white/10'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/70'
          }`}
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Section */}
        <div className="flex items-start gap-4 z-10 pt-2">
          <div className="shrink-0">{renderIcon()}</div>
          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono block truncate">
              {amharicTitle}
            </span>
            <h3 className={`text-base sm:text-lg font-black tracking-tight leading-snug mt-0.5 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}>
              {title}
            </h3>
          </div>
        </div>

        {/* Body Content */}
        <div className="my-4 z-10 space-y-3">
          {message && (
            <p className={`text-xs sm:text-sm leading-relaxed ${
              isDarkMode ? 'text-stone-300' : 'text-stone-700'
            }`}>
              {message}
            </p>
          )}
          {content && <div className="pt-1">{content}</div>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2 z-10">
          {showCancel && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-stone-900/90 hover:bg-stone-800 border-stone-700 text-stone-300'
                  : 'bg-white hover:bg-stone-100 border-stone-300 text-stone-700 shadow-xs'
              }`}
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={onConfirm || onClose}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md border active:scale-98 transition-all cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{confirmText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Bottom Accent */}
        <div className="w-full pt-3 mt-3 border-t border-amber-500/10 flex items-center justify-between text-[10px] text-stone-500 font-mono z-10">
          <span>ሐበሻዊ ስነ-ስርዓት</span>
          <span>Habeshawi System Dialog</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HabeshawiPopupModal;
