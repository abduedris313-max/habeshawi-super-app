/**
 * @file PwaInstallPrompt.tsx
 * @description PWA Installation guidance banner for iOS and mobile devices.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { HarmonyLogo } from './HarmonyLogo';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto p-4 rounded-3xl bg-neutral-900/95 border border-purple-500/40 text-white shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <HarmonyLogo size="md" />
          <div>
            <h4 className="text-xs font-bold text-white">Install Habeshawi</h4>
            <p className="text-[11px] text-white/60">Add Habeshawi to your home screen</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 rounded-full text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
