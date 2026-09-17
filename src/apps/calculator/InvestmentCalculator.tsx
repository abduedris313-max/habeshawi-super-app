/**
 * @file InvestmentCalculator.tsx
 * @description Investment & Compound Interest Growth Calculator.
 * Calculates future value, total interest earned, recurring monthly deposits, and year-by-year projections.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  PiggyBank, 
  Calendar, 
  Percent, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Coins 
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface InvestmentCalculatorProps {
  isDarkMode?: boolean;
}

export const InvestmentCalculator: React.FC<InvestmentCalculatorProps> = ({ isDarkMode = true }) => {
  const [initialDeposit, setInitialDeposit] = useState<number>(50000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(3000);
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(12);
  const [investmentYears, setInvestmentYears] = useState<number>(10);
  const [compoundFreq, setCompoundFreq] = useState<'monthly' | 'annually'>('monthly');
  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    const P = Math.max(0, initialDeposit);
    const PMT = Math.max(0, monthlyContribution);
    const r = Math.max(0, annualReturnRate) / 100;
    const t = Math.max(1, investmentYears);
    const n = compoundFreq === 'monthly' ? 12 : 1;

    let balance = P;
    let totalContributed = P;
    const yearlyBreakdown: { year: number; balance: number; contributed: number; interest: number }[] = [];

    for (let yr = 1; yr <= t; yr++) {
      for (let m = 1; m <= 12; m++) {
        // Add interest for month
        const monthlyRate = r / 12;
        balance = balance * (1 + monthlyRate) + PMT;
        totalContributed += PMT;
      }

      const totalInterest = Math.max(0, balance - totalContributed);
      yearlyBreakdown.push({
        year: yr,
        balance,
        contributed: totalContributed,
        interest: totalInterest,
      });
    }

    const finalBalance = balance;
    const finalContributed = totalContributed;
    const finalInterest = Math.max(0, finalBalance - finalContributed);
    const interestRatio = finalBalance > 0 ? (finalInterest / finalBalance) * 100 : 0;

    return {
      finalBalance,
      finalContributed,
      finalInterest,
      interestRatio,
      yearlyBreakdown,
    };
  }, [initialDeposit, monthlyContribution, annualReturnRate, investmentYears, compoundFreq]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleCopy = () => {
    triggerHaptic('light');
    const text = `
HABESHAWI INVESTMENT PROJECTION
---------------------------------
Initial Deposit: ETB ${formatMoney(initialDeposit)}
Monthly Deposit: ETB ${formatMoney(monthlyContribution)}
Expected Return: ${annualReturnRate}% per year
Time Horizon: ${investmentYears} Years
---------------------------------
TOTAL PRINCIPAL INVESTED: ETB ${formatMoney(result.finalContributed)}
TOTAL COMPOUND INTEREST EARNED: ETB ${formatMoney(result.finalInterest)}
FUTURE PORTFOLIO VALUE: ETB ${formatMoney(result.finalBalance)}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner Hero */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#1c1611] via-[#14100c] to-[#0a0806] border-amber-500/40 shadow-amber-950/40' 
          : 'bg-gradient-to-br from-amber-50 via-white to-amber-100 border-amber-400/60 shadow-stone-300'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 uppercase tracking-wider">
              የወለድ እና ኢንቨስትመንት ማስያ
            </span>
            <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
              Compound Interest & Wealth Growth
            </h2>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md font-sans"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Projection'}</span>
          </button>
        </div>

        {/* Big Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              የተቀማጭ ዋና ገንዘብ (Principal Invested)
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
              <span className="text-xs font-normal text-amber-500 mr-1">ETB</span>
              {formatMoney(result.finalContributed)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              የተገኘው ወለድ (Compound Interest)
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
              <span className="text-xs font-normal mr-1">+ETB</span>
              {formatMoney(result.finalInterest)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-mono">
              {result.interestRatio.toFixed(1)}% of final value
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-yellow-950/20 border border-amber-500/40 shadow-xs">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> የወደፊት ሀብት (Future Value)
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
              <span className="text-sm font-normal mr-1">ETB</span>
              {formatMoney(result.finalBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            {/* Initial Deposit */}
            <div>
              <label className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
                መነሻ ተቀማጭ • Initial Deposit (ETB)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={initialDeposit || ''}
                onChange={(e) => setInitialDeposit(parseFloat(e.target.value) || 0)}
                className={`w-full p-2.5 rounded-xl text-lg font-bold font-mono outline-none border ${
                  isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                }`}
              />
            </div>

            {/* Monthly Contribution */}
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                ወርሃዊ ቁጠባ • Monthly Contribution (ETB)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={monthlyContribution || ''}
                onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
                className={`w-full p-2.5 rounded-xl text-lg font-bold font-mono outline-none border ${
                  isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                }`}
              />
            </div>

            {/* Annual Return & Years */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  የወለድ/ትርፍ ምጣኔ • Annual Return (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={annualReturnRate}
                  onChange={(e) => setAnnualReturnRate(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl text-lg font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  የኢንቨስትመንት ጊዜ • Years
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={investmentYears}
                  onChange={(e) => setInvestmentYears(parseInt(e.target.value) || 1)}
                  className={`w-full p-2.5 rounded-xl text-lg font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Yearly Growth Snapshot */}
        <div className="lg:col-span-5">
          <div className={`p-5 rounded-2xl border ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3">
              የዓመታት እድገት • Yearly Progression
            </h3>
            <div className="max-h-60 overflow-y-auto font-mono text-xs space-y-2">
              {result.yearlyBreakdown.map((row) => (
                <div key={row.year} className="flex justify-between items-center p-2 rounded-lg bg-stone-900/40 border border-stone-800/40">
                  <span className="font-bold text-stone-400">Year {row.year}</span>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">ETB {formatMoney(row.balance)}</div>
                    <div className="text-[10px] text-emerald-400">Interest: +{formatMoney(row.interest)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;
