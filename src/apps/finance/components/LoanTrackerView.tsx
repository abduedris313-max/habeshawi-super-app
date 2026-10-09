/**
 * @file LoanTrackerView.tsx
 * @description Loan & Debt Tracking Engine with real-time EMI calculation,
 * payment logging, amortization schedule simulator, and Debt Snowball vs. Avalanche payoff strategy.
 */

import React, { useState } from 'react';
import { 
  Landmark, 
  Plus, 
  Calculator, 
  TrendingDown, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { FinanceLoan, LoanPaymentRecord } from '../types';
import { 
  calculateMonthlyEmi, 
  generateAmortizationSchedule, 
  simulateDebtPayoff, 
  formatCurrency 
} from '../lib/calculations';

interface LoanTrackerViewProps {
  loans: FinanceLoan[];
  currencyCode: string;
  onOpenAddLoan: () => void;
  onEditLoan: (loan: FinanceLoan) => void;
  onDeleteLoan: (id: string) => Promise<void>;
  onSaveLoan: (loan: Partial<FinanceLoan> & { id: string }) => Promise<void>;
}

export const LoanTrackerView: React.FC<LoanTrackerViewProps> = ({
  loans,
  currencyCode,
  onOpenAddLoan,
  onEditLoan,
  onDeleteLoan,
  onSaveLoan
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || '');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [extraPrincipal, setExtraPrincipal] = useState('0');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Simulator tab
  const [extraMonthlyPayoff, setExtraMonthlyPayoff] = useState('200');

  const selectedLoan = loans.find(l => l.id === selectedLoanId) || loans[0];

  const totalOutstandingDebt = loans
    .filter(l => l.status === 'active' && l.type !== 'lent')
    .reduce((sum, l) => sum + l.currentBalance, 0);

  const totalMonthlyEmi = loans
    .filter(l => l.status === 'active' && l.type !== 'lent')
    .reduce((sum, l) => sum + l.monthlyEmi, 0);

  const totalPaidSoFar = loans.reduce((sum, l) => sum + (l.totalPaidSoFar || 0), 0);

  // Amortization schedule for selected loan
  const amortization = selectedLoan
    ? generateAmortizationSchedule(selectedLoan.originalPrincipal, selectedLoan.interestRate, selectedLoan.tenureMonths, 24)
    : [];

  // Debt Strategy simulation
  const debtSimulation = simulateDebtPayoff(loans, parseFloat(extraMonthlyPayoff) || 0);

  const handleOpenPaymentModal = () => {
    if (!selectedLoan) return;
    setPaymentAmount(selectedLoan.monthlyEmi.toString());
    setExtraPrincipal('0');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const amt = parseFloat(paymentAmount);
    const extra = parseFloat(extraPrincipal) || 0;
    if (isNaN(amt) || amt <= 0) return;

    // Approximate principal vs interest split
    const monthlyRate = (selectedLoan.interestRate / 100) / 12;
    const interestPortion = Math.min(amt, selectedLoan.currentBalance * monthlyRate);
    const principalPortion = amt - interestPortion + extra;

    const newBalance = Math.max(0, selectedLoan.currentBalance - principalPortion);
    const newTotalPaid = (selectedLoan.totalPaidSoFar || 0) + amt + extra;

    const newPaymentRecord: LoanPaymentRecord = {
      id: `pay-${Date.now()}`,
      date: paymentDate,
      amount: amt + extra,
      principalPortion: Math.round(principalPortion * 100) / 100,
      interestPortion: Math.round(interestPortion * 100) / 100,
      notes: paymentNotes.trim() || undefined
    };

    // Calculate next due date (+1 month)
    const currentDue = new Date(selectedLoan.nextDueDate || paymentDate);
    currentDue.setMonth(currentDue.getMonth() + 1);
    const nextDue = currentDue.toISOString().slice(0, 10);

    await onSaveLoan({
      id: selectedLoan.id,
      currentBalance: Math.round(newBalance * 100) / 100,
      totalPaidSoFar: Math.round(newTotalPaid * 100) / 100,
      nextDueDate: nextDue,
      status: newBalance <= 0 ? 'paid_off' : 'active',
      paymentHistory: [newPaymentRecord, ...(selectedLoan.paymentHistory || [])],
      updatedAt: new Date().toISOString()
    });

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-2.5 sm:space-y-4 text-neutral-900 dark:text-white">
      {/* Top Banner: Total Debt Portfolio & EMI Summary */}
      <div className="p-3 sm:p-4.5 rounded-xl sm:rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#1c2230] dark:via-[#161b22] dark:to-[#0f131a] border border-neutral-200 dark:border-[#30363d] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e]">
              Active Debt & Loan Portfolio
            </span>
            <h2 className="text-xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {formatCurrency(totalOutstandingDebt, currencyCode)}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenAddLoan}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Loan</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-2 sm:pt-3 border-t border-neutral-200 dark:border-[#30363d]/70 text-xs">
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
            <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold truncate block">Monthly EMI</span>
            <p className="text-xs sm:text-base font-bold font-mono text-neutral-900 dark:text-white mt-0.5 truncate">
              {formatCurrency(totalMonthlyEmi, currencyCode)}
            </p>
          </div>

          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
            <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold truncate block">Paid Back</span>
            <p className="text-xs sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {formatCurrency(totalPaidSoFar, currencyCode)}
            </p>
          </div>

          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
            <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold truncate block">Accounts</span>
            <p className="text-xs sm:text-base font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-0.5 truncate">
              {loans.filter(l => l.status === 'active').length}/{loans.length}
            </p>
          </div>
        </div>
      </div>

      {/* Loans Grid & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Loan Accounts List */}
        <div className="space-y-2.5 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] px-1">
            Loan Accounts ({loans.length})
          </h3>

          {loans.length > 0 ? (
            loans.map((loan) => {
              const isSelected = selectedLoanId === loan.id;
              const percentPaid = loan.originalPrincipal > 0
                ? Math.min(100, Math.round(((loan.originalPrincipal - loan.currentBalance) / loan.originalPrincipal) * 100))
                : 0;

              return (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-gradient-to-br dark:from-[#1e293b] dark:to-[#0f172a] border-indigo-500/80 ring-1 ring-indigo-500/40'
                      : 'bg-white dark:bg-[#161b22] border-neutral-200 dark:border-[#30363d] hover:border-neutral-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{loan.title}</h4>
                        {loan.status === 'paid_off' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            Paid Off
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 dark:text-[#8b949e] mt-0.5">
                        {loan.lenderOrBorrower} • {loan.interestRate}% APR
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditLoan(loan); }}
                        className="p-1 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white transition-colors text-xs"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteLoan(loan.id); }}
                        className="p-1 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-rose-500/20 text-neutral-600 dark:text-[#8b949e] hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="my-2 flex items-baseline justify-between text-xs font-mono">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(loan.currentBalance, currencyCode)}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-[#8b949e]">
                      EMI: {formatCurrency(loan.monthlyEmi, currencyCode)}/mo
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-[#0d1117] rounded-full overflow-hidden border border-neutral-200 dark:border-[#30363d]">
                    <div
                      className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-[#8b949e] mt-1.5">
                    <span>{percentPaid}% Repaid</span>
                    <span>Due: {loan.nextDueDate}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-neutral-500 dark:text-[#8b949e] rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs">
              <Landmark className="w-8 h-8 mx-auto text-neutral-400 dark:text-[#8b949e]/40 mb-2" />
              <p className="text-xs">No loans recorded.</p>
              <button
                onClick={onOpenAddLoan}
                className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
              >
                + Add Loan
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Selected Loan Detail & Amortization */}
        <div className="lg:col-span-2 space-y-3">
          {selectedLoan ? (
            <>
              {/* Selected Loan Hero Panel */}
              <div className="p-4.5 rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">{selectedLoan.title}</h3>
                    <p className="text-[11px] text-neutral-500 dark:text-[#8b949e]">
                      {selectedLoan.lenderOrBorrower} • {selectedLoan.type.toUpperCase()} LOAN
                    </p>
                  </div>

                  {selectedLoan.status !== 'paid_off' && (
                    <button
                      onClick={handleOpenPaymentModal}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Log Loan Payment</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
                    <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold block font-sans">Remaining Principal</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(selectedLoan.currentBalance, currencyCode)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
                    <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold block font-sans">Monthly EMI</span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(selectedLoan.monthlyEmi, currencyCode)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
                    <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold block font-sans">Annual Interest (APR)</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{selectedLoan.interestRate}%</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
                    <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold block font-sans">Next Due Date</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">{selectedLoan.nextDueDate}</span>
                  </div>
                </div>

                {selectedLoan.notes && (
                  <p className="text-xs text-neutral-600 dark:text-[#8b949e] italic p-2 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60">
                    "{selectedLoan.notes}"
                  </p>
                )}
              </div>

              {/* Amortization Schedule Table */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>Projected Amortization Schedule (First 24 Months)</span>
                  </h4>
                  <span className="text-[10px] text-neutral-500 dark:text-[#8b949e]">Monthly Annuity Breakdown</span>
                </div>

                <div className="overflow-x-auto max-h-56 scrollbar-none">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-[#30363d] text-neutral-500 dark:text-[#8b949e] font-mono">
                        <th className="py-1.5 px-2">Month</th>
                        <th className="py-1.5 px-2">Payment</th>
                        <th className="py-1.5 px-2 text-emerald-600 dark:text-emerald-400">Principal</th>
                        <th className="py-1.5 px-2 text-amber-600 dark:text-amber-400">Interest</th>
                        <th className="py-1.5 px-2">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-[#30363d]/50 font-mono">
                      {amortization.map((item) => (
                        <tr key={item.month} className="hover:bg-neutral-50 dark:hover:bg-[#21262d]/50">
                          <td className="py-1 px-2 text-neutral-500 dark:text-[#8b949e]">#{item.month}</td>
                          <td className="py-1 px-2 text-neutral-900 dark:text-white">{formatCurrency(item.payment, currencyCode)}</td>
                          <td className="py-1 px-2 text-emerald-600 dark:text-emerald-400">+{formatCurrency(item.principal, currencyCode)}</td>
                          <td className="py-1 px-2 text-amber-600 dark:text-amber-400">-{formatCurrency(item.interest, currencyCode)}</td>
                          <td className="py-1 px-2 text-neutral-900 dark:text-white font-bold">{formatCurrency(item.remainingBalance, currencyCode)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History Log */}
              {selectedLoan.paymentHistory && selectedLoan.paymentHistory.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] space-y-2 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e]">
                    Logged Payment History ({selectedLoan.paymentHistory.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedLoan.paymentHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-neutral-900 dark:text-white">{rec.date}</span>
                          <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] ml-2">
                            (Principal: {formatCurrency(rec.principalPortion, currencyCode)} • Interest: {formatCurrency(rec.interestPortion, currencyCode)})
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(rec.amount, currencyCode)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-neutral-500 dark:text-[#8b949e] rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs">
              <p className="text-xs">Select or add a loan to view amortization details and payoff strategies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Debt Strategy Simulator (Snowball vs Avalanche) */}
      <div className="p-4.5 rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Debt Freedom Acceleration Simulator</h3>
              <p className="text-[11px] text-neutral-500 dark:text-[#8b949e]">Compare Debt Avalanche (Highest APR First) vs. Debt Snowball (Lowest Balance First)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 dark:text-[#8b949e]">Extra Monthly Payoff:</span>
            <input
              type="number"
              step="50"
              min="0"
              value={extraMonthlyPayoff}
              onChange={(e) => setExtraMonthlyPayoff(e.target.value)}
              className="w-24 bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-lg px-2 py-1 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Avalanche Strategy */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-300">🏔️ Debt Avalanche (Mathematically Optimal)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">
                Saves Max Interest
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-[#8b949e] mb-3">
              Directs extra payments toward highest interest rate debts first.
            </p>
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-white dark:bg-[#0d1117]/80 border border-neutral-200 dark:border-transparent">
                <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] font-sans block">Debt-Free In</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{debtSimulation.avalanche.months} Months</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#0d1117]/80 border border-neutral-200 dark:border-transparent">
                <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] font-sans block">Estimated Interest</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(debtSimulation.avalanche.totalInterest, currencyCode)}
                </span>
              </div>
            </div>
          </div>

          {/* Snowball Strategy */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-gradient-to-br dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="font-bold text-purple-900 dark:text-purple-300">⚡ Debt Snowball (Psychological Momentum)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium">
                Fastest Quick Wins
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-[#8b949e] mb-3">
              Directs extra payments toward smallest balance accounts first.
            </p>
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-white dark:bg-[#0d1117]/80 border border-neutral-200 dark:border-transparent">
                <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] font-sans block">Debt-Free In</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{debtSimulation.snowball.months} Months</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#0d1117]/80 border border-neutral-200 dark:border-transparent">
                <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] font-sans block">Estimated Interest</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(debtSimulation.snowball.totalInterest, currencyCode)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Payment Modal */}
      {isPaymentModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] text-neutral-900 dark:text-white rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl animate-fade-in text-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Log Payment for {selectedLoan.title}
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">
                  Scheduled EMI Payment ({currencyCode})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">
                  Extra Principal Payment (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={extraPrincipal}
                  onChange={(e) => setExtraPrincipal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Confirmation number, bank reference..."
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
