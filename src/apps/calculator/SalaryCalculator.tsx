/**
 * @file SalaryCalculator.tsx
 * @description Ethiopian & Global Salary, Overtime (OT), Allowances & Payslip Calculator.
 * Implements Proclamation No. 979/2016 progressive tax brackets, standard overtime rates,
 * employee/employer pension, and detailed take-home breakdown.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  Clock, 
  Briefcase, 
  Percent, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Copy, 
  Check, 
  TrendingUp, 
  ShieldAlert, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building,
  Car,
  Utensils,
  Award,
  Wallet
} from 'lucide-react';
import { 
  SalaryCalculationInput, 
  SalaryCalculationResult, 
  SUPPORTED_CURRENCIES, 
  ETHIOPIAN_TAX_BRACKETS 
} from './types';
import { triggerHaptic } from '../../utils/haptics';

interface SalaryCalculatorProps {
  isDarkMode?: boolean;
}

export const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({ isDarkMode = true }) => {
  const [copied, setCopied] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<'allowances' | 'ot' | 'deductions' | 'summary' | null>('allowances');

  // Input states with realistic defaults (e.g. 25,000 ETB monthly)
  const [input, setInput] = useState<SalaryCalculationInput>({
    currency: 'ETB',
    payFrequency: 'monthly',
    basicSalary: 25000,
    // Allowances
    housingAllowance: 5000,
    isHousingTaxable: true,
    transportAllowance: 3000,
    isTransportTaxable: false,
    transportTaxExemptThreshold: 2200,
    applyTransportExemption: true,
    foodAllowance: 2000,
    isFoodTaxable: true,
    responsibilityAllowance: 1500,
    isResponsibilityTaxable: true,
    otherAllowances: 0,
    isOtherTaxable: true,
    // Overtime
    standardWorkHoursPerDay: 8,
    standardWorkDaysPerMonth: 26,
    daytimeOtHours: 8,
    nighttimeOtHours: 4,
    weekendOtHours: 6,
    holidayOtHours: 0,
    // Tax & Pension
    taxMode: 'ethiopian',
    customFlatTaxRate: 15,
    enableEmployeePension: true,
    employeePensionRate: 7,
    enableEmployerPension: true,
    employerPensionRate: 11,
    costSharingDeduction: 0,
    healthInsuranceDeduction: 0,
    otherDeductions: 500,
  });

  // Calculate salary and tax
  const results: SalaryCalculationResult = useMemo(() => {
    const basic = Math.max(0, input.basicSalary);
    
    // Allowances
    const housing = Math.max(0, input.housingAllowance);
    const transport = Math.max(0, input.transportAllowance);
    const food = Math.max(0, input.foodAllowance);
    const responsibility = Math.max(0, input.responsibilityAllowance);
    const other = Math.max(0, input.otherAllowances);

    // Transport exemption in Ethiopia (up to 2,200 ETB or 25% of basic salary)
    let taxableTransport = transport;
    let nonTaxableTransport = 0;
    if (input.applyTransportExemption && input.currency === 'ETB') {
      const maxExemption = Math.max(0, Math.min(transport, Math.min(input.transportTaxExemptThreshold, basic * 0.25)));
      nonTaxableTransport = maxExemption;
      taxableTransport = Math.max(0, transport - maxExemption);
    } else if (!input.isTransportTaxable) {
      nonTaxableTransport = transport;
      taxableTransport = 0;
    }

    const taxableHousing = input.isHousingTaxable ? housing : 0;
    const nonTaxableHousing = input.isHousingTaxable ? 0 : housing;

    const taxableFood = input.isFoodTaxable ? food : 0;
    const nonTaxableFood = input.isFoodTaxable ? 0 : food;

    const taxableResp = input.isResponsibilityTaxable ? responsibility : 0;
    const nonTaxableResp = input.isResponsibilityTaxable ? 0 : responsibility;

    const taxableOther = input.isOtherTaxable ? other : 0;
    const nonTaxableOther = input.isOtherTaxable ? 0 : other;

    const totalAllowances = housing + transport + food + responsibility + other;
    const taxableAllowances = taxableHousing + taxableTransport + taxableFood + taxableResp + taxableOther;
    const nonTaxableAllowances = nonTaxableHousing + nonTaxableTransport + nonTaxableFood + nonTaxableResp + nonTaxableOther;

    // Overtime Calculations
    const monthlyTotalHours = (input.standardWorkDaysPerMonth || 26) * (input.standardWorkHoursPerDay || 8);
    const hourlyRate = monthlyTotalHours > 0 ? basic / monthlyTotalHours : 0;

    const daytimeOtPay = (input.daytimeOtHours || 0) * hourlyRate * 1.25;
    const nighttimeOtPay = (input.nighttimeOtHours || 0) * hourlyRate * 1.50;
    const weekendOtPay = (input.weekendOtHours || 0) * hourlyRate * 2.00;
    const holidayOtPay = (input.holidayOtHours || 0) * hourlyRate * 2.50;
    
    const totalOtHours = (input.daytimeOtHours || 0) + (input.nighttimeOtHours || 0) + (input.weekendOtHours || 0) + (input.holidayOtHours || 0);
    const totalOtPay = daytimeOtPay + nighttimeOtPay + weekendOtPay + holidayOtPay;

    // Gross & Taxable Income
    const grossSalary = basic + totalAllowances + totalOtPay;
    // In Ethiopian tax law, OT and taxable allowances are included in taxable employment income
    const taxableIncome = basic + taxableAllowances + totalOtPay;

    // Income Tax
    let incomeTax = 0;
    if (input.taxMode === 'ethiopian') {
      const bracket = ETHIOPIAN_TAX_BRACKETS.find(b => taxableIncome >= b.min && taxableIncome <= b.max);
      if (bracket) {
        incomeTax = Math.max(0, (taxableIncome * bracket.rate) - bracket.deduction);
      }
    } else if (input.taxMode === 'flat') {
      incomeTax = Math.max(0, (taxableIncome * (input.customFlatTaxRate || 0)) / 100);
    }

    const effectiveTaxRate = taxableIncome > 0 ? (incomeTax / taxableIncome) * 100 : 0;

    // Pension (computed on Basic Salary in Ethiopia)
    const employeePension = input.enableEmployeePension ? basic * (input.employeePensionRate / 100) : 0;
    const employerPension = input.enableEmployerPension ? basic * (input.employerPensionRate / 100) : 0;

    // Other Deductions
    const otherDeds = (input.costSharingDeduction || 0) + (input.healthInsuranceDeduction || 0) + (input.otherDeductions || 0);
    const totalDeductions = incomeTax + employeePension + otherDeds;

    // Net Salary
    const netSalary = Math.max(0, grossSalary - totalDeductions);
    const employerTotalCost = grossSalary + employerPension;

    return {
      basicSalary: basic,
      totalAllowances,
      taxableAllowances,
      nonTaxableAllowances,
      totalOtHours,
      hourlyRate,
      daytimeOtPay,
      nighttimeOtPay,
      weekendOtPay,
      holidayOtPay,
      totalOtPay,
      grossSalary,
      taxableIncome,
      incomeTax,
      effectiveTaxRate,
      employeePension,
      employerPension,
      totalDeductions,
      netSalary,
      employerTotalCost,
    };
  }, [input]);

  const currSymbol = SUPPORTED_CURRENCIES.find(c => c.code === input.currency)?.symbol || input.currency;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleCopySummary = () => {
    triggerHaptic('light');
    const text = `
HABESHAWI SALARY PAYSLIP
-------------------------
Currency: ${input.currency}
Basic Salary (መሰረታዊ ደመወዝ): ${currSymbol} ${formatMoney(results.basicSalary)}
Allowances (አጠቃላይ አበል): ${currSymbol} ${formatMoney(results.totalAllowances)}
Overtime Pay (የትርፍ ሰዓት ክፍያ): ${currSymbol} ${formatMoney(results.totalOtPay)} (${results.totalOtHours} hrs)
-------------------------
GROSS SALARY (ጠቅላላ ደመወዝ): ${currSymbol} ${formatMoney(results.grossSalary)}
Taxable Income: ${currSymbol} ${formatMoney(results.taxableIncome)}
Income Tax (የገቢ ግብር): -${currSymbol} ${formatMoney(results.incomeTax)}
Employee Pension 7% (የሰራተኛ ጡረታ): -${currSymbol} ${formatMoney(results.employeePension)}
Other Deductions: -${currSymbol} ${formatMoney(input.otherDeductions + input.costSharingDeduction + input.healthInsuranceDeduction)}
TOTAL DEDUCTIONS (ጠቅላላ ተቀናሽ): -${currSymbol} ${formatMoney(results.totalDeductions)}
-------------------------
NET TAKE-HOME PAY (የተጣራ ደመወዝ): ${currSymbol} ${formatMoney(results.netSalary)}
Employer Pension 11%: ${currSymbol} ${formatMoney(results.employerPension)}
Total Employer Cost: ${currSymbol} ${formatMoney(results.employerTotalCost)}
Generated by Habeshawi OS Calculator
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    triggerHaptic('medium');
    setInput(prev => ({
      ...prev,
      basicSalary: 20000,
      housingAllowance: 0,
      transportAllowance: 0,
      foodAllowance: 0,
      responsibilityAllowance: 0,
      otherAllowances: 0,
      daytimeOtHours: 0,
      nighttimeOtHours: 0,
      weekendOtHours: 0,
      holidayOtHours: 0,
      costSharingDeduction: 0,
      healthInsuranceDeduction: 0,
      otherDeductions: 0,
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Summary Header */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#1c1611] via-[#14100c] to-[#0d0a08] border-amber-500/30 shadow-amber-950/40' 
          : 'bg-gradient-to-br from-amber-50 via-white to-amber-100/40 border-amber-400/50 shadow-amber-500/10'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                የደመወዝ እና አበል ማስያ
              </span>
              <span className="text-xs text-stone-400 font-mono">Proclamation No. 979/2016</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
              Salary & Overtime Calculator
            </h2>
          </div>

          {/* Currency Selector & Reset */}
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
              onClick={handleReset}
              className={`p-2 rounded-xl border transition-colors ${
                isDarkMode ? 'border-stone-700 hover:bg-stone-800 text-stone-400' : 'border-stone-300 hover:bg-stone-100 text-stone-600'
              }`}
              title="Reset values"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopySummary}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Payslip'}</span>
            </button>
          </div>
        </div>

        {/* Primary Take-Home Highlight Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-black/40 border-stone-800' : 'bg-white/90 border-stone-200 shadow-xs'
          }`}>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              ጠቅላላ ደመወዝ • Gross Salary
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
              <span className="text-xs font-normal text-amber-500 mr-1">{currSymbol}</span>
              {formatMoney(results.grossSalary)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-mono">
              Basic: {formatMoney(results.basicSalary)} + Allowances: {formatMoney(results.totalAllowances)}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'
          }`}>
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
              ጠቅላላ ተቀናሽ • Total Deductions
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-500 mt-1">
              <span className="text-xs font-normal mr-1">-{currSymbol}</span>
              {formatMoney(results.totalDeductions)}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 font-mono">
              Tax: {formatMoney(results.incomeTax)} | Pension: {formatMoney(results.employeePension)}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-emerald-950/50 to-teal-900/30 border-emerald-500/40 shadow-lg shadow-emerald-950/30' 
              : 'bg-emerald-50 border-emerald-300 shadow-xs'
          }`}>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> የተጣራ ደመወዝ • Net Pay
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
              <span className="text-sm font-normal mr-1">{currSymbol}</span>
              {formatMoney(results.netSalary)}
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1 font-mono">
              Eff. Tax Rate: {results.effectiveTaxRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Input Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Base Salary Input Card */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-2">
              መሰረታዊ ደመወዝ • Basic Monthly Salary
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 font-bold font-mono">
                {currSymbol}
              </div>
              <input
                type="number"
                min="0"
                step="100"
                value={input.basicSalary || ''}
                onChange={(e) => setInput({ ...input, basicSalary: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-12 pr-4 py-3 rounded-xl text-xl font-bold font-mono outline-none border focus:ring-2 focus:ring-amber-500 transition-all ${
                  isDarkMode 
                    ? 'bg-[#1c1611] border-stone-700 text-white' 
                    : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
                placeholder="25000"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[5000, 10000, 20000, 35000, 50000, 75000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setInput({ ...input, basicSalary: amt });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    input.basicSalary === amt
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

          {/* Accordion 1: Allowances (የአበል ክፍያዎች) */}
          <div className={`rounded-2xl border overflow-hidden transition-all ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveAccordion(activeAccordion === 'allowances' ? null : 'allowances');
              }}
              className="w-full p-4 flex items-center justify-between text-left font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-500" />
                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
                  አበሎች • Allowances
                </span>
                <span className="text-xs font-mono font-semibold text-amber-500 ml-1">
                  ({currSymbol} {formatMoney(results.totalAllowances)})
                </span>
              </div>
              {activeAccordion === 'allowances' ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            <AnimatePresence>
              {activeAccordion === 'allowances' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 pt-0 space-y-3 border-t border-stone-800/50"
                >
                  {/* Housing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-xs font-medium text-stone-400 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-stone-500" /> የቤት አበል (Housing)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={input.housingAllowance || ''}
                        onChange={(e) => setInput({ ...input, housingAllowance: parseFloat(e.target.value) || 0 })}
                        className={`w-full mt-1 p-2 rounded-xl text-sm font-mono font-semibold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                        }`}
                        placeholder="0"
                      />
                    </div>

                    {/* Transport with Ethiopian Exemption */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-stone-400 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-stone-500" /> የትራንስፖርት አበል (Transport)
                        </label>
                        <label className="text-[10px] text-amber-400 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={input.applyTransportExemption}
                            onChange={(e) => setInput({ ...input, applyTransportExemption: e.target.checked })}
                            className="rounded accent-amber-500"
                          />
                          <span>Tax-Exempt Rule</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={input.transportAllowance || ''}
                        onChange={(e) => setInput({ ...input, transportAllowance: parseFloat(e.target.value) || 0 })}
                        className={`w-full mt-1 p-2 rounded-xl text-sm font-mono font-semibold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                        }`}
                        placeholder="0"
                      />
                      {input.applyTransportExemption && input.currency === 'ETB' && (
                        <p className="text-[10px] text-stone-500 mt-0.5">
                          Exempt: min(2,200 ETB, 25% of basic) = {formatMoney(results.nonTaxableAllowances)} ETB
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Food & Position */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-xs font-medium text-stone-400 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-stone-500" /> የምግብ አበል (Food)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={input.foodAllowance || ''}
                        onChange={(e) => setInput({ ...input, foodAllowance: parseFloat(e.target.value) || 0 })}
                        className={`w-full mt-1 p-2 rounded-xl text-sm font-mono font-semibold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                        }`}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-stone-400 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-stone-500" /> የኃላፊነት አበል (Position/Responsibility)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={input.responsibilityAllowance || ''}
                        onChange={(e) => setInput({ ...input, responsibilityAllowance: parseFloat(e.target.value) || 0 })}
                        className={`w-full mt-1 p-2 rounded-xl text-sm font-mono font-semibold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Other Allowances */}
                  <div>
                    <label className="text-xs font-medium text-stone-400">
                      ሌሎች አበሎች (Other Allowances)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={input.otherAllowances || ''}
                      onChange={(e) => setInput({ ...input, otherAllowances: parseFloat(e.target.value) || 0 })}
                      className={`w-full mt-1 p-2 rounded-xl text-sm font-mono font-semibold border outline-none ${
                        isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                      }`}
                      placeholder="0"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 2: Overtime (OT) Engine */}
          <div className={`rounded-2xl border overflow-hidden transition-all ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveAccordion(activeAccordion === 'ot' ? null : 'ot');
              }}
              className="w-full p-4 flex items-center justify-between text-left font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
                  የትርፍ ሰዓት ስራ • Overtime (OT)
                </span>
                <span className="text-xs font-mono font-semibold text-amber-500 ml-1">
                  ({results.totalOtHours} hrs • {currSymbol} {formatMoney(results.totalOtPay)})
                </span>
              </div>
              {activeAccordion === 'ot' ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            <AnimatePresence>
              {activeAccordion === 'ot' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 pt-0 space-y-4 border-t border-stone-800/50"
                >
                  {/* Working Parameters */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400">Hours/Day (መደበኛ ሰዓት)</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={input.standardWorkHoursPerDay}
                        onChange={(e) => setInput({ ...input, standardWorkHoursPerDay: parseFloat(e.target.value) || 8 })}
                        className={`w-full mt-1 p-1.5 rounded-lg text-xs font-mono font-bold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-white border-stone-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400">Work Days/Month (የስራ ቀናት)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={input.standardWorkDaysPerMonth}
                        onChange={(e) => setInput({ ...input, standardWorkDaysPerMonth: parseFloat(e.target.value) || 26 })}
                        className={`w-full mt-1 p-1.5 rounded-lg text-xs font-mono font-bold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-white border-stone-300'
                        }`}
                      />
                    </div>
                    <div className="col-span-2 text-[11px] font-mono text-amber-500">
                      Standard Hourly Rate: {currSymbol} {results.hourlyRate.toFixed(2)}/hr
                    </div>
                  </div>

                  {/* 4 Standard Overtime Categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Daytime 1.25x */}
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#1c1611] border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-stone-300">ቀን (6am - 10pm)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400 font-bold">1.25x</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="0"
                          value={input.daytimeOtHours || ''}
                          onChange={(e) => setInput({ ...input, daytimeOtHours: parseFloat(e.target.value) || 0 })}
                          className={`w-20 p-1.5 rounded-lg text-sm font-mono font-bold border outline-none ${
                            isDarkMode ? 'bg-black/50 border-stone-700 text-white' : 'bg-white border-stone-300'
                          }`}
                          placeholder="0"
                        />
                        <span className="text-xs text-stone-400 font-mono">hrs = {currSymbol}{formatMoney(results.daytimeOtPay)}</span>
                      </div>
                    </div>

                    {/* Nighttime 1.50x */}
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#1c1611] border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-stone-300">ሌሊት (10pm - 6am)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-400 font-bold">1.50x</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="0"
                          value={input.nighttimeOtHours || ''}
                          onChange={(e) => setInput({ ...input, nighttimeOtHours: parseFloat(e.target.value) || 0 })}
                          className={`w-20 p-1.5 rounded-lg text-sm font-mono font-bold border outline-none ${
                            isDarkMode ? 'bg-black/50 border-stone-700 text-white' : 'bg-white border-stone-300'
                          }`}
                          placeholder="0"
                        />
                        <span className="text-xs text-stone-400 font-mono">hrs = {currSymbol}{formatMoney(results.nighttimeOtPay)}</span>
                      </div>
                    </div>

                    {/* Weekend 2.0x */}
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#1c1611] border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-stone-300">ሳምንት እረፍት (Weekend)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-bold">2.00x</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="0"
                          value={input.weekendOtHours || ''}
                          onChange={(e) => setInput({ ...input, weekendOtHours: parseFloat(e.target.value) || 0 })}
                          className={`w-20 p-1.5 rounded-lg text-sm font-mono font-bold border outline-none ${
                            isDarkMode ? 'bg-black/50 border-stone-700 text-white' : 'bg-white border-stone-300'
                          }`}
                          placeholder="0"
                        />
                        <span className="text-xs text-stone-400 font-mono">hrs = {currSymbol}{formatMoney(results.weekendOtPay)}</span>
                      </div>
                    </div>

                    {/* Holiday 2.50x */}
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#1c1611] border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-stone-300">በዓላት (Public Holiday)</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-400 font-bold">2.50x</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="0"
                          value={input.holidayOtHours || ''}
                          onChange={(e) => setInput({ ...input, holidayOtHours: parseFloat(e.target.value) || 0 })}
                          className={`w-20 p-1.5 rounded-lg text-sm font-mono font-bold border outline-none ${
                            isDarkMode ? 'bg-black/50 border-stone-700 text-white' : 'bg-white border-stone-300'
                          }`}
                          placeholder="0"
                        />
                        <span className="text-xs text-stone-400 font-mono">hrs = {currSymbol}{formatMoney(results.holidayOtPay)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Accordion 3: Taxes & Pension (የግብር እና ጡረታ ተቀናሽ) */}
          <div className={`rounded-2xl border overflow-hidden transition-all ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setActiveAccordion(activeAccordion === 'deductions' ? null : 'deductions');
              }}
              className="w-full p-4 flex items-center justify-between text-left font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-500" />
                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
                  ግብር እና ተቀናሾች • Taxes & Deductions
                </span>
                <span className="text-xs font-mono font-semibold text-rose-400 ml-1">
                  (-{currSymbol} {formatMoney(results.totalDeductions)})
                </span>
              </div>
              {activeAccordion === 'deductions' ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            <AnimatePresence>
              {activeAccordion === 'deductions' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 pt-0 space-y-4 border-t border-stone-800/50"
                >
                  {/* Tax Mode Switch */}
                  <div>
                    <label className="text-xs font-semibold text-stone-400 block mb-2">
                      የገቢ ግብር ስሌት (Income Tax Schedule)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInput({ ...input, taxMode: 'ethiopian' })}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                          input.taxMode === 'ethiopian'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        <div>የኢትዮጵያ ግብር (7 Brackets)</div>
                        <div className="text-[10px] font-normal opacity-70">Proclamation 979/2016</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInput({ ...input, taxMode: 'flat' })}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                          input.taxMode === 'flat'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        <div>Custom Flat Tax (%)</div>
                        <div className="text-[10px] font-normal opacity-70">Custom percentage</div>
                      </button>
                    </div>

                    {input.taxMode === 'flat' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-stone-400">Flat Rate:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={input.customFlatTaxRate}
                          onChange={(e) => setInput({ ...input, customFlatTaxRate: parseFloat(e.target.value) || 0 })}
                          className={`w-20 p-1.5 rounded-lg text-xs font-mono font-bold border outline-none ${
                            isDarkMode ? 'bg-black/50 border-stone-700 text-white' : 'bg-white border-stone-300'
                          }`}
                        />
                        <span className="text-xs text-stone-400">%</span>
                      </div>
                    )}
                  </div>

                  {/* Pension Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#1c1611] border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-300">
                          የሰራተኛ ጡረታ (7% Pension)
                        </label>
                        <input
                          type="checkbox"
                          checked={input.enableEmployeePension}
                          onChange={(e) => setInput({ ...input, enableEmployeePension: e.target.checked })}
                          className="rounded accent-amber-500"
                        />
                      </div>
                      <p className="text-[11px] font-mono text-stone-400 mt-1">
                        Deduction: {currSymbol} {formatMoney(results.employeePension)}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#1c1611] border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-300">
                          የአሰሪ ጡረታ (11% Employer)
                        </label>
                        <input
                          type="checkbox"
                          checked={input.enableEmployerPension}
                          onChange={(e) => setInput({ ...input, enableEmployerPension: e.target.checked })}
                          className="rounded accent-amber-500"
                        />
                      </div>
                      <p className="text-[11px] font-mono text-stone-400 mt-1">
                        Employer Pays: {currSymbol} {formatMoney(results.employerPension)}
                      </p>
                    </div>
                  </div>

                  {/* Other Voluntary / Statutory Deductions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-stone-400">ኮስት ሼሪንግ (Cost Sharing)</label>
                      <input
                        type="number"
                        min="0"
                        value={input.costSharingDeduction || ''}
                        onChange={(e) => setInput({ ...input, costSharingDeduction: parseFloat(e.target.value) || 0 })}
                        className={`w-full mt-1 p-2 rounded-xl text-sm font-mono font-semibold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-400">ሌሎች ተቀናሾች (Loan / Iddir / Insurance)</label>
                      <input
                        type="number"
                        min="0"
                        value={input.otherDeductions || ''}
                        onChange={(e) => setInput({ ...input, otherDeductions: parseFloat(e.target.value) || 0 })}
                        className={`w-full mt-1 p-2 rounded-xl text-sm font-mono font-semibold border outline-none ${
                          isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Full Official Payslip Statement */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden font-sans ${
            isDarkMode 
              ? 'bg-[#120f0c] border-amber-500/40 text-stone-100 shadow-amber-950/40' 
              : 'bg-[#fcfaf5] border-amber-400/60 text-stone-900 shadow-stone-400/30'
          }`}>
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm tracking-tight">የክፍያ ወረቀት • Payslip Statement</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                MONTHLY
              </span>
            </div>

            {/* Detailed Line Items */}
            <div className="py-4 space-y-2.5 text-xs font-mono">
              {/* Earnings */}
              <div className="font-bold text-amber-500 uppercase text-[10px] tracking-wider pt-1">
                (+) ገቢዎች • EARNINGS
              </div>
              
              <div className="flex justify-between items-center text-stone-300">
                <span>መሰረታዊ ደመወዝ (Basic Salary)</span>
                <span className="font-bold">{formatMoney(results.basicSalary)}</span>
              </div>

              {results.totalAllowances > 0 && (
                <div className="flex justify-between items-center text-stone-300">
                  <span>አጠቃላይ አበሎች (Allowances)</span>
                  <span className="font-bold">{formatMoney(results.totalAllowances)}</span>
                </div>
              )}

              {results.totalOtPay > 0 && (
                <div className="flex justify-between items-center text-stone-300">
                  <span>የትርፍ ሰዓት ክፍያ ({results.totalOtHours} hrs OT)</span>
                  <span className="font-bold text-amber-400">+{formatMoney(results.totalOtPay)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-stone-800 font-bold text-sm text-amber-300">
                <span>ጠቅላላ ደመወዝ (GROSS SALARY)</span>
                <span>{currSymbol} {formatMoney(results.grossSalary)}</span>
              </div>

              {/* Deductions */}
              <div className="font-bold text-rose-400 uppercase text-[10px] tracking-wider pt-3">
                (-) ተቀናሾች • DEDUCTIONS
              </div>

              <div className="flex justify-between items-center text-stone-300">
                <span>የገቢ ግብር (Employment Income Tax)</span>
                <span className="text-rose-400 font-bold">-{formatMoney(results.incomeTax)}</span>
              </div>

              {input.enableEmployeePension && (
                <div className="flex justify-between items-center text-stone-300">
                  <span>የሰራተኛ ጡረታ 7% (Pension)</span>
                  <span className="text-rose-400 font-bold">-{formatMoney(results.employeePension)}</span>
                </div>
              )}

              {(input.costSharingDeduction > 0 || input.otherDeductions > 0) && (
                <div className="flex justify-between items-center text-stone-300">
                  <span>ሌሎች ተቀናሾች (Other Deds)</span>
                  <span className="text-rose-400 font-bold">
                    -{formatMoney(input.costSharingDeduction + input.otherDeductions)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-stone-800 font-bold text-rose-400">
                <span>ጠቅላላ ተቀናሽ (TOTAL DEDUCTIONS)</span>
                <span>-{currSymbol} {formatMoney(results.totalDeductions)}</span>
              </div>

              {/* Final Net Pay Highlight */}
              <div className={`p-4 rounded-2xl border mt-4 text-center ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 border-emerald-500/50 shadow-inner' 
                  : 'bg-emerald-50 border-emerald-300'
              }`}>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block font-sans">
                  የተጣራ ደመወዝ • NET TAKE-HOME PAY
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
                  {currSymbol} {formatMoney(results.netSalary)}
                </div>
              </div>

              {/* Employer Cost Footnote */}
              {input.enableEmployerPension && (
                <div className="pt-3 border-t border-stone-800 text-[11px] text-stone-400 flex justify-between">
                  <span>የአሰሪ አጠቃላይ ወጪ (Cost to Employer):</span>
                  <span className="font-bold text-stone-200">{currSymbol} {formatMoney(results.employerTotalCost)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ethiopian Tax Brackets Visual Reference Sheet */}
          {input.taxMode === 'ethiopian' && (
            <div className={`p-4 rounded-2xl border text-xs ${
              isDarkMode ? 'bg-[#14100c] border-stone-800 text-stone-400' : 'bg-white border-stone-200 text-stone-600'
            }`}>
              <span className="font-bold text-stone-300 block mb-2 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                የኢትዮጵያ የገቢ ግብር ደረጃዎች (Tax Brackets)
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between py-0.5 border-b border-stone-800/40">
                  <span>0 - 600 ETB</span>
                  <span className="text-emerald-400 font-bold">0% (ነፃ)</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-stone-800/40">
                  <span>601 - 1,650 ETB</span>
                  <span>10% (ded. 60)</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-stone-800/40">
                  <span>1,651 - 3,200 ETB</span>
                  <span>15% (ded. 142.50)</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-stone-800/40">
                  <span>3,201 - 5,250 ETB</span>
                  <span>20% (ded. 302.50)</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-stone-800/40">
                  <span>5,251 - 7,800 ETB</span>
                  <span>25% (ded. 565)</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-stone-800/40">
                  <span>7,801 - 10,900 ETB</span>
                  <span>30% (ded. 955)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>10,901+ ETB</span>
                  <span className="text-rose-400 font-bold">35% (ded. 1,500)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculator;
