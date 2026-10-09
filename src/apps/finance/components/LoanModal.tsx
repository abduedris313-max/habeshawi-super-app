/**
 * @file LoanModal.tsx
 * @description Modal dialog for adding or editing loan & debt accounts with real-time EMI calculation.
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, Calendar, Landmark, Percent } from 'lucide-react';
import { FinanceLoan, LoanType } from '../types';
import { calculateMonthlyEmi, formatCurrency } from '../lib/calculations';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loan: Partial<FinanceLoan> & { id: string; title: string; originalPrincipal: number; currentBalance: number; interestRate: number; tenureMonths: number; monthlyEmi: number; startDate: string; nextDueDate: string; lenderOrBorrower: string; type: LoanType }) => Promise<void>;
  loanToEdit?: FinanceLoan | null;
  currencyCode?: string;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  loanToEdit,
  currencyCode = 'USD'
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LoanType>('personal');
  const [lenderOrBorrower, setLenderOrBorrower] = useState('');
  const [principal, setPrincipal] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('6.5');
  const [tenureMonths, setTenureMonths] = useState<string>('36');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [nextDueDate, setNextDueDate] = useState(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculated EMI preview
  const estimatedEmi = calculateMonthlyEmi(
    parseFloat(principal) || 0,
    parseFloat(interestRate) || 0,
    parseInt(tenureMonths, 10) || 1
  );

  useEffect(() => {
    if (loanToEdit) {
      setTitle(loanToEdit.title);
      setType(loanToEdit.type);
      setLenderOrBorrower(loanToEdit.lenderOrBorrower);
      setPrincipal(loanToEdit.originalPrincipal.toString());
      setCurrentBalance(loanToEdit.currentBalance.toString());
      setInterestRate(loanToEdit.interestRate.toString());
      setTenureMonths(loanToEdit.tenureMonths.toString());
      setStartDate(loanToEdit.startDate);
      setNextDueDate(loanToEdit.nextDueDate);
      setNotes(loanToEdit.notes || '');
    } else {
      setTitle('');
      setType('personal');
      setLenderOrBorrower('');
      setPrincipal('');
      setCurrentBalance('');
      setInterestRate('6.5');
      setTenureMonths('36');
      setStartDate(new Date().toISOString().slice(0, 10));
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      setNextDueDate(next.toISOString().slice(0, 10));
      setNotes('');
    }
  }, [loanToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(principal);
    const cb = currentBalance ? parseFloat(currentBalance) : p;
    const r = parseFloat(interestRate) || 0;
    const t = parseInt(tenureMonths, 10) || 12;

    if (!title.trim() || isNaN(p) || p <= 0) return;

    setIsSubmitting(true);
    try {
      const emi = calculateMonthlyEmi(p, r, t);
      await onSave({
        id: loanToEdit ? loanToEdit.id : `loan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        type,
        lenderOrBorrower: lenderOrBorrower.trim() || 'Direct Financial Institution',
        originalPrincipal: p,
        currentBalance: isNaN(cb) ? p : cb,
        interestRate: r,
        tenureMonths: t,
        monthlyEmi: emi,
        startDate,
        nextDueDate,
        totalPaidSoFar: loanToEdit ? loanToEdit.totalPaidSoFar : 0,
        status: (isNaN(cb) ? p : cb) <= 0 ? 'paid_off' : 'active',
        notes: notes.trim() || undefined,
        paymentHistory: loanToEdit ? loanToEdit.paymentHistory : [],
        createdAt: loanToEdit ? loanToEdit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] text-neutral-900 dark:text-white rounded-xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-neutral-200 dark:border-[#30363d] flex items-center justify-between bg-neutral-50 dark:bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {loanToEdit ? 'Edit Loan Account' : 'Add Loan / Debt Tracking'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#8b949e]">EMI, Amortization & Repayment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:text-[#8b949e] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 flex-1 scrollbar-none text-xs">
          {/* Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Loan Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Home Mortgage, Auto Loan, Student Loan"
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Loan Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LoanType)}
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="mortgage">Mortgage (Home Loan)</option>
                <option value="auto">Auto / Car Loan</option>
                <option value="student">Student / Education Loan</option>
                <option value="personal">Personal Loan</option>
                <option value="borrowed">Borrowed from Friend/Family</option>
                <option value="lent">Lent to Someone (Receivable)</option>
              </select>
            </div>
          </div>

          {/* Lender / Institution */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Lender / Financial Institution</label>
            <input
              type="text"
              value={lenderOrBorrower}
              onChange={(e) => setLenderOrBorrower(e.target.value)}
              placeholder="e.g. Chase Bank, SoFi, Federal Student Aid, John Doe"
              className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Principal & Current Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Original Principal ({currencyCode}) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="1"
                value={principal}
                onChange={(e) => {
                  setPrincipal(e.target.value);
                  if (!loanToEdit && !currentBalance) {
                    setCurrentBalance(e.target.value);
                  }
                }}
                placeholder="25000"
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Current Remaining Balance ({currencyCode})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="Leave blank to match principal"
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Interest Rate & Tenure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Annual Interest Rate (APR %)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="5.5"
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl pl-3 pr-8 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-neutral-400 dark:text-[#8b949e] font-mono">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Tenure (Total Months)</label>
              <input
                type="number"
                min="1"
                max="600"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                placeholder="60 (5 years)"
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Live Calculated EMI Card */}
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold tracking-wider">Calculated Monthly EMI</span>
                <p className="text-base font-bold text-neutral-900 dark:text-white font-mono">
                  {formatCurrency(estimatedEmi, currencyCode)} <span className="text-xs font-normal text-indigo-600 dark:text-indigo-300">/mo</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-medium">
              Standard Annuity
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Loan Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Next Payment Due Date</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Account reference numbers, fixed vs variable terms, early prepayment conditions..."
              className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Loan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
