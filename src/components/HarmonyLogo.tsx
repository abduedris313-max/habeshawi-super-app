/**
 * @file HarmonyLogo.tsx
 * @description Official luxury icon & logo component for Habeshawi Super App.
 * Features Habeshawi emblem with Ge'ez typography motifs, gold/emerald/ruby heritage gradients,
 * subtle specular highlights, and responsive sizes.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HabeshawiBrandEmblem } from './HabeshawiIcons';

interface HarmonyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
  subtitle?: string;
  isDarkMode?: boolean;
}

export const HarmonyLogo: React.FC<HarmonyLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  onClick,
  subtitle = "ሐበሻ ሱፐር አፕ",
  isDarkMode = true
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeDimensions = {
    xs: { icon: 'w-5 h-5', rounded: 'rounded-md', text: 'text-xs', sub: 'text-[8.5px]' },
    sm: { icon: 'w-7 h-7', rounded: 'rounded-[8px]', text: 'text-sm', sub: 'text-[9.5px]' },
    md: { icon: 'w-9 h-9', rounded: 'rounded-[10px]', text: 'text-base', sub: 'text-[11px]' },
    lg: { icon: 'w-12 h-12', rounded: 'rounded-[14px]', text: 'text-lg', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', rounded: 'rounded-[18px]', text: 'text-2xl', sub: 'text-sm' },
  }[size];

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Icon Squircle Container with Habeshawi Gold Trim */}
      <motion.div
        whileHover={onClick ? { scale: 1.05 } : undefined}
        whileTap={onClick ? { scale: 0.95 } : undefined}
        className={`relative ${sizeDimensions.icon} ${sizeDimensions.rounded} overflow-hidden shadow-lg shadow-amber-950/40 border border-amber-500/50 shrink-0 bg-neutral-950 group`}
      >
        {!imgError ? (
          <img
            src="./habeshawi-logo.jpg"
            alt="Habeshawi"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          /* High-end vector SVG fallback with authentic Lalibela gold/emerald cross */
          <div className="w-full h-full bg-gradient-to-br from-[#1c1917] via-[#2a1a08] to-[#042f2e] flex items-center justify-center p-1 relative overflow-hidden">
            <HabeshawiBrandEmblem className="w-full h-full" />
          </div>
        )}

        {/* Specular gloss reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/20 pointer-events-none" />
      </motion.div>

      {/* Typography Label */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight ${sizeDimensions.text} ${
              isDarkMode 
                ? 'text-white' 
                : 'text-neutral-900'
            }`}>
              Habeshawi
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          {subtitle && (
            <span className={`${sizeDimensions.sub} font-medium tracking-wide ${isDarkMode ? 'text-amber-400/80' : 'text-amber-700/80'}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const HabeshawiLogo = HarmonyLogo;

