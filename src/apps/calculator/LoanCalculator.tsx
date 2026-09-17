/**
 * @file LoanCalculator.tsx
 * @description Loan & Mortgage EMI Calculator with Amortization Schedule & Early Payoff simulator.
 * Supports reducing balance EMI, flat rate calculations, extra payments, and detailed breakdown.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  Calendar, 
  Percent, 
  TrendingDown, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building,
  Car,
  CircleDollarSign,
  HelpCircle
} from 'lucide-react';
import { 
  LoanCalculationInput, 
  LoanCalculationResult, 
  AmortizationRow, 
  SUPPORTED_CURRENCIES 
} from './types';
import { triggerHaptic } from '../../utils/haptics';

interface LoanCalculatorProps {
  isDarkMode?: boolean;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({ isDarkMode = true }) => {
  const [copied, setCopied] = useState(false);
  const [showAmortization, setShowAmortization] = useState(false);
  const [amortizationView, setAmortizationView] = useState<'yearly' | 'monthly'>('yearly');

  // Input states with realistic defaults (e.g. 500,000 ETB vehicle / home loan at 16.5% interest)
  const [input, setInput] = useState<LoanCalculationInput>({
    currency: 'ETB',
    loanAmount: 500000,
    interestRateAnnual: 16.5,
    loanTenureYears: 5,
    loanTenureMonths: 0,
    interestType: 'reducing',
    extraMonthlyPayment: 0,
    paymentFrequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
  });

  // Calculate Amortization & Key metrics
  const results: LoanCalculationResult = useMemo(() => {
    const P = Math.max(0, input.loanAmount);
    const rAnnual = Math.max(0, input.interestRateAnnual) / 100;
    const totalMonths = Math.max(1, (input.loanTenureYears * 12) + input.loanTenureMonths);
    const rMonthly = rAnnual / 12;
    const extra = Math.max(0, input.extraMonthlyPayment);

    if (P === 0) {
      return {
        monthlyPayment: 0,
        totalPrincipal: 0,
        totalInterest: 0,
        totalPayment: 0,
        payoffPeriodMonths: 0,
        payoffDate: input.startDate,
        interestSavedWithExtra: 0,
        monthsSavedWithExtra: 0,
        amortizationSchedule: [],
      };
    }

    // Standard Monthly EMI calculation
    let baseMonthlyPayment = 0;
    if (input.interestType === 'reducing') {
      if (rMonthly === 0) {
        baseMonthlyPayment = P / totalMonths;
      } else {
        baseMonthlyPayment = (P * rMonthly * Math.pow(1 + rMonthly, totalMonths)) / (Math.pow(1 + rMonthly, totalMonths) - 1);
      }
    } else {
      // Flat Rate: Total Interest = P * rAnnual * (totalMonths / 12)
      const totalFlatInterest = P * rAnnual * (totalMonths / 12);
      baseMonthlyPayment = (P + totalFlatInterest) / totalMonths;
    }

    // Generate Amortization Schedule (with extra payment)
    const schedule: AmortizationRow[] = [];
    let currentBalance = P;
    let cumInterest = 0;
    let cumPrincipal = 0;
    const start = new Date(input.startDate || Date.now());

    let period = 1;
    while (currentBalance > 0.01 && period <= totalMonths * 2) {
      const rowDate = new Date(start);
      rowDate.setMonth(start.getMonth() + period - 1);
      const dateStr = rowDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      let interestForMonth = 0;
      let principalForMonth = 0;

      if (input.interestType === 'reducing') {
        interestForMonth = currentBalance * rMonthly;
        principalForMonth = Math.min(currentBalance, (baseMonthlyPayment - interestForMonth) + extra);
      } else {
        // Flat rate per month
        interestForMonth = (P * rAnnual) / 12;
        principalForMonth = Math.min(currentBalance, (P / totalMonths) + extra);
      }

      const totalMonthlyPay = principalForMonth + interestForMonth;
      const startBal = currentBalance;
      currentBalance = Math.max(0, currentBalance - principalForMonth);
      cumInterest += interestForMonth;
      cumPrincipal += principalForMonth;

      schedule.push({
        period,
        date: dateStr,
        startingBalance: startBal,
        monthlyPayment: totalMonthlyPay,
        principalPaid: principalForMonth,
        interestPaid: interestForMonth,
        extraPayment: extra,
        endingBalance: currentBalance,
        cumulativeInterest: cumInterest,
        cumulativePrincipal: cumPrincipal,
      });

      if (currentBalance <= 0) break;
      period++;
    }

    // Baseline calculation without extra payments (to calculate interest saved)
    let baselineTotalInterest = 0;
    if (input.interestType === 'reducing') {
      baselineTotalInterest = Math.max(0, (baseMonthlyPayment * totalMonths) - P);
    } else {
      baselineTotalInterest = P * rAnnual * (totalMonths / 12);
    }

    const payoffPeriodMonths = schedule.length;
    const monthsSavedWithExtra = Math.max(0, totalMonths - payoffPeriodMonths);
    const interestSavedWithExtra = Math.max(0, baselineTotalInterest - cumInterest);

    const payoffDateObj = new Date(start);
    payoffDateObj.setMonth(start.getMonth() + payoffPeriodMonths);
    const payoffDate = payoffDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    return {
      monthlyPayment: baseMonthlyPayment,
      totalPrincipal: P,
      totalInterest: cumInterest,
      totalPayment: P + cumInterest,
      payoffPeriodMonths,
      payoffDate,
      interestSavedWithExtra,
      monthsSavedWithExtra,
      amortizationSchedule: schedule,
    };
  }, [input]);

  // Aggregate yearly amortization
  const yearlySchedule = useMemo(() => {
    const years: Record<string, { year: string; principalPaid: number; interestPaid: number; endingBalance: number }> = {};
    results.amortizationSchedule.forEach((row) => {
      const yr = row.date.split(' ')[1] || 'Year';
      if (!years[yr]) {
        years[yr] = { year: yr, principalPaid: 0, interestPaid: 0, endingBalance: row.endingBalance };
      }
      years[yr].principalPaid += row.principalPaid;
      years[yr].interestPaid += row.interestPaid;
      years[yr].endingBalance = row.endingBalance;
    });
    return Object.values(years);
  }, [results.amortizationSchedule]);

  const currSymbol = SUPPORTED_CURRENCIES.find(c => c.code === input.currency)?.symbol || input.currency;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const principalRatio = results.totalPayment > 0 ? (results.totalPrincipal / results.totalPayment) * 100 : 100;
  const interestRatio = 100 - principalRatio;

  const handleCopySummary = () => {
    triggerHaptic('light');
    const text = `
HABESHAWI LOAN SUMMARY
-------------------------
Currency: ${input.currency}
Loan Amount (ዋና ብድር): ${currSymbol} ${formatMoney(results.totalPrincipal)}
Annual Interest Rate (ወለድ): ${input.interestRateAnnual}% (${input.interestType === 'reducing' ? 'Reducing Balance EMI' : 'Flat Rate'})
Loan Term: ${input.loanTenureYears} Years ${input.loanTenureMonths ? `${input.loanTenureMonths} Months` : ''}
-------------------------
Monthly Payment (ወርሃዊ ክፍያ): ${currSymbol} ${formatMoney(results.monthlyPayment)}
Total Interest Payable (ጠቅላላ ወለድ): ${currSymbol} ${formatMoney(results.totalInterest)}
Total Payment (ጠቅላላ ተመላሽ): ${currSymbol} ${formatMoney(results.totalPayment)}
Estimated Payoff Date: ${results.payoffDate}
${input.extraMonthlyPayment > 0 ? `Extra Payment: ${currSymbol} ${formatMoney(input.extraMonthlyPayment)}/mo (Saved: ${currSymbol} ${formatMoney(results.interestSavedWithExtra)} & ${results.monthsSavedWithExtra} months)` : ''}
Generated by Habeshawi OS Calculator
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Hero Metric */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#1c1611] via-[#14100c] to-[#0d0a08] border-amber-500/30 shadow-amber-950/40' 
          : 'bg-gradient-to-br from-amber-50 via-white to-amber-100/40 border-amber-400/50 shadow-amber-500/10'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                የብድር እና የወለድ ማስያ
              </span>
              <span className="text-xs text-stone-400 font-mono">EMI & Amortization Engine</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
              Loan & Mortgage Calculator
            </h2>
          </div>

          {/* Currency & Copy */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={input.currency}
              onChange={(e) => setInput({ ...input, currency: e.target.value })}
              className={`py-2 px-3 rounded-xl text-xs font-bold font-mono outline-none border cursor-pointer ${
                isDarkMode ? 'bg-[#211a14] border-stone-700 text-amber-300' : 'bg-white border-amber-300 text-stone-900 shadow-xs'
              }`}
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>

            <button
              onClick={handleCopySummary}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                copied ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Primary Results Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-gradient-to-br from-amber-950/40 to-yellow-950/20 border-amber-500/40' : 'bg-amber-50 border-amber-300 shadow-xs'
          }`}>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              ወርሃዊ ክፍያ • Monthly EMI
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
              <span className="text-sm font-normal mr-1">{currSymbol}</span>
              {formatMoney(results.monthlyPayment + (input.extraMonthlyPayment || 0))}
            </div>
            {input.extraMonthlyPayment > 0 && (
              <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                Base: {formatMoney(results.monthlyPayment)} + Extra: {formatMoney(input.extraMonthlyPayment)}
              </div>
            )}
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-black/40 border-stone-800' : 'bg-white border-stone-200 shadow-xs'
          }`}>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              አጠቃላይ ወለድ • Total Interest
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1">
              <span className="text-xs font-normal mr-1">{currSymbol}</span>
              {formatMoney(results.totalInterest)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-mono">
              {interestRatio.toFixed(1)}% of total payment
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-black/40 border-stone-800' : 'bg-white border-stone-200 shadow-xs'
          }`}>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              ጠቅላላ ክፍያ • Total Repayment
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
              <span className="text-xs font-normal text-amber-500 mr-1">{currSymbol}</span>
              {formatMoney(results.totalPayment)}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-mono">
              Payoff: {results.payoffDate}
            </div>
          </div>
        </div>

        {/* Visual Loan-to-Interest Ratio Bar */}
        <div className="mt-5 pt-4 border-t border-amber-500/20">
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              ዋና ብድር (Principal): {principalRatio.toFixed(1)}% ({currSymbol} {formatMoney(results.totalPrincipal)})
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              ወለድ (Interest): {interestRatio.toFixed(1)}% ({currSymbol} {formatMoney(results.totalInterest)})
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-stone-800 overflow-hidden flex shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500" 
              style={{ width: `${principalRatio}%` }} 
            />
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500" 
              style={{ width: `${interestRatio}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Principal Loan Amount */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-2">
              የብድር መጠን • Loan Amount (Principal)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 font-bold font-mono">
                {currSymbol}
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={input.loanAmount || ''}
                onChange={(e) => setInput({ ...input, loanAmount: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-12 pr-4 py-3 rounded-xl text-xl font-bold font-mono outline-none border focus:ring-2 focus:ring-amber-500 transition-all ${
                  isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
                placeholder="500000"
              />
            </div>

            {/* Quick Loan Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[100000, 250000, 500000, 1000000, 2000000, 5000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setInput({ ...input, loanAmount: amt });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    input.loanAmount === amt
                      ? 'bg-amber-500 text-stone-950 border-amber-400'
                      : isDarkMode
                        ? 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
                        : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {formatMoney(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate & Loan Term Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Interest Rate */}
            <div className={`p-4 rounded-2xl border ${
              isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
            }`}>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                ዓመታዊ ወለድ • Interest Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={input.interestRateAnnual || ''}
                  onChange={(e) => setInput({ ...input, interestRateAnnual: parseFloat(e.target.value) || 0 })}
                  className={`w-full p-2.5 rounded-xl text-lg font-bold font-mono outline-none border focus:ring-2 focus:ring-amber-500 ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                  placeholder="16.5"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400 font-bold">
                  %
                </div>
              </div>
              {/* Quick rate badges */}
              <div className="flex gap-1.5 mt-2">
                {[9.5, 14.5, 16.5, 18.0, 21.0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setInput({ ...input, interestRateAnnual: rate })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      input.interestRateAnnual === rate ? 'bg-amber-500 text-black border-amber-400 font-bold' : 'text-stone-400 border-stone-700'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Tenure Years / Months */}
            <div className={`p-4 rounded-2xl border ${
              isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
            }`}>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                የመክፈያ ጊዜ • Loan Tenure
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={input.loanTenureYears}
                    onChange={(e) => setInput({ ...input, loanTenureYears: parseInt(e.target.value) || 0 })}
                    className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                      isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                    }`}
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">Years (ዓመት)</span>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={input.loanTenureMonths}
                    onChange={(e) => setInput({ ...input, loanTenureMonths: parseInt(e.target.value) || 0 })}
                    className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                      isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                    }`}
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">Months (ወር)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interest Type & Extra Payment Controls */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                የወለድ ስሌት ዓይነት (Calculation Method)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInput({ ...input, interestType: 'reducing' })}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                    input.interestType === 'reducing'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <div>Reducing Balance (EMI)</div>
                  <div className="text-[10px] font-normal opacity-70">Standard bank amortization</div>
                </button>

                <button
                  type="button"
                  onClick={() => setInput({ ...input, interestType: 'flat' })}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                    input.interestType === 'flat'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  <div>Flat Rate Interest</div>
                  <div className="text-[10px] font-normal opacity-70">Fixed annual percentage</div>
                </button>
              </div>
            </div>

            {/* Extra Monthly Payment Simulation */}
            <div className="pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> ተጨማሪ ወርሃዊ ክፍያ (Extra Monthly Payment)
                </label>
                {input.extraMonthlyPayment > 0 && (
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    Saves {currSymbol} {formatMoney(results.interestSavedWithExtra)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="500"
                value={input.extraMonthlyPayment || ''}
                onChange={(e) => setInput({ ...input, extraMonthlyPayment: parseFloat(e.target.value) || 0 })}
                className={`w-full p-2.5 rounded-xl text-sm font-mono font-semibold border outline-none ${
                  isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                }`}
                placeholder="Optional extra payment e.g. 2,000"
              />
              {input.extraMonthlyPayment > 0 && (
                <p className="text-[11px] text-emerald-400 font-mono mt-1">
                  ⚡ Pays off {results.monthsSavedWithExtra} months earlier! New payoff date: {results.payoffDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Form: Insights & Quick Scenarios */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-5 rounded-3xl border shadow-xl ${
            isDarkMode ? 'bg-[#120f0c] border-amber-500/40 text-stone-100' : 'bg-[#fcfaf5] border-amber-400/60 text-stone-900'
          }`}>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Landmark className="w-4 h-4" /> የብድር ማጠቃለያ • Loan Insights
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">ዋና ብድር (Principal):</span>
                <span className="font-bold">{currSymbol} {formatMoney(results.totalPrincipal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">የወለድ መጠን (Interest Rate):</span>
                <span className="font-bold">{input.interestRateAnnual}% / year</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">የክፍያ ቆይታ (Total Periods):</span>
                <span className="font-bold">{results.payoffPeriodMonths} Months</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400">አጠቃላይ የወለድ ክፍያ (Total Interest):</span>
                <span className="font-bold text-rose-400">{currSymbol} {formatMoney(results.totalInterest)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-800 text-sm font-bold text-amber-400">
                <span>አጠቃላይ ተመላሽ (Total Repaid):</span>
                <span>{currSymbol} {formatMoney(results.totalPayment)}</span>
              </div>
              <div className="flex justify-between py-1 text-stone-400">
                <span>የመጨረሻ ክፍያ ቀን (Payoff Date):</span>
                <span className="font-bold text-emerald-400">{results.payoffDate}</span>
              </div>
            </div>
          </div>

          {/* Toggle Amortization Schedule Table */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              setShowAmortization(!showAmortization);
            }}
            className={`w-full p-4 rounded-2xl border font-bold text-xs flex items-center justify-between transition-all ${
              showAmortization
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : isDarkMode
                  ? 'bg-[#14100c] border-stone-800 text-amber-400 hover:bg-stone-900'
                  : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
            }`}
          >
            <span>{showAmortization ? 'Hide Amortization Schedule' : 'View Full Amortization Schedule (የክፍያ ሰንጠረዥ)'}</span>
            {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Amortization Schedule Table */}
      <AnimatePresence>
        {showAmortization && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-5 rounded-3xl border shadow-xl overflow-hidden ${
              isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> የክፍያ ሰንጠረዥ • Amortization Table
              </h3>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800">
                <button
                  onClick={() => setAmortizationView('yearly')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    amortizationView === 'yearly' ? 'bg-amber-500 text-black' : 'text-stone-400'
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setAmortizationView('monthly')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    amortizationView === 'monthly' ? 'bg-amber-500 text-black' : 'text-stone-400'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto font-mono text-xs">
              {amortizationView === 'yearly' ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 pb-2">
                      <th className="py-2">Year</th>
                      <th className="py-2">Principal Paid</th>
                      <th className="py-2">Interest Paid</th>
                      <th className="py-2">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlySchedule.map((row, idx) => (
                      <tr key={idx} className="border-b border-stone-800/40 hover:bg-stone-900/30">
                        <td className="py-2 font-bold text-amber-400">{row.year}</td>
                        <td className="py-2 text-stone-200">{currSymbol} {formatMoney(row.principalPaid)}</td>
                        <td className="py-2 text-rose-400">{currSymbol} {formatMoney(row.interestPaid)}</td>
                        <td className="py-2 text-emerald-400">{currSymbol} {formatMoney(row.endingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 pb-2">
                      <th className="py-2">#</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Payment</th>
                      <th className="py-2">Principal</th>
                      <th className="py-2">Interest</th>
                      <th className="py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.amortizationSchedule.map((row) => (
                      <tr key={row.period} className="border-b border-stone-800/40 hover:bg-stone-900/30">
                        <td className="py-1.5 text-stone-500">{row.period}</td>
                        <td className="py-1.5 font-bold text-stone-300">{row.date}</td>
                        <td className="py-1.5 text-amber-400 font-bold">{currSymbol} {formatMoney(row.monthlyPayment)}</td>
                        <td className="py-1.5 text-stone-200">{currSymbol} {formatMoney(row.principalPaid)}</td>
                        <td className="py-1.5 text-rose-400">{currSymbol} {formatMoney(row.interestPaid)}</td>
                        <td className="py-1.5 text-emerald-400">{currSymbol} {formatMoney(row.endingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoanCalculator;
