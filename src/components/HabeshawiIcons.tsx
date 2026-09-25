/**
 * @file HabeshawiIcons.tsx
 * @description Dedicated, authentic Habesha icon system for Habeshawi Super App.
 * Features handcrafted SVG artwork infused with Ethiopian/Eritrean heritage:
 * - Lalibela geometric cross & Axumite motifs
 * - Traditional Birana manuscripts & Qelem reed pens
 * - Ethiopian Krar (ክራር) acoustic lyre
 * - Woven Mesob (መሶብ) and Equb finance baskets
 * - Traditional clay Jebena (ጀበና) coffee pot
 * - Adey Abeba (አደይ አበባ) flowers & Ge'ez numerals (፩, ፪, ፫)
 * - Harari Ajam calligraphy borders & Tibeb (ጥልፍ) woven textiles
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
}

/**
 * 1. Habeshawi Master Brand Emblem / Lalibela Royal Cross
 */
export const HabeshawiBrandEmblem: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hab-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="80%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="hab-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="hab-crimson-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
      <filter id="hab-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Radiant 8-point sunburst rays */}
    <g opacity="0.6" stroke="url(#hab-gold-grad)" strokeWidth="1.5">
      <line x1="50" y1="6" x2="50" y2="18" />
      <line x1="50" y1="82" x2="50" y2="94" />
      <line x1="6" y1="50" x2="18" y2="50" />
      <line x1="82" y1="50" x2="94" y2="50" />
      <line x1="19" y1="19" x2="28" y2="28" />
      <line x1="72" y1="72" x2="81" y2="81" />
      <line x1="19" y1="81" x2="28" y2="72" />
      <line x1="72" y1="28" x2="81" y2="19" />
    </g>

    {/* Outer Lalibela Filigree Ring with Tibeb Diamonds */}
    <circle cx="50" cy="50" r="41" stroke="url(#hab-gold-grad)" strokeWidth="2.5" strokeDasharray="3 3" />
    <circle cx="50" cy="50" r="37" stroke="url(#hab-gold-grad)" strokeWidth="1.2" opacity="0.8" />

    {/* Interlocking Ge'ez Lalibela Cross Body */}
    <path
      d="M50 14 L57 28 L71 28 L60 38 L65 52 L50 43 L35 52 L40 38 L29 28 L43 28 Z"
      fill="url(#hab-gold-grad)"
      opacity="0.95"
    />
    <path
      d="M50 86 L57 72 L71 72 L60 62 L65 48 L50 57 L35 48 L40 62 L29 72 L43 72 Z"
      fill="url(#hab-gold-grad)"
      opacity="0.95"
    />
    <path
      d="M14 50 L28 43 L28 29 L38 40 L52 35 L43 50 L52 65 L38 60 L28 71 L28 57 Z"
      fill="url(#hab-gold-grad)"
      opacity="0.95"
    />
    <path
      d="M86 50 L72 43 L72 29 L62 40 L48 35 L57 50 L48 65 L62 60 L72 71 L72 57 Z"
      fill="url(#hab-gold-grad)"
      opacity="0.95"
    />

    {/* Central Royal Diamond with Ge'ez 'ሐ' (Ha for Habeshawi) Motif */}
    <polygon points="50,26 74,50 50,74 26,50" fill="#1C1917" stroke="url(#hab-gold-grad)" strokeWidth="2.5" />
    
    {/* Stylized Ge'ez Fidel ሐ (Ha) */}
    <path
      d="M38 41 V59 M62 41 V59 M38 50 H62"
      stroke="url(#hab-gold-grad)"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#hab-glow)"
    />

    {/* Tricolor Jewel insets */}
    <circle cx="50" cy="38" r="3" fill="url(#hab-emerald-grad)" />
    <circle cx="50" cy="62" r="3" fill="url(#hab-crimson-grad)" />
    <circle cx="38" cy="50" r="2.2" fill="#FBBF24" />
    <circle cx="62" cy="50" r="2.2" fill="#FBBF24" />
  </svg>
);

/**
 * 2. Habeshawi Notes (ማስታወሻ): Traditional Birana Leather Manuscript & Quill
 */
export const HabeshawiNotesIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="notes-parchment" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="70%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="notes-leather" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#78350F" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
      <linearGradient id="notes-ribbon" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>

    {/* Leather Book Backing */}
    <rect x="18" y="16" width="60" height="70" rx="8" fill="url(#notes-leather)" stroke="#F59E0B" strokeWidth="1.5" />
    
    {/* Parchment / Birana Pages */}
    <rect x="24" y="20" width="56" height="62" rx="5" fill="url(#notes-parchment)" />
    <rect x="22" y="22" width="56" height="60" rx="4" fill="#FFFBEB" opacity="0.9" />

    {/* Tibeb Border on Manuscript */}
    <path d="M30 26 H72" stroke="#D97706" strokeWidth="1.5" strokeDasharray="2 2" />
    <path d="M30 76 H72" stroke="#D97706" strokeWidth="1.5" strokeDasharray="2 2" />

    {/* Ge'ez Notes Lines */}
    <line x1="32" y1="36" x2="68" y2="36" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="46" x2="64" y2="46" stroke="#78350F" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <line x1="32" y1="56" x2="58" y2="56" stroke="#78350F" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <line x1="32" y1="66" x2="66" y2="66" stroke="#78350F" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

    {/* Ge'ez Initial 'ሀ' (He) on Header */}
    <text x="32" y="32" fontSize="9" fontWeight="bold" fill="#B91C1C" fontFamily="sans-serif">ሀ</text>

    {/* Tricolor Woven Bookmark Ribbon */}
    <path d="M66 16 V42 L71 36 L76 42 V16 Z" fill="url(#notes-ribbon)" />

    {/* Traditional Qelem Reed Pen Dipped in Ink */}
    <g transform="rotate(38 65 58)">
      <rect x="62" y="20" width="6" height="50" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1" />
      <polygon points="62,70 68,70 65,82" fill="#1C1917" />
      <circle cx="65" cy="81" r="1.5" fill="#EF4444" />
    </g>
  </svg>
);

/**
 * 3. Habeshawi Docs (ሰነዶች): Illuminated Royal Scroll with Lalibela Seal
 */
export const HabeshawiDocsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="docs-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E0F2FE" />
      </linearGradient>
      <linearGradient id="docs-seal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Document Paper with folded corner */}
    <path
      d="M24 16 H62 L76 30 V82 C76 85.3 73.3 88 70 88 H24 C20.7 88 18 85.3 18 82 V22 C18 18.7 20.7 16 24 16 Z"
      fill="url(#docs-bg)"
      stroke="#38BDF8"
      strokeWidth="2"
    />
    
    {/* Folded Top Corner with Gold Inset */}
    <path d="M62 16 V28 C62 29.1 62.9 30 64 30 H76 Z" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5" />

    {/* Lalibela Cross Header Emblem */}
    <g transform="translate(36, 24) scale(0.28)">
      <path d="M50 15 L55 35 L75 35 L60 48 L65 68 L50 55 L35 68 L40 48 L25 35 L45 35 Z" fill="#0284C7" />
    </g>

    {/* Document Heading and Text Lines */}
    <line x1="26" y1="46" x2="68" y2="46" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
    <line x1="26" y1="54" x2="62" y2="54" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="62" x2="54" y2="62" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="70" x2="50" y2="70" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

    {/* Royal Wax Seal with Ge'ez Symbol */}
    <circle cx="64" cy="72" r="11" fill="url(#docs-seal)" stroke="#FEF08A" strokeWidth="1.5" />
    <circle cx="64" cy="72" r="8" stroke="#FEF3C7" strokeWidth="1" strokeDasharray="2 1.5" />
    <text x="60.5" y="75.5" fontSize="9" fontWeight="bold" fill="#FFFFFF" fontFamily="sans-serif">ሰ</text>
  </svg>
);

/**
 * 4. Habeshawi Writing (ብዕር): Traditional Bamboo Qelem Pen & Manuscript Ink
 */
export const HabeshawiWritingIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pen-wood" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="60%" stopColor="#059669" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>
      <linearGradient id="nib-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Glowing Manuscript Parchment Background Ring */}
    <circle cx="50" cy="50" r="38" fill="#064E3B" opacity="0.3" />
    <circle cx="50" cy="50" r="34" stroke="#34D399" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

    {/* Calligraphic Flourish Waves */}
    <path
      d="M20 74 C34 68 38 82 54 74 C66 68 76 76 84 66"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />

    {/* Traditional Bamboo Nib Quill (Qelem) */}
    <g transform="rotate(-42 50 50)">
      {/* Pen Shaft */}
      <path d="M47 12 H53 V62 L50 78 L47 62 Z" fill="url(#pen-wood)" stroke="#A7F3D0" strokeWidth="1" />
      {/* Gold Nib Collar */}
      <rect x="46" y="58" width="8" height="6" rx="1.5" fill="url(#nib-gold)" />
      {/* Split Nib Point */}
      <polygon points="47,64 53,64 50,82" fill="url(#nib-gold)" stroke="#B45309" strokeWidth="0.8" />
      <line x1="50" y1="64" x2="50" y2="78" stroke="#1C1917" strokeWidth="0.8" />
      {/* Ink Breather Hole */}
      <circle cx="50" cy="70" r="1" fill="#1C1917" />
    </g>

    {/* Radiating Sparkles of Inspiration */}
    <circle cx="28" cy="30" r="2.5" fill="#FBBF24" />
    <circle cx="72" cy="28" r="2" fill="#34D399" />
    <circle cx="24" cy="62" r="1.8" fill="#F59E0B" />
  </svg>
);

/**
 * 5. Habeshawi Calendar (የቀን መቁጠሪያ): Ethiopian 13-Month Wheel & Adey Abeba
 */
export const HabeshawiCalendarIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cal-header" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <linearGradient id="adey-flower" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#EAB308" />
      </linearGradient>
    </defs>

    {/* Calendar Body Base */}
    <rect x="18" y="20" width="64" height="64" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
    
    {/* Red / Crimson Calendar Header */}
    <path d="M18 32 C18 25.4 23.4 20 30 20 H70 C76.6 20 82 25.4 82 32 V36 H18 V32 Z" fill="url(#cal-header)" />

    {/* Wall Hanging Rings */}
    <rect x="30" y="14" width="6" height="10" rx="3" fill="#64748B" stroke="#F8FAFC" strokeWidth="1" />
    <rect x="64" y="14" width="6" height="10" rx="3" fill="#64748B" stroke="#F8FAFC" strokeWidth="1" />

    {/* Ethiopian Meskerem / Adey Abeba (Yellow New Year Flower) Inset */}
    <g transform="translate(62, 58) scale(0.65)">
      {/* Flower Petals */}
      <ellipse cx="20" cy="12" rx="4" ry="9" fill="url(#adey-flower)" />
      <ellipse cx="20" cy="28" rx="4" ry="9" fill="url(#adey-flower)" />
      <ellipse cx="12" cy="20" rx="9" ry="4" fill="url(#adey-flower)" />
      <ellipse cx="28" cy="20" rx="9" ry="4" fill="url(#adey-flower)" />
      <ellipse cx="14" cy="14" rx="4" ry="9" transform="rotate(45 14 14)" fill="url(#adey-flower)" />
      <ellipse cx="26" cy="14" rx="4" ry="9" transform="rotate(-45 26 14)" fill="url(#adey-flower)" />
      <ellipse cx="14" cy="26" rx="4" ry="9" transform="rotate(-45 14 26)" fill="url(#adey-flower)" />
      <ellipse cx="26" cy="26" rx="4" ry="9" transform="rotate(45 26 26)" fill="url(#adey-flower)" />
      <circle cx="20" cy="20" r="4.5" fill="#78350F" />
    </g>

    {/* Ge'ez Numeral Date ፩ (Day 1 / Meskerem) */}
    <text x="28" y="65" fontSize="28" fontWeight="bold" fill="#0F172A" fontFamily="Noto Sans Ethiopic, sans-serif">፩</text>
    
    {/* Subtitle tag: ጳጉሜን / 13 Months */}
    <text x="28" y="76" fontSize="7" fontWeight="bold" fill="#EF4444" fontFamily="sans-serif">13 MONTHS</text>
  </svg>
);

/**
 * 6. Habeshawi Finance (ዕቁብ / ቅርጫ): Traditional Woven Mesob & Birr Coins
 */
export const HabeshawiFinanceIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mesob-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="coin-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Background Aura */}
    <circle cx="50" cy="50" r="38" fill="#065F46" opacity="0.3" />

    {/* Mesob (Traditional Ethiopian Woven Food/Savings Basket) Base */}
    <path
      d="M30 68 C30 68 36 84 50 84 C64 84 70 68 70 68 H30 Z"
      fill="#D97706"
      stroke="#FDE68A"
      strokeWidth="1.5"
    />
    
    {/* Mesob Middle Drum */}
    <path
      d="M24 50 L30 68 H70 L76 50 Z"
      fill="#B45309"
      stroke="#FDE68A"
      strokeWidth="1.5"
    />

    {/* Mesob Colorful Geometric Weave Patterns (Tibeb Bands) */}
    <polygon points="32,56 40,64 48,56 56,64 64,56 68,64 28,64" fill="#10B981" />
    <polygon points="36,54 44,60 52,54 60,60 64,54" fill="#EF4444" />

    {/* Mesob Conical Lid Top */}
    <path
      d="M22 50 L50 18 L78 50 Z"
      fill="url(#mesob-gold)"
      stroke="#78350F"
      strokeWidth="1.5"
    />
    {/* Conical Lid Knob */}
    <circle cx="50" cy="16" r="3.5" fill="#EF4444" stroke="#FDE68A" strokeWidth="1" />

    {/* Floating Gold Ethiopian Birr Coins (Equb Cash Flow) */}
    <g transform="translate(60, 24)">
      <circle cx="12" cy="12" r="10" fill="url(#coin-gold)" stroke="#FEF08A" strokeWidth="1.2" />
      <text x="8.5" y="16" fontSize="11" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">ብር</text>
    </g>
    <g transform="translate(18, 30)">
      <circle cx="8" cy="8" r="7" fill="url(#coin-gold)" stroke="#FEF08A" strokeWidth="1" />
      <text x="5.5" y="11" fontSize="8" fontWeight="bold" fill="#78350F" fontFamily="sans-serif">ETB</text>
    </g>
  </svg>
);

/**
 * 7. Habeshawi Music (ክራር / ዜማ): Traditional 6-String Ethiopian Krar Lyre
 */
export const HabeshawiMusicIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="krar-wood" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="50%" stopColor="#7E22CE" />
        <stop offset="100%" stopColor="#3B0764" />
      </linearGradient>
      <linearGradient id="krar-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Background Soundwave Halo */}
    <circle cx="50" cy="50" r="38" stroke="#E879F9" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />
    <circle cx="50" cy="50" r="42" stroke="#F472B6" strokeWidth="0.8" opacity="0.25" />

    {/* Traditional Krar Wooden Lyre Frame (Two Side Arms + Crossbar) */}
    {/* Upper Crossbar */}
    <rect x="22" y="18" width="56" height="7" rx="3" fill="#D97706" stroke="#FDE68A" strokeWidth="1" />
    
    {/* Left Arm */}
    <path d="M26 22 L34 62 L40 62 L32 22 Z" fill="url(#krar-wood)" stroke="#C084FC" strokeWidth="0.8" />
    {/* Right Arm */}
    <path d="M74 22 L66 62 L60 62 L68 22 Z" fill="url(#krar-wood)" stroke="#C084FC" strokeWidth="0.8" />

    {/* Krar Resonator Bowl / Soundbox (Leather-covered round bowl) */}
    <ellipse cx="50" cy="68" rx="26" ry="18" fill="url(#krar-wood)" stroke="#FDE68A" strokeWidth="2" />
    <ellipse cx="50" cy="68" rx="20" ry="13" fill="#581C87" />

    {/* Soundbox Bridge */}
    <rect x="40" y="70" width="20" height="4" rx="2" fill="#D97706" />

    {/* 6 Ethiopian Acoustic Strings (Tizita & Bati Scale) */}
    <line x1="30" y1="22" x2="44" y2="72" stroke="#FEF08A" strokeWidth="1.2" />
    <line x1="38" y1="22" x2="46.5" y2="72" stroke="#FEF08A" strokeWidth="1.2" />
    <line x1="46" y1="22" x2="49" y2="72" stroke="#FEF08A" strokeWidth="1.2" />
    <line x1="54" y1="22" x2="51.5" y2="72" stroke="#FEF08A" strokeWidth="1.2" />
    <line x1="62" y1="22" x2="54" y2="72" stroke="#FEF08A" strokeWidth="1.2" />
    <line x1="70" y1="22" x2="56.5" y2="72" stroke="#FEF08A" strokeWidth="1.2" />

    {/* Traditional Tuning Cloths in Tricolor */}
    <circle cx="30" cy="21" r="2.5" fill="#10B981" />
    <circle cx="46" cy="21" r="2.5" fill="#F59E0B" />
    <circle cx="70" cy="21" r="2.5" fill="#EF4444" />

    {/* Musical Notes & Soundwaves */}
    <circle cx="78" cy="38" r="3" fill="#F472B6" />
    <path d="M81 38 V26 H88 V32" stroke="#F472B6" strokeWidth="1.5" fill="none" />
  </svg>
);

/**
 * 8. Habeshawi AI Copilot (ሊቅ / ጠቢብ): Axum Star & Neural Constellation
 */
export const HabeshawiAiCopilotIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ai-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="50%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
      <linearGradient id="ai-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>

    {/* Outer Neural Constellation Web */}
    <polygon points="50,12 82,32 82,68 50,88 18,68 18,32" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
    <polygon points="50,22 74,38 74,62 50,78 26,62 26,38" stroke="#C084FC" strokeWidth="1" opacity="0.5" />

    {/* Neural Interconnect Nodes */}
    <circle cx="50" cy="12" r="3.5" fill="#F43F5E" />
    <circle cx="82" cy="32" r="3.5" fill="#38BDF8" />
    <circle cx="82" cy="68" r="3.5" fill="#34D399" />
    <circle cx="50" cy="88" r="3.5" fill="#FBBF24" />
    <circle cx="18" cy="68" r="3.5" fill="#C084FC" />
    <circle cx="18" cy="32" r="3.5" fill="#60A5FA" />

    {/* Central Royal 8-Point Lalibela Spark of Wisdom */}
    <path
      d="M50 20 L56 42 L78 50 L56 58 L50 80 L44 58 L22 50 L44 42 Z"
      fill="url(#ai-gold)"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />

    {/* Central Eye of Intelligence / Ge'ez 'ሊ' (Li for Leeq / Wise) */}
    <circle cx="50" cy="50" r="7" fill="#1E1B4B" stroke="#FDE68A" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="3" fill="#60A5FA" />
  </svg>
);

/**
 * 9. Habeshawi Ajam Script (አጃም ቅርስ): Historical Harari Manuscript & Calligraphy
 */
export const HabeshawiAjamIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ajam-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
    </defs>

    {/* Harari Manuscript Leather Cover */}
    <rect x="18" y="16" width="64" height="68" rx="6" fill="#1C1917" stroke="#F59E0B" strokeWidth="2" />
    
    {/* Intricate Islamic-Ethiopian Archway / Mihrab Frame */}
    <path
      d="M26 76 V36 C26 24 50 18 50 18 C50 18 74 24 74 36 V76 Z"
      fill="#78350F"
      stroke="#FDE68A"
      strokeWidth="1.5"
    />

    {/* Inner Parchment */}
    <path
      d="M30 72 V38 C30 28 50 24 50 24 C50 24 70 28 70 38 V72 Z"
      fill="#FEF3C7"
    />

    {/* Historic Ajam / Arabic Calligraphy Script Curves */}
    <path
      d="M36 40 C42 36 48 42 54 38 M58 40 C62 38 66 40 68 38"
      stroke="#991B1B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M36 50 C44 48 48 54 58 50 M60 52 C64 50 66 52 68 50"
      stroke="#1C1917"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M36 60 C42 62 50 58 56 62 M60 60 C64 62 66 60 68 62"
      stroke="#1C1917"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Illuminated Corner Gold Knots */}
    <circle cx="34" cy="30" r="2" fill="#D97706" />
    <circle cx="66" cy="30" r="2" fill="#D97706" />
    <circle cx="50" cy="22" r="2.5" fill="#EF4444" />
  </svg>
);

/**
 * 10. Habeshawi App Store (ገበያ / ሱቅ): Artisan Leather Satchel & Gems
 */
export const HabeshawiAppStoreIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="store-bag" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="50%" stopColor="#0369A1" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>
    </defs>

    {/* Bag Handle Loop */}
    <path
      d="M36 34 C36 22 42 16 50 16 C58 16 64 22 64 34"
      stroke="#FDE68A"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* Artisan Habesha Leather Satchel Body */}
    <rect x="20" y="32" width="60" height="54" rx="12" fill="url(#store-bag)" stroke="#38BDF8" strokeWidth="2" />
    
    {/* Woven Tibeb Band across Bag */}
    <rect x="20" y="48" width="60" height="12" fill="#F59E0B" />
    <path d="M22 54 L28 48 L34 54 L40 48 L46 54 L52 48 L58 54 L64 48 L70 54 L76 48 L78 50" stroke="#EF4444" strokeWidth="2" fill="none" />

    {/* Center Gem App Badge */}
    <polygon points="50,66 58,74 50,82 42,74" fill="#10B981" stroke="#FEF08A" strokeWidth="1.5" />
    <circle cx="50" cy="74" r="2" fill="#FFFFFF" />

    {/* Download / Sparkle Arrow */}
    <path d="M50 36 V44 M46 41 L50 45 L54 41" stroke="#FEF08A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 11. Habeshawi Weather (የአየር ሁኔታ): Simien Highlands & Sunburst
 */
export const HabeshawiWeatherIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky-highlands" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="60%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="sun-hab" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Highlands Mountain Peak (Ras Dashen / Simien Mountains) */}
    <polygon points="12,84 38,46 58,70 72,52 88,84" fill="#047857" opacity="0.9" />
    <polygon points="26,84 52,38 78,84" fill="#065F46" />
    {/* Snow/Rock Cap on Peak */}
    <polygon points="46,47 52,38 58,47 54,49 52,46 49,49" fill="#F8FAFC" />

    {/* Golden Ethiopian Sunburst over Highlands */}
    <g transform="translate(62, 28)">
      <circle cx="12" cy="12" r="12" fill="url(#sun-hab)" stroke="#FEF08A" strokeWidth="1.5" />
      <g stroke="#FDE047" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="-3" x2="12" y2="1" />
        <line x1="12" y1="23" x2="12" y2="27" />
        <line x1="-3" y1="12" x2="1" y2="12" />
        <line x1="23" y1="12" x2="27" y2="12" />
        <line x1="2" y1="2" x2="5" y2="5" />
        <line x1="19" y1="19" x2="22" y2="22" />
      </g>
    </g>

    {/* Soft Highland Cloud */}
    <path
      d="M24 72 C24 66.5 28.5 62 34 62 C35.2 62 36.3 62.2 37.3 62.6 C39.2 57.5 44.2 54 50 54 C57.2 54 63.2 59.2 64.4 66.2 C65.2 66.1 66.1 66 67 66 C71.4 66 75 69.6 75 74 C75 78.4 71.4 82 67 82 H34 C28.5 82 24 77.5 24 72 Z"
      fill="#FFFFFF"
      fillOpacity="0.95"
      stroke="#BAE6FD"
      strokeWidth="1.5"
    />
  </svg>
);

/**
 * 12. Habeshawi Calculator (ሂሳብ): Ge'ez Numeral Brass Abacus
 */
export const HabeshawiCalculatorIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="calc-body" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>

    {/* Calculator Frame */}
    <rect x="18" y="16" width="64" height="68" rx="12" fill="url(#calc-body)" stroke="#FDE68A" strokeWidth="2" />
    
    {/* LCD Screen showing Ge'ez calculation result */}
    <rect x="24" y="22" width="52" height="18" rx="5" fill="#1C1917" stroke="#78350F" strokeWidth="1.5" />
    <text x="68" y="35" fontSize="11" fontWeight="bold" fill="#34D399" textAnchor="end" fontFamily="Noto Sans Ethiopic, sans-serif">
      ፯፻፵፪
    </text>

    {/* Keypad Grid with Ge'ez & Math Operators */}
    {/* Row 1 */}
    <rect x="24" y="46" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="29" y="53" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፩</text>

    <rect x="38" y="46" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="43" y="53" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፪</text>

    <rect x="52" y="46" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="57" y="53" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፫</text>

    <rect x="66" y="46" width="10" height="9" rx="2.5" fill="#EF4444" />
    <text x="71" y="53" fontSize="7" fontWeight="bold" fill="#FFF" textAnchor="middle">÷</text>

    {/* Row 2 */}
    <rect x="24" y="58" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="29" y="65" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፬</text>

    <rect x="38" y="58" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="43" y="65" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፭</text>

    <rect x="52" y="58" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="57" y="65" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፮</text>

    <rect x="66" y="58" width="10" height="9" rx="2.5" fill="#10B981" />
    <text x="71" y="65" fontSize="7" fontWeight="bold" fill="#FFF" textAnchor="middle">×</text>

    {/* Row 3 */}
    <rect x="24" y="70" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="29" y="77" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፯</text>

    <rect x="38" y="70" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="43" y="77" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፰</text>

    <rect x="52" y="70" width="10" height="9" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
    <text x="57" y="77" fontSize="6.5" fontWeight="bold" fill="#000" textAnchor="middle">፱</text>

    <rect x="66" y="70" width="10" height="9" rx="2.5" fill="#3B82F6" />
    <text x="71" y="77" fontSize="7" fontWeight="bold" fill="#FFF" textAnchor="middle">=</text>
  </svg>
);

/**
 * 13. Habeshawi Focus Studio (ትኩረት / ቡና ዜን): Traditional Clay Jebena & Focus Ring
 */
export const HabeshawiFocusIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="jebena-clay" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#44403C" />
        <stop offset="50%" stopColor="#1C1917" />
        <stop offset="100%" stopColor="#0C0A09" />
      </linearGradient>
      <linearGradient id="focus-ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
    </defs>

    {/* Concentric Zen Timer Progress Ring */}
    <circle cx="50" cy="50" r="38" stroke="#FDA4AF" strokeWidth="2" opacity="0.3" strokeDasharray="4 4" />
    <circle cx="50" cy="50" r="34" stroke="url(#focus-ring)" strokeWidth="3" strokeDasharray="140 70" strokeLinecap="round" />

    {/* Traditional Ethiopian Clay Coffee Pot (Jebena / ጀበና) */}
    {/* Round Clay Base */}
    <circle cx="50" cy="62" r="18" fill="url(#jebena-clay)" stroke="#F59E0B" strokeWidth="1.2" />
    
    {/* Long Elegant Neck */}
    <path d="M46 36 H54 V48 H46 Z" fill="url(#jebena-clay)" />
    {/* Funnel Flared Spout Top */}
    <path d="M43 32 L57 32 L54 36 L46 36 Z" fill="#D97706" stroke="#FDE68A" strokeWidth="0.8" />
    {/* Straw Plug on Top */}
    <polygon points="50,26 47,32 53,32" fill="#FBBF24" />

    {/* Pouring Spout Side Arm */}
    <path d="M36 54 L24 44 L26 42 L38 52" fill="url(#jebena-clay)" stroke="#F59E0B" strokeWidth="0.8" />

    {/* Curved Clay Handle */}
    <path
      d="M58 48 C70 48 72 64 58 68"
      stroke="url(#jebena-clay)"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* Fragrant Coffee Steam Spirals / Zen Waves */}
    <path
      d="M48 24 C46 18 52 14 50 8"
      stroke="#FDE047"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
      opacity="0.8"
    />
    <path
      d="M54 22 C56 18 52 14 54 10"
      stroke="#FB923C"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
  </svg>
);

/**
 * 14. Habeshawi Terminal (ተርሚናል): Obsidian Ge'ez Console
 */
export const HabeshawiTerminalIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="20" width="68" height="60" rx="10" fill="#090D16" stroke="#10B981" strokeWidth="2" />
    
    {/* Console Titlebar */}
    <path d="M16 30 C16 24.5 20.5 20 26 20 H74 C79.5 20 84 24.5 84 30 V32 H16 V30 Z" fill="#1F2937" />
    <circle cx="24" cy="26" r="2" fill="#EF4444" />
    <circle cx="30" cy="26" r="2" fill="#F59E0B" />
    <circle cx="36" cy="26" r="2" fill="#10B981" />

    {/* Ge'ez Prompt & Terminal Syntax */}
    <text x="24" y="46" fontSize="9" fontWeight="bold" fill="#10B981" fontFamily="monospace">
      ሀበሻ:~$
    </text>
    <line x1="58" y1="46" x2="64" y2="46" stroke="#34D399" strokeWidth="2.5" />

    <text x="24" y="58" fontSize="7.5" fill="#38BDF8" fontFamily="monospace">
      &gt; repo sync
    </text>
    <text x="24" y="68" fontSize="7" fill="#A7F3D0" fontFamily="monospace">
      [OK] 8 apps ready
    </text>
  </svg>
);

/**
 * 15. Habeshawi Habits (ልማድ): Interlocking Tricolor Thread Activity Rings
 */
export const HabeshawiHabitsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer Emerald Ring (Movement & Health) */}
    <circle cx="50" cy="50" r="36" stroke="#064E3B" strokeWidth="6" opacity="0.4" />
    <circle
      cx="50"
      cy="50"
      r="36"
      stroke="#10B981"
      strokeWidth="6"
      strokeDasharray="180 50"
      strokeLinecap="round"
      transform="rotate(-90 50 50)"
    />

    {/* Middle Gold Ring (Mindfulness & Study) */}
    <circle cx="50" cy="50" r="27" stroke="#78350F" strokeWidth="6" opacity="0.4" />
    <circle
      cx="50"
      cy="50"
      r="27"
      stroke="#F59E0B"
      strokeWidth="6"
      strokeDasharray="140 40"
      strokeLinecap="round"
      transform="rotate(30 50 50)"
    />

    {/* Inner Crimson Ring (Focus & Momentum) */}
    <circle cx="50" cy="50" r="18" stroke="#881337" strokeWidth="6" opacity="0.4" />
    <circle
      cx="50"
      cy="50"
      r="18"
      stroke="#EF4444"
      strokeWidth="6"
      strokeDasharray="90 30"
      strokeLinecap="round"
      transform="rotate(120 50 50)"
    />

    {/* Center Core Sparkle */}
    <polygon points="50,45 52,48 55,50 52,52 50,55 48,52 45,50 48,48" fill="#FEF08A" />
  </svg>
);

/**
 * 16. Habeshawi Voice Live (ድምፅ): Acoustic Resonator, Mic Spark & Lalibela Soundwaves
 */
export const HabeshawiVoiceIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="voice-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="voice-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* Concentric Spherical Soundwaves */}
    <circle cx="50" cy="50" r="42" stroke="url(#voice-cyan)" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
    <circle cx="50" cy="50" r="34" stroke="url(#voice-gold)" strokeWidth="2.5" opacity="0.7" />

    {/* Microphone Capsule with Ethiopian Filigree */}
    <rect x="42" y="24" width="16" height="28" rx="8" fill="url(#voice-gold)" stroke="#FEF08A" strokeWidth="1.5" />
    <line x1="42" y1="36" x2="58" y2="36" stroke="#92400E" strokeWidth="1.5" />
    <line x1="42" y1="42" x2="58" y2="42" stroke="#92400E" strokeWidth="1.5" />

    {/* Mic Cradle / Sound Receiver Arc */}
    <path
      d="M34 40 C34 58, 66 58, 66 40"
      stroke="#38BDF8"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <line x1="50" y1="58" x2="50" y2="72" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M40 72 H60" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />

    {/* Lateral Audio Radiance Waves */}
    <path d="M24 38 C20 44, 20 54, 24 60" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M16 32 C10 42, 10 58, 16 68" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

    <path d="M76 38 C80 44, 80 54, 76 60" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M84 32 C90 42, 90 58, 84 68" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

    {/* Top Voice Sparkle */}
    <polygon points="50,14 52,18 56,20 52,22 50,26 48,22 44,20 48,18" fill="#FEF08A" />
  </svg>
);

/**
 * Unified Dispatcher: Get authentic Habeshawi icon by app ID or icon name
 */
export const HabeshawiAppIcon: React.FC<{
  appId?: string;
  iconName?: string;
  className?: string;
}> = ({ appId, iconName, className = 'w-6 h-6' }) => {
  const normalizedId = (appId || '').toLowerCase();
  const normalizedName = (iconName || '').toLowerCase();

  // Match by specific app ID first
  if (normalizedId.includes('voice')) return <HabeshawiVoiceIcon className={className} />;
  if (normalizedId.includes('note')) return <HabeshawiNotesIcon className={className} />;
  if (normalizedId.includes('doc-ai') || normalizedId.includes('docs-ai') || normalizedId.includes('copilot')) {
    return <HabeshawiAiCopilotIcon className={className} />;
  }
  if (normalizedId.includes('doc')) return <HabeshawiDocsIcon className={className} />;
  if (normalizedId.includes('writ')) return <HabeshawiWritingIcon className={className} />;
  if (normalizedId.includes('cal')) return <HabeshawiCalendarIcon className={className} />;
  if (normalizedId.includes('fin')) return <HabeshawiFinanceIcon className={className} />;
  if (normalizedId.includes('mus')) return <HabeshawiMusicIcon className={className} />;
  if (normalizedId.includes('ajam')) return <HabeshawiAjamIcon className={className} />;
  if (normalizedId.includes('store')) return <HabeshawiAppStoreIcon className={className} />;
  if (normalizedId.includes('weath')) return <HabeshawiWeatherIcon className={className} />;
  if (normalizedId.includes('calc')) return <HabeshawiCalculatorIcon className={className} />;
  if (normalizedId.includes('foc')) return <HabeshawiFocusIcon className={className} />;
  if (normalizedId.includes('term')) return <HabeshawiTerminalIcon className={className} />;
  if (normalizedId.includes('habit')) return <HabeshawiHabitsIcon className={className} />;

  // Match by icon name
  if (normalizedName === 'mic' || normalizedName === 'audio_spark' || normalizedName === 'voice') {
    return <HabeshawiVoiceIcon className={className} />;
  }
  if (normalizedName === 'notebook') return <HabeshawiNotesIcon className={className} />;
  if (normalizedName === 'file-text') return <HabeshawiDocsIcon className={className} />;
  if (normalizedName === 'pen-tool') return <HabeshawiWritingIcon className={className} />;
  if (normalizedName === 'calendar') return <HabeshawiCalendarIcon className={className} />;
  if (normalizedName === 'wallet') return <HabeshawiFinanceIcon className={className} />;
  if (normalizedName === 'disc') return <HabeshawiMusicIcon className={className} />;
  if (normalizedName === 'sparkles') return <HabeshawiAiCopilotIcon className={className} />;
  if (normalizedName === 'book-open') return <HabeshawiAjamIcon className={className} />;
  if (normalizedName === 'shopping-bag' || normalizedName === 'store') return <HabeshawiAppStoreIcon className={className} />;
  if (normalizedName === 'cloud-sun') return <HabeshawiWeatherIcon className={className} />;
  if (normalizedName === 'calculator') return <HabeshawiCalculatorIcon className={className} />;
  if (normalizedName === 'timer' || normalizedName === 'clock') return <HabeshawiFocusIcon className={className} />;
  if (normalizedName === 'terminal') return <HabeshawiTerminalIcon className={className} />;
  if (normalizedName === 'activity') return <HabeshawiHabitsIcon className={className} />;

  // Fallback to master brand emblem
  return <HabeshawiBrandEmblem className={className} />;
};

/**
 * Traditional Ethiopian Woven Tibeb Ribbon Pattern (ጥልፍ)
 */
export const HabeshawiTibebBorder: React.FC<{ className?: string; height?: number }> = ({ 
  className = 'w-full h-3', 
  height = 12 
}) => (
  <svg 
    viewBox="0 0 400 20" 
    preserveAspectRatio="none" 
    className={className} 
    style={{ height }}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="tibeb-gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="tibeb-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
      <linearGradient id="tibeb-crimson" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
      <pattern id="tibeb-repeat" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
        {/* Top/Bottom gold stitching lines */}
        <line x1="0" y1="2" x2="40" y2="2" stroke="url(#tibeb-gold)" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="0" y1="18" x2="40" y2="18" stroke="url(#tibeb-gold)" strokeWidth="1.5" strokeDasharray="3 2" />
        
        {/* Interlocking Tibeb Diamonds */}
        <polygon points="20,4 30,10 20,16 10,10" fill="url(#tibeb-gold)" />
        <polygon points="20,6 26,10 20,14 14,10" fill="#1C1917" />
        
        {/* Flanking Emerald & Crimson Chevron Wings */}
        <polygon points="5,10 0,6 0,14" fill="url(#tibeb-emerald)" />
        <polygon points="35,10 40,6 40,14" fill="url(#tibeb-crimson)" />
        
        {/* Center Ge'ez Cross Dot */}
        <circle cx="20" cy="10" r="1.8" fill="#FEF08A" />
      </pattern>
    </defs>
    <rect width="400" height="20" fill="url(#tibeb-repeat)" />
  </svg>
);

/**
 * Solar Lalibela Halo Animated Loader Spinner
 */
export const HabeshawiSpinner: React.FC<{ size?: number | string; className?: string; isDark?: boolean }> = ({
  size = 48,
  className = '',
  isDark = true
}) => (
  <div 
    className={`relative flex items-center justify-center ${className}`}
    style={{ width: size, height: size }}
  >
    {/* Outer Rotating Sunburst Ring */}
    <svg 
      viewBox="0 0 100 100" 
      className="w-full h-full animate-spin [animation-duration:6s]"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="spin-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" stroke="url(#spin-gold)" strokeWidth="2.5" strokeDasharray="8 6" opacity="0.8" />
      <circle cx="50" cy="50" r="38" stroke="url(#spin-gold)" strokeWidth="1" opacity="0.4" />
      
      {/* 8 Cardinal Sun Radiance Points */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <circle 
          key={i} 
          cx={50 + 44 * Math.cos((angle * Math.PI) / 180)} 
          cy={50 + 44 * Math.sin((angle * Math.PI) / 180)} 
          r={i % 2 === 0 ? "2.5" : "1.8"} 
          fill={i % 3 === 0 ? "#10B981" : i % 3 === 1 ? "#EF4444" : "#FBBF24"} 
        />
      ))}
    </svg>

    {/* Counter-rotating Inner Cross Geometry */}
    <svg 
      viewBox="0 0 100 100" 
      className="w-3/4 h-3/4 absolute animate-spin [animation-duration:10s] [animation-direction:reverse]" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="50,22 62,38 78,50 62,62 50,78 38,62 22,50 38,38" stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.8" />
    </svg>

    {/* Central Pulsing Lalibela Emblem */}
    <div className="absolute w-1/2 h-1/2 flex items-center justify-center animate-pulse">
      <HabeshawiBrandEmblem className="w-full h-full drop-shadow-md" />
    </div>
  </div>
);

/**
 * Subtle Background Lalibela Cross Watermark
 */
export const HabeshawiCrossWatermark: React.FC<{ className?: string; opacity?: number }> = ({ 
  className = 'w-96 h-96', 
  opacity = 0.05 
}) => (
  <div className={`pointer-events-none select-none flex items-center justify-center ${className}`} style={{ opacity }}>
    <HabeshawiBrandEmblem className="w-full h-full" />
  </div>
);

