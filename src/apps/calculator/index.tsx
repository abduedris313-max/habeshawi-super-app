/**
 * @file index.tsx
 * @description Comprehensive Habeshawi Calculator Suite:
 * 1. Standard & Scientific & Ge'ez Numeral Calculator
 * 2. Ethiopian Salary, Overtime (OT), Allowances & Income Tax Calculator
 * 3. Loan, Mortgage, EMI & Amortization Calculator
 * 4. Time Difference, Exact Chronological Age & Live Countdown Calculator
 * 5. More Recommended: Tip & Split, Discount & 15% VAT, Investment & Wealth Growth, Multi-Unit & Trip Fuel Converter
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator as CalcIcon, 
  Coins, 
  Landmark, 
  Clock, 
  Receipt, 
  Tag, 
  TrendingUp, 
  ArrowLeftRight,
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { triggerHaptic } from '../../utils/haptics';

// Sub-components
import { StandardCalculator } from './StandardCalculator';
import { SalaryCalculator } from './SalaryCalculator';
import { LoanCalculator } from './LoanCalculator';
import { TimeAgeCalculator } from './TimeAgeCalculator';
import { TipSplitCalculator } from './TipSplitCalculator';
import { DiscountVatCalculator } from './DiscountVatCalculator';
import { InvestmentCalculator } from './InvestmentCalculator';
import { UnitConverter } from './UnitConverter';

export type CalculatorTab = 
  | 'standard' 
  | 'salary' 
  | 'loan' 
  | 'time_age' 
  | 'tip_split' 
  | 'discount_vat' 
  | 'investment' 
  | 'converter';

interface TabItem {
  id: CalculatorTab;
  title: string;
  amharic: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'recommended';
}

const CALCULATOR_TABS: TabItem[] = [
  { id: 'standard', title: 'Standard', amharic: 'መደበኛ ማስያ', icon: CalcIcon, category: 'core' },
  { id: 'salary', title: 'Salary & OT', amharic: 'የደመወዝ ማስያ', icon: Coins, category: 'core' },
  { id: 'loan', title: 'Loan & EMI', amharic: 'የብድር ማስያ', icon: Landmark, category: 'core' },
  { id: 'time_age', title: 'Time & Age', amharic: 'እድሜ እና ቀን ልዩነት', icon: Clock, category: 'core' },
  { id: 'tip_split', title: 'Tip & Split', amharic: 'ቲፕ እና ሂሳብ', icon: Receipt, category: 'recommended' },
  { id: 'discount_vat', title: 'Discount & VAT', amharic: 'ቅናሽ እና ቫት', icon: Tag, category: 'recommended' },
  { id: 'investment', title: 'Investment', amharic: 'ኢንቨስትመንት', icon: TrendingUp, category: 'recommended' },
  { id: 'converter', title: 'Converter', amharic: 'መለኪያ እና ምንዛሪ', icon: ArrowLeftRight, category: 'recommended' },
];

export const HarmonyCalculatorApp: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.isDark;

  const [activeTab, setActiveTab] = useState<CalculatorTab>('salary');
  const [showMoreDropdown, setShowMoreDropdown] = useState<boolean>(false);

  const currentTabInfo = CALCULATOR_TABS.find(t => t.id === activeTab) || CALCULATOR_TABS[0];

  const handleSelectTab = (tabId: CalculatorTab) => {
    triggerHaptic('selection');
    setActiveTab(tabId);
    setShowMoreDropdown(false);
  };

  return (
    <div className={`h-full w-full flex flex-col items-center overflow-y-auto p-3 sm:p-5 select-none ${
      isDarkMode ? 'bg-[#0a0806] text-white' : 'bg-stone-50 text-stone-900'
    }`}>
      {/* Top Header & Tab Navigation Bar */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-800/60">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <currentTabInfo.icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-base sm:text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
              {currentTabInfo.amharic}
            </h1>
            <p className="text-[11px] font-mono text-stone-400">
              Habeshawi Calculator Suite • {currentTabInfo.title}
            </p>
          </div>
        </div>

        {/* Primary Horizontal Tabs + "More" Dropdown */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-2xl bg-stone-900/60 border border-stone-800 relative">
          {CALCULATOR_TABS.filter(t => t.category === 'core').map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.amharic.split(' ')[0]}</span>
                <span className="sm:hidden">{t.title}</span>
              </button>
            );
          })}

          {/* "More Recommended" Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                CALCULATOR_TABS.some(t => t.category === 'recommended' && t.id === activeTab)
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ተጨማሪ (More)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMoreDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#18130e] border border-amber-500/30 shadow-2xl p-1.5 z-50 space-y-1"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    ተጨማሪ የተመረጡ ማስያዎች • Recommended
                  </div>
                  {CALCULATOR_TABS.filter(t => t.category === 'recommended').map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTab(t.id)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left ${
                          isActive
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="leading-none">{t.amharic}</div>
                          <div className="text-[10px] text-stone-400 font-normal font-mono mt-0.5">{t.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-4xl pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === 'standard' && <StandardCalculator isDarkMode={isDarkMode} />}
            {activeTab === 'salary' && <SalaryCalculator isDarkMode={isDarkMode} />}
            {activeTab === 'loan' && <LoanCalculator isDarkMode={isDarkMode} />}
            {activeTab === 'time_age' && <TimeAgeCalculator isDarkMode={isDarkMode} />}
            {activeTab === 'tip_split' && <TipSplitCalculator isDarkMode={isDarkMode} />}
            {activeTab === 'discount_vat' && <DiscountVatCalculator isDarkMode={isDarkMode} />}
            {activeTab === 'investment' && <InvestmentCalculator isDarkMode={isDarkMode} />}
            {activeTab === 'converter' && <UnitConverter isDarkMode={isDarkMode} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HarmonyCalculatorApp;
