/**
 * @file FinanceOverview.tsx
 * @description Apple HIG inspired Net Worth, Cash Flow Dashboard & Financial Command Center.
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  Landmark, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  PieChart, 
  Clock, 
  AlertCircle,
  Plus,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  FinanceTransaction, 
  FinanceLoan, 
  FinanceBudget, 
  FinanceAccount, 
  FinanceSubscription,
  FinanceTab
} from '../types';
import { 
  calculateNetWorth, 
  calculateMonthlyCashFlow, 
  calculateBudgetStatus, 
  formatCurrency 
} from '../lib/calculations';
import { ExpensePieChart } from './ExpensePieChart';

interface FinanceOverviewProps {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  loans: FinanceLoan[];
  budgets: FinanceBudget[];
  subscriptions: FinanceSubscription[];
  currencyCode: string;
  onOpenAddTransaction: (type?: 'expense' | 'income' | 'transfer') => void;
  onOpenAddLoan: () => void;
  onNavigateTab: (tab: FinanceTab) => void;
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = ({
  transactions,
  accounts,
  loans,
  budgets,
  subscriptions,
  currencyCode,
  onOpenAddTransaction,
  onOpenAddLoan,
  onNavigateTab
}) => {
  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts, loans);
  const cashFlow = calculateMonthlyCashFlow(transactions);
  const budgetStatuses = calculateBudgetStatus(budgets, transactions);

  // Active loans summary
  const activeLoans = loans.filter(l => l.status === 'active' && l.type !== 'lent');
  const totalMonthlyEmi = activeLoans.reduce((sum, l) => sum + l.monthlyEmi, 0);

  // Active subscriptions summary
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalMonthlySubs = activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'yearly') return sum + (s.amount / 12);
    if (s.billingCycle === 'quarterly') return sum + (s.amount / 3);
    return sum + s.amount;
  }, 0);

  // Over-budget alerts
  const overBudgetItems = budgetStatuses.filter(b => b.isOverBudget);

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-2.5 sm:space-y-4 text-neutral-900 dark:text-white">
      {/* Top Banner: Net Worth & Liquid Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
        {/* Net Worth Hero Card */}
        <div className="md:col-span-2 rounded-xl sm:rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#1c2230] dark:via-[#161b22] dark:to-[#0f131a] border border-neutral-200 dark:border-[#30363d] p-3 sm:p-4.5 relative overflow-hidden shadow-xs dark:shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] flex items-center gap-1 sm:gap-1.5">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Total Net Worth</span>
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 font-mono">
              Live Balance
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 my-1 sm:my-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-neutral-900 dark:text-white">
              {formatCurrency(netWorth, currencyCode)}
            </h2>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{cashFlow.savingsRate}% Saved</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-neutral-200 dark:border-[#30363d]/70 text-xs">
            <div>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold">Total Assets</span>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                +{formatCurrency(totalAssets, currencyCode)}
              </p>
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold">Total Liabilities</span>
              <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                -{formatCurrency(totalLiabilities, currencyCode)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Matrix Card */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] p-3 sm:p-4 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white mb-0.5 sm:mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Quick Actions</span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#8b949e]">Record transactions or manage debt</p>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-2 gap-1.5 sm:gap-2 my-2">
            <button
              onClick={() => onOpenAddTransaction('expense')}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold flex flex-col items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Expense</span>
            </button>

            <button
              onClick={() => onOpenAddTransaction('income')}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold flex flex-col items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Income</span>
            </button>

            <button
              onClick={() => onOpenAddTransaction('transfer')}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold flex flex-col items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Transfer</span>
            </button>

            <button
              onClick={() => onNavigateTab('ai-advisor')}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold flex flex-col items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Advisor</span>
            </button>
          </div>

          <button
            onClick={onOpenAddLoan}
            className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#21262d] dark:hover:bg-[#30363d] text-indigo-600 dark:text-indigo-300 text-[10px] sm:text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Landmark className="w-3 h-3" />
            <span>+ Add Loan Tracker</span>
          </button>
        </div>
      </div>

      {/* Monthly Cash Flow Metrics (Compact Responsive 3-col Grid) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500 dark:text-[#8b949e] truncate">Income</span>
          </div>
          <p className="text-xs sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 truncate">
            +{formatCurrency(cashFlow.totalIncome, currencyCode)}
          </p>
        </div>

        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500 dark:text-[#8b949e] truncate">Expenses</span>
          </div>
          <p className="text-xs sm:text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-1 truncate">
            -{formatCurrency(cashFlow.totalExpenses, currencyCode)}
          </p>
        </div>

        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500 dark:text-[#8b949e] truncate">Net Flow</span>
          </div>
          <p className={`text-xs sm:text-base font-bold font-mono mt-1 truncate ${cashFlow.netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {cashFlow.netSavings >= 0 ? '+' : ''}{formatCurrency(cashFlow.netSavings, currencyCode)}
          </p>
        </div>
      </div>

      {/* Alert Banner if Over Budget */}
      {overBudgetItems.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>
              <strong>Budget Warning:</strong> You have exceeded budget in {overBudgetItems.map(i => i.category).join(', ')}.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('budget')}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold shrink-0"
          >
            Review Budgets
          </button>
        </div>
      )}

      {/* Expense Pie Chart Visualizer */}
      <ExpensePieChart
        transactions={transactions}
        currencyCode={currencyCode}
        onOpenAddExpense={() => onOpenAddTransaction('expense')}
      />

      {/* Dual Column: Accounts / Obligations & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
        {/* Left: Accounts & Obligations */}
        <div className="space-y-2 sm:space-y-3">
          {/* Account Balances Preview */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Ledger Accounts ({accounts.length})</span>
              </h3>
              <button
                onClick={() => onNavigateTab('ledger')}
                className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-0.5 font-medium cursor-pointer"
              >
                Manage <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              {accounts.length > 0 ? (
                accounts.slice(0, 4).map((acc) => (
                  <div
                    key={acc.id}
                    className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: `${acc.color}20`, color: acc.color }}>
                        {acc.type === 'checking' ? '🏦' : acc.type === 'savings' ? '💰' : acc.type === 'credit_card' ? '💳' : '💵'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{acc.name}</h4>
                        <p className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] truncate">{acc.institution || acc.type}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white shrink-0">
                      {formatCurrency(acc.balance, currencyCode)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 sm:p-4 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/80 text-center text-neutral-500 dark:text-[#8b949e]">
                  <p className="text-xs">No accounts linked yet.</p>
                  <button
                    onClick={() => onNavigateTab('ledger')}
                    className="mt-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    + Add Account
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Obligations: Loans & Subscriptions */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Monthly Obligations</span>
              </h3>
              <span className="text-[11px] sm:text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(totalMonthlyEmi + totalMonthlySubs, currencyCode)} /mo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div 
                onClick={() => onNavigateTab('loans')}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/80 cursor-pointer hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#8b949e]">
                  <span>Active Loans</span>
                  <Landmark className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white font-mono mt-0.5 truncate">
                  {formatCurrency(totalMonthlyEmi, currencyCode)}
                </p>
                <span className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-300">{activeLoans.length} active debts</span>
              </div>

              <div 
                onClick={() => onNavigateTab('subscriptions')}
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/80 cursor-pointer hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#8b949e]">
                  <span>Subscriptions</span>
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500 dark:text-purple-400" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white font-mono mt-0.5 truncate">
                  {formatCurrency(totalMonthlySubs, currencyCode)}
                </p>
                <span className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-300">{activeSubs.length} recurring</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Ledger Transactions */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Recent Activity</span>
            </h3>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-0.5 font-medium cursor-pointer"
            >
              All ({transactions.length}) <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5 sm:space-y-2 flex-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      tx.type === 'expense' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
                      tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                      'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}>
                      {tx.type === 'expense' ? '↓' : tx.type === 'income' ? '↑' : '⇄'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
                        {tx.title}
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] truncate">
                        {tx.category} • {tx.date}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-bold font-mono shrink-0 ${
                    tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                    {formatCurrency(tx.amount, currencyCode)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 sm:p-6 text-center text-neutral-500 dark:text-[#8b949e] flex flex-col items-center justify-center flex-1">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400 dark:text-[#8b949e]/40 mb-1 sm:mb-2" />
                <p className="text-xs">No transactions recorded yet.</p>
                <button
                  onClick={() => onOpenAddTransaction('expense')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  + Add First Transaction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
