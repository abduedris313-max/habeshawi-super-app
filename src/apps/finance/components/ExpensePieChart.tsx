/**
 * @file ExpensePieChart.tsx
 * @description Interactive data visualization component rendering a Pie Chart of expenses
 * categorized by type/category using Recharts with Apple HIG aesthetic and dark mode support.
 */

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { PieChart as PieChartIcon, Filter, Layers, DollarSign, ArrowUpRight } from 'lucide-react';
import { FinanceTransaction } from '../types';
import { formatCurrency } from '../lib/calculations';

interface ExpensePieChartProps {
  transactions: FinanceTransaction[];
  currencyCode?: string;
  onOpenAddExpense?: () => void;
  className?: string;
}

// Sophisticated palette tuned for high contrast in dark and light modes
const CATEGORY_COLORS: Record<string, string> = {
  'Housing': '#6366f1', // Indigo
  'Food & Dining': '#f59e0b', // Amber
  'Groceries': '#10b981', // Emerald
  'Transportation': '#06b6d4', // Cyan
  'Utilities': '#3b82f6', // Blue
  'Health & Medical': '#ec4899', // Pink
  'Entertainment': '#8b5cf6', // Violet
  'Shopping': '#f43f5e', // Rose
  'Education': '#14b8a6', // Teal
  'Loan Payment': '#ef4444', // Red
  'Debt Repayment': '#e11d48', // Crimson
  'Gifts & Donations': '#a855f7', // Purple
  'Travel': '#38bdf8', // Light blue
  'Subscriptions': '#d946ef', // Fuchsia
  'Other': '#94a3b8' // Slate
};

const FALLBACK_PALETTE = [
  '#f43f5e', '#f59e0b', '#10b981', '#06b6d4',
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
  '#3b82f6', '#eab308', '#d946ef', '#64748b'
];

type GroupingType = 'category' | 'paymentMethod';
type TimeFilterType = 'currentMonth' | 'allTime';

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
  transactions,
  currencyCode = 'USD',
  onOpenAddExpense,
  className = ''
}) => {
  const [grouping, setGrouping] = useState<GroupingType>('category');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('allTime');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Filter only expenses and apply time range
  const expenseTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      if (timeFilter === 'currentMonth' && !t.date.startsWith(currentMonthStr)) {
        return false;
      }
      return true;
    });
  }, [transactions, timeFilter, currentMonthStr]);

  // Aggregate totals by chosen grouping
  const { chartData, totalExpenseAmount, topCategory } = useMemo(() => {
    const map = new Map<string, number>();

    expenseTransactions.forEach((tx) => {
      let key = 'Other';
      if (grouping === 'category') {
        key = tx.category || 'Other';
      } else {
        const rawMethod = tx.paymentMethod || 'other';
        key = rawMethod
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }

      const current = map.get(key) || 0;
      map.set(key, current + (tx.amount || 0));
    });

    let total = 0;
    const items: Array<{ name: string; value: number; color: string; percentage: number }> = [];

    map.forEach((value, name) => {
      total += value;
    });

    let idx = 0;
    let maxVal = -1;
    let maxName = 'None';

    map.forEach((value, name) => {
      const color = grouping === 'category'
        ? (CATEGORY_COLORS[name] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length])
        : FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];

      const pct = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
      items.push({
        name,
        value: Math.round(value * 100) / 100,
        color,
        percentage: pct
      });

      if (value > maxVal) {
        maxVal = value;
        maxName = name;
      }
      idx++;
    });

    // Sort descending by value
    items.sort((a, b) => b.value - a.value);

    return {
      chartData: items,
      totalExpenseAmount: total,
      topCategory: maxName
    };
  }, [expenseTransactions, grouping]);

  return (
    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs flex flex-col justify-between ${className}`}>
      {/* Top Header Row with Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-200 dark:border-[#30363d]/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>Expense Categorization</span>
            </h3>
            <p className="text-[10px] text-neutral-500 dark:text-[#8b949e]">
              Visual distribution of outflow by {grouping === 'category' ? 'category' : 'payment method'}
            </p>
          </div>
        </div>

        {/* View Toggle Controls (Clean Segmented Controls) */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {/* Grouping switch */}
          <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] text-[10px] font-semibold">
            <button
              onClick={() => setGrouping('category')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                grouping === 'category'
                  ? 'bg-white dark:bg-[#21262d] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Category
            </button>
            <button
              onClick={() => setGrouping('paymentMethod')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                grouping === 'paymentMethod'
                  ? 'bg-white dark:bg-[#21262d] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Payment
            </button>
          </div>

          {/* Time switch */}
          <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] text-[10px] font-semibold">
            <button
              onClick={() => setTimeFilter('currentMonth')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                timeFilter === 'currentMonth'
                  ? 'bg-white dark:bg-[#21262d] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('allTime')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                timeFilter === 'allTime'
                  ? 'bg-white dark:bg-[#21262d] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Body or Empty State */}
      {chartData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center pt-3">
          {/* Recharts Pie Donut Container */}
          <div className="md:col-span-6 h-56 sm:h-64 relative flex items-center justify-center min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                      stroke="transparent"
                      className="transition-all duration-200 cursor-pointer outline-none"
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload as { name: string; value: number; color: string; percentage: number };
                      return (
                        <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/95 dark:bg-[#0d1117]/95 text-white border border-neutral-700/60 shadow-xl backdrop-blur-md text-xs">
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                            <span>{data.name}</span>
                          </div>
                          <div className="text-[11px] font-mono text-neutral-300 flex items-center justify-between gap-3">
                            <span>Amount:</span>
                            <span className="font-bold text-white">{formatCurrency(data.value, currencyCode)}</span>
                          </div>
                          <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between gap-3">
                            <span>Share:</span>
                            <span className="font-bold text-amber-400">{data.percentage}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Callout with Total Expenses */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] font-bold">Total Spent</span>
              <p className="text-sm sm:text-base font-extrabold font-mono text-neutral-900 dark:text-white">
                {formatCurrency(totalExpenseAmount, currencyCode)}
              </p>
              <span className="text-[9px] text-neutral-500 dark:text-[#8b949e]">
                {chartData.length} {grouping === 'category' ? 'Categories' : 'Methods'}
              </span>
            </div>
          </div>

          {/* Interactive Legend & Breakdown List */}
          <div className="md:col-span-6 flex flex-col justify-center space-y-1.5 sm:space-y-2 max-h-64 overflow-y-auto scrollbar-none pr-1">
            <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold px-1 pb-1 border-b border-neutral-100 dark:border-[#30363d]/50">
              <span>{grouping === 'category' ? 'Category' : 'Method'}</span>
              <span>Amount / Share</span>
            </div>

            {chartData.map((item, idx) => {
              const isHovered = activeIndex === idx;
              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${
                    isHovered
                      ? 'bg-neutral-100 dark:bg-[#21262d] scale-[1.01]'
                      : 'hover:bg-neutral-50 dark:hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-neutral-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 shrink-0 font-mono">
                    <span className="font-bold text-neutral-900 dark:text-white text-xs">
                      {formatCurrency(item.value, currencyCode)}
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-[#8b949e] w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-[#21262d] text-neutral-400 dark:text-[#8b949e] flex items-center justify-center mb-2">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
            No Expense Records Found
          </h4>
          <p className="text-[11px] text-neutral-500 dark:text-[#8b949e] max-w-xs mt-1">
            {timeFilter === 'currentMonth'
              ? 'There are no recorded expenses for this calendar month yet.'
              : 'Record your first transaction to view visual category breakdown.'}
          </p>
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>+ Record Expense</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpensePieChart;
