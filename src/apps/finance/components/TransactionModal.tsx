/**
 * @file TransactionModal.tsx
 * @description Modal dialog for adding or editing financial transactions.
 */

import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, Calendar, Tag, CreditCard, ArrowRightLeft, FileText } from 'lucide-react';
import { FinanceTransaction, FinanceAccount, FinanceCategory, PaymentMethod, TransactionType } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<FinanceTransaction> & { id: string; title: string; amount: number; type: TransactionType; category: FinanceCategory; date: string; accountId: string; paymentMethod: PaymentMethod }) => Promise<void>;
  transactionToEdit?: FinanceTransaction | null;
  accounts: FinanceAccount[];
  currencyCode?: string;
  initialType?: TransactionType;
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
  'Salary',
  'Freelance & Business',
  'Investment & Dividends',
  'Loan Payment',
  'Debt Repayment',
  'Gifts & Donations',
  'Travel',
  'Subscriptions',
  'Other'
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  accounts,
  currencyCode = 'USD',
  initialType = 'expense'
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<FinanceCategory>('Food & Dining');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc-checking');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || 'acc-savings');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_account');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setTitle(transactionToEdit.title);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setAccountId(transactionToEdit.accountId);
      setToAccountId(transactionToEdit.toAccountId || accounts[1]?.id || 'acc-savings');
      setPaymentMethod(transactionToEdit.paymentMethod);
      setNotes(transactionToEdit.notes || '');
      setTags(transactionToEdit.tags || []);
    } else {
      setType(initialType);
      setTitle('');
      setAmount('');
      setCategory(initialType === 'income' ? 'Salary' : 'Food & Dining');
      setDate(new Date().toISOString().slice(0, 10));
      setAccountId(accounts[0]?.id || 'acc-checking');
      setToAccountId(accounts[1]?.id || 'acc-savings');
      setPaymentMethod('bank_account');
      setNotes('');
      setTags([]);
    }
  }, [transactionToEdit, isOpen, initialType, accounts]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: transactionToEdit ? transactionToEdit.id : `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        amount: parsedAmount,
        type,
        category,
        date,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        tags,
        createdAt: transactionToEdit ? transactionToEdit.createdAt : new Date().toISOString(),
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
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm ${
              type === 'expense' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
              type === 'income' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              'bg-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}>
              {type === 'expense' ? '-' : type === 'income' ? '+' : '⇄'}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-[#8b949e]">Harmony Ledger & Cash Flow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-500 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 flex-1 scrollbar-none text-xs">
          {/* Type Selector Pills */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-[#0d1117] rounded-xl border border-neutral-200 dark:border-[#30363d]">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Food & Dining'); }}
              className={`py-1.5 rounded-lg font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Salary'); }}
              className={`py-1.5 rounded-lg font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => { setType('transfer'); setCategory('Other'); }}
              className={`py-1.5 rounded-lg font-semibold transition-all ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">
                Amount ({currencyCode}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 dark:text-[#8b949e] font-mono text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl pl-8 pr-3 py-2 text-neutral-900 dark:text-white font-mono text-sm font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">
                Description / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grocery Store, Client Payment"
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FinanceCategory)}
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Source Account & Destination Account (if transfer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">
                {type === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">To Account</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
                >
                  {accounts.filter(a => a.id !== accountId).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
                >
                  <option value="bank_account">Bank Account / Transfer</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="crypto">Crypto Wallet</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Receipt details, tax memo, merchant location..."
              className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Tags (Press Enter)</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1 text-[10px]">
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-neutral-900 dark:hover:text-white">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag (e.g. TaxDeductible, Vacation, ProjectX)..."
              className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-1.5 text-neutral-900 dark:text-white focus:outline-none text-[11px]"
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
              <span>{isSubmitting ? 'Saving...' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
