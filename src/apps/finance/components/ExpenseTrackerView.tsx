/**
 * @file ExpenseTrackerView.tsx
 * @description Interactive Expense & Income Ledger tracker with search, category filtering, and CSV export.
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Tag,
  Calendar,
  Wallet,
  PieChart as PieChartIcon
} from 'lucide-react';
import { FinanceTransaction, FinanceAccount, FinanceCategory, TransactionType } from '../types';
import { formatCurrency, exportTransactionsToCsv, downloadFile } from '../lib/calculations';
import { ExpensePieChart } from './ExpensePieChart';

interface ExpenseTrackerViewProps {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  currencyCode: string;
  onOpenAddModal: (type?: TransactionType) => void;
  onEditTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const ExpenseTrackerView: React.FC<ExpenseTrackerViewProps> = ({
  transactions,
  accounts,
  currencyCode,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateMonthFilter, setDateMonthFilter] = useState<string>('');
  const [showChart, setShowChart] = useState(false);

  // Extract unique categories and months
  const categories = useMemo(() => {
    const set = new Set(transactions.map(t => t.category));
    return Array.from(set);
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
      if (dateMonthFilter && !t.date.startsWith(dateMonthFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNotes = (t.notes || '').toLowerCase().includes(q);
        const matchesTags = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
        if (!matchesTitle && !matchesNotes && !matchesTags) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, categoryFilter, accountFilter, dateMonthFilter, searchQuery]);

  // Financial sums of filtered set
  const filteredSummary = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    return { expenses, income, net: income - expenses };
  }, [filteredTransactions]);

  const handleExportCsv = () => {
    const csvData = exportTransactionsToCsv(filteredTransactions);
    downloadFile(csvData, `harmony-finance-ledger-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  const getAccountName = (accId: string) => {
    return accounts.find(a => a.id === accId)?.name || 'Standard Account';
  };

  return (
    <div className="space-y-2.5 sm:space-y-4 text-neutral-900 dark:text-white">
      {/* Header Controls & Filter Bar */}
      <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] space-y-2 sm:space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1 sm:gap-1.5">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Activity & Ledger ({filteredTransactions.length})</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowChart(!showChart)}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                showChart
                  ? 'bg-rose-600 text-white border-transparent shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9] border-neutral-200 dark:border-transparent'
              }`}
              title="Toggle Expense Categorization Pie Chart"
            >
              <PieChartIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{showChart ? 'Hide Chart' : 'Chart'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9] text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors border border-neutral-200 dark:border-transparent cursor-pointer"
              title="Export filtered records to CSV"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => onOpenAddModal('expense')}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Record</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 pt-0.5 text-xs">
          {/* Search Input */}
          <div className="col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 sm:top-2.5 text-neutral-400 dark:text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, notes, #tags..."
              className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-lg sm:rounded-xl pl-7.5 pr-2.5 py-1 sm:py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-lg sm:rounded-xl px-2 py-1 sm:py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-lg sm:rounded-xl px-2 py-1 sm:py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Pills & Month Filter */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-neutral-200 dark:border-[#30363d]/60 text-xs">
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-[#0d1117] p-0.5 rounded-lg border border-neutral-200 dark:border-[#30363d]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${typeFilter === 'all' ? 'bg-white dark:bg-[#21262d] text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${typeFilter === 'expense' ? 'bg-rose-600 text-white' : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'}`}
            >
              Exp
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'}`}
            >
              Inc
            </button>
            <button
              onClick={() => setTypeFilter('transfer')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${typeFilter === 'transfer' ? 'bg-blue-600 text-white' : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'}`}
            >
              Txfr
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{formatCurrency(filteredSummary.income, currencyCode)}</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">-{formatCurrency(filteredSummary.expenses, currencyCode)}</span>
            <span className={`font-bold ${filteredSummary.net >= 0 ? 'text-indigo-600 dark:text-indigo-300' : 'text-rose-600 dark:text-rose-300'}`}>
              Net: {formatCurrency(filteredSummary.net, currencyCode)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Expense Categorization Pie Chart */}
      {showChart && (
        <ExpensePieChart
          transactions={filteredTransactions}
          currencyCode={currencyCode}
          onOpenAddExpense={() => onOpenAddModal('expense')}
        />
      )}

      {/* Transaction Records List */}
      <div className="space-y-1.5 sm:space-y-2">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] hover:border-indigo-400 dark:hover:border-[#58a6ff]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shadow-xs group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                  tx.type === 'expense' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
                  tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                  'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}>
                  {tx.type === 'expense' ? '↓' : tx.type === 'income' ? '↑' : '⇄'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[140px] sm:max-w-none">{tx.title}</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-neutral-100 dark:bg-[#21262d] text-neutral-600 dark:text-[#8b949e] font-medium border border-neutral-200 dark:border-[#30363d]">
                      {tx.category}
                    </span>
                  </div>

                  <p className="text-[10px] text-neutral-500 dark:text-[#8b949e] mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{getAccountName(tx.accountId)}</span>
                    {tx.toAccountId && (
                      <span>➔ {getAccountName(tx.toAccountId)}</span>
                    )}
                    {tx.notes && (
                      <>
                        <span>•</span>
                        <span className="italic text-neutral-700 dark:text-[#c9d1d9] line-clamp-1 max-w-[120px] sm:max-w-[200px]">{tx.notes}</span>
                      </>
                    )}
                  </p>

                  {tx.tags && tx.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tx.tags.map((tag) => (
                        <span key={tag} className="text-[8px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-100 dark:border-transparent">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <span className={`text-xs sm:text-sm font-bold font-mono ${
                    tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                    {formatCurrency(tx.amount, currencyCode)}
                  </span>
                  <p className="text-[9px] text-neutral-500 dark:text-[#8b949e] capitalize">{tx.paymentMethod.replace('_', ' ')}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditTransaction(tx)}
                    className="p-1 sm:p-1.5 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Edit transaction"
                  >
                    <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1 sm:p-1.5 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-rose-500/20 text-neutral-500 dark:text-[#8b949e] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 sm:p-12 text-center text-neutral-500 dark:text-[#8b949e] rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs">
            <Wallet className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-neutral-400 dark:text-[#8b949e]/40 mb-2 sm:mb-3" />
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">No transactions recorded</h4>
            <p className="text-xs text-neutral-500 dark:text-[#8b949e] mt-1">Start tracking your cash flow by recording your first expense or income.</p>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              + Record Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
