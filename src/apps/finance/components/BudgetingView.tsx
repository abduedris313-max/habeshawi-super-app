/**
 * @file BudgetingView.tsx
 * @description Smart monthly budgeting engine with category progress indicators, threshold alerts, and budget planner.
 */

import React, { useState } from 'react';
import { 
  PieChart, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { FinanceBudget, FinanceTransaction, FinanceCategory } from '../types';
import { calculateBudgetStatus, formatCurrency } from '../lib/calculations';

interface BudgetingViewProps {
  budgets: FinanceBudget[];
  transactions: FinanceTransaction[];
  currencyCode: string;
  onSaveBudget: (budget: Partial<FinanceBudget> & { id: string; category: FinanceCategory; monthlyLimit: number }) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
}

const CATEGORIES: FinanceCategory[] = [
  'Housing',
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Utilities',
  'Health & Medical',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Subscriptions',
  'Other'
];

export const BudgetingView: React.FC<BudgetingViewProps> = ({
  budgets,
  transactions,
  currencyCode,
  onSaveBudget,
  onDeleteBudget
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<FinanceBudget | null>(null);
  const [category, setCategory] = useState<FinanceCategory>('Food & Dining');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');

  const budgetStatuses = calculateBudgetStatus(budgets, transactions);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalBudgetSpent = budgetStatuses.reduce((sum, b) => sum + b.spent, 0);
  const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent;
  const overallPercentage = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  const handleOpenAdd = () => {
    setBudgetToEdit(null);
    setCategory('Food & Dining');
    setMonthlyLimit('500');
    setAlertThreshold('80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: FinanceBudget) => {
    setBudgetToEdit(b);
    setCategory(b.category);
    setMonthlyLimit(b.monthlyLimit.toString());
    setAlertThreshold((b.alertThreshold || 80).toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) return;

    await onSaveBudget({
      id: budgetToEdit ? budgetToEdit.id : `budget-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      category,
      monthlyLimit: limit,
      alertThreshold: parseInt(alertThreshold, 10) || 80,
      currency: currencyCode,
      createdAt: budgetToEdit ? budgetToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-2.5 sm:space-y-4 text-neutral-900 dark:text-white">
      {/* Overall Budget Overview Card */}
      <div className="p-3 sm:p-4.5 rounded-xl sm:rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#1c2230] dark:via-[#161b22] dark:to-[#0f131a] border border-neutral-200 dark:border-[#30363d] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e]">
              Monthly Category Budget Gauge
            </span>
            <h2 className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
              {formatCurrency(totalBudgetSpent, currencyCode)}{' '}
              <span className="text-xs sm:text-sm font-normal text-neutral-500 dark:text-[#8b949e]">
                of {formatCurrency(totalBudgetLimit, currencyCode)} limit
              </span>
            </h2>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Budget</span>
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1 my-2 sm:my-3">
          <div className="flex justify-between text-[11px] sm:text-xs font-mono">
            <span className={overallPercentage > 100 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-indigo-600 dark:text-indigo-300'}>
              {overallPercentage}% Utilized
            </span>
            <span className={totalBudgetRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
              {totalBudgetRemaining >= 0 ? '+' : ''}{formatCurrency(totalBudgetRemaining, currencyCode)} Remaining
            </span>
          </div>

          <div className="w-full h-2 sm:h-2.5 bg-neutral-100 dark:bg-[#0d1117] rounded-full overflow-hidden p-0.5 border border-neutral-200 dark:border-[#30363d]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 100 ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                overallPercentage > 80 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-neutral-200 dark:border-[#30363d]/60 text-center">
          <div>
            <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold">Planned</span>
            <p className="text-[11px] sm:text-xs font-bold font-mono text-neutral-900 dark:text-white mt-0.5 truncate">{formatCurrency(totalBudgetLimit, currencyCode)}</p>
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold">Actual Spent</span>
            <p className="text-[11px] sm:text-xs font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 truncate">{formatCurrency(totalBudgetSpent, currencyCode)}</p>
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold">Available</span>
            <p className="text-[11px] sm:text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">{formatCurrency(Math.max(0, totalBudgetRemaining), currencyCode)}</p>
          </div>
        </div>
      </div>

      {/* Category Budget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {budgetStatuses.length > 0 ? (
          budgetStatuses.map((status) => {
            const rawBudget = budgets.find(b => b.category === status.category);
            return (
              <div
                key={status.category}
                className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                  status.isOverBudget
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                    : status.percentageUsed >= status.alertThreshold
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40'
                    : 'bg-white dark:bg-[#161b22] border-neutral-200 dark:border-[#30363d]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        status.isOverBudget ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                        status.percentageUsed >= status.alertThreshold ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                        'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {status.isOverBudget ? '!' : '✓'}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">{status.category}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {rawBudget && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(rawBudget)}
                            className="p-1 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white transition-colors text-xs cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteBudget(rawBudget.id)}
                            className="p-1 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-rose-500/20 text-neutral-600 dark:text-[#8b949e] hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-xs cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between my-1 sm:my-2 text-xs font-mono">
                    <span className="text-neutral-900 dark:text-white font-bold text-xs sm:text-sm">
                      {formatCurrency(status.spent, currencyCode)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-[#8b949e]">
                      limit: {formatCurrency(status.budgetLimit, currencyCode)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-neutral-100 dark:bg-[#0d1117] rounded-full overflow-hidden border border-neutral-200 dark:border-[#30363d]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status.isOverBudget ? 'bg-rose-500' :
                        status.percentageUsed >= status.alertThreshold ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(status.percentageUsed, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-3 mt-3 border-t border-neutral-200 dark:border-[#30363d]/60">
                  <span className={status.isOverBudget ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
                    {status.isOverBudget ? `Over by ${formatCurrency(Math.abs(status.remaining), currencyCode)}` : `${formatCurrency(status.remaining, currencyCode)} left`}
                  </span>
                  <span className="font-mono text-neutral-500 dark:text-[#8b949e]">
                    {status.percentageUsed}%
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="sm:col-span-2 p-12 text-center text-neutral-500 dark:text-[#8b949e] rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs">
            <PieChart className="w-10 h-10 mx-auto text-neutral-400 dark:text-[#8b949e]/40 mb-3" />
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">No Category Budgets Configured</h4>
            <p className="text-xs text-neutral-500 dark:text-[#8b949e] mt-1">Set monthly category spending limits to gain full control over your finances.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              + Create Category Budget
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] text-neutral-900 dark:text-white rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl animate-fade-in text-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {budgetToEdit ? 'Edit Budget Plan' : 'Create Category Budget'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FinanceCategory)}
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Monthly Spending Limit ({currencyCode})</label>
                <input
                  type="number"
                  step="1"
                  required
                  min="1"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="500"
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Alert Threshold (%)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  placeholder="80"
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] mt-1 block">
                  Notify when spending reaches {alertThreshold}% of limit.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
