/**
 * @file LedgerAccountsView.tsx
 * @description General Ledger & Multi-Account Manager.
 * Supports checking, savings, cash, credit cards, and investment accounts with balance reconciliation.
 */

import React, { useState } from 'react';
import { 
  Landmark, 
  Plus, 
  ArrowRightLeft, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { FinanceAccount, FinanceTransaction, AccountType } from '../types';
import { formatCurrency } from '../lib/calculations';

interface LedgerAccountsViewProps {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  currencyCode: string;
  onSaveAccount: (acc: Partial<FinanceAccount> & { id: string; name: string; type: AccountType; balance: number }) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onOpenTransferModal: () => void;
}

export const LedgerAccountsView: React.FC<LedgerAccountsViewProps> = ({
  accounts,
  transactions,
  currencyCode,
  onSaveAccount,
  onDeleteAccount,
  onOpenTransferModal
}) => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<FinanceAccount | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  const accountTransactions = transactions.filter(
    t => t.accountId === selectedAccountId || t.toAccountId === selectedAccountId
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAssets = accounts
    .filter(a => a.type !== 'credit_card' && a.type !== 'loan')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const totalCardDebts = accounts
    .filter(a => a.type === 'credit_card' && a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const handleOpenAdd = () => {
    setAccountToEdit(null);
    setName('');
    setType('checking');
    setBalance('0');
    setInstitution('');
    setAccountNumberMasked('');
    setColor('#3b82f6');
    setIsAccountModalOpen(true);
  };

  const handleOpenEdit = (acc: FinanceAccount) => {
    setAccountToEdit(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setInstitution(acc.institution || '');
    setAccountNumberMasked(acc.accountNumberMasked || '');
    setColor(acc.color);
    setIsAccountModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(balance);
    if (!name.trim() || isNaN(bal)) return;

    await onSaveAccount({
      id: accountToEdit ? accountToEdit.id : `acc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      type,
      balance: bal,
      currency: currencyCode,
      institution: institution.trim() || undefined,
      accountNumberMasked: accountNumberMasked.trim() || undefined,
      color,
      updatedAt: new Date().toISOString()
    });

    setIsAccountModalOpen(false);
  };

  return (
    <div className="space-y-2.5 sm:space-y-4 text-neutral-900 dark:text-white">
      {/* Top Header & Account Summary */}
      <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-xs">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e]">
            General Ledger Accounts & Liquidity
          </span>
          <div className="flex items-baseline gap-3 sm:gap-4 mt-0.5 sm:mt-1">
            <div>
              <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-[#8b949e]">Liquid Assets: </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAssets, currencyCode)}
              </span>
            </div>
            {totalCardDebts > 0 && (
              <div>
                <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-[#8b949e]">Card Debt: </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                  -{formatCurrency(totalCardDebts, currencyCode)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenTransferModal}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9] text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Transfer</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-xs flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/70 dark:bg-gradient-to-br dark:from-[#1e293b] dark:to-[#0f172a] border-indigo-500/80 ring-1 ring-indigo-500/40'
                  : 'bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] hover:border-neutral-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: `${acc.color}25`, color: acc.color }}
                  >
                    {acc.type === 'checking' ? '🏦' : acc.type === 'savings' ? '💰' : acc.type === 'credit_card' ? '💳' : '💵'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">{acc.name}</h4>
                    <p className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] truncate">
                      {acc.institution || acc.type.replace('_', ' ')} {acc.accountNumberMasked ? `• ${acc.accountNumberMasked}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(acc); }}
                    className="p-1 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.id); }}
                      className="p-1 rounded-lg bg-neutral-100 dark:bg-[#21262d] hover:bg-rose-500/20 text-neutral-600 dark:text-[#8b949e] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="my-2 sm:my-3 pt-1 sm:pt-2">
                <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] uppercase font-bold">Ledger Balance</span>
                <p className={`text-base sm:text-xl font-bold font-mono ${acc.balance >= 0 ? 'text-neutral-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(acc.balance, currencyCode)}
                </p>
              </div>

              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500 dark:text-[#8b949e] pt-1.5 sm:pt-2 border-t border-neutral-200 dark:border-[#30363d]/60">
                <span className="capitalize">{acc.type.replace('_', ' ')}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">Click to view audit</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Account Audit History */}
      {selectedAccount && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#8b949e] flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{selectedAccount.name} Transaction Log ({accountTransactions.length})</span>
            </h3>
            <span className="text-xs font-mono text-neutral-900 dark:text-white font-bold">
              Balance: {formatCurrency(selectedAccount.balance, currencyCode)}
            </span>
          </div>

          <div className="space-y-2">
            {accountTransactions.length > 0 ? (
              accountTransactions.map((tx) => {
                const isDebit = tx.accountId === selectedAccount.id && tx.type === 'expense';
                const isCredit = tx.accountId === selectedAccount.id && tx.type === 'income';
                const isTransferOut = tx.accountId === selectedAccount.id && tx.type === 'transfer';
                const isTransferIn = tx.toAccountId === selectedAccount.id && tx.type === 'transfer';

                return (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d]/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h5 className="font-semibold text-neutral-900 dark:text-white">{tx.title}</h5>
                      <p className="text-[10px] text-neutral-500 dark:text-[#8b949e]">
                        {tx.date} • {tx.category} {tx.notes ? `• ${tx.notes}` : ''}
                      </p>
                    </div>

                    <span className={`font-mono font-bold ${
                      isCredit || isTransferIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isCredit || isTransferIn ? '+' : '-'}{formatCurrency(tx.amount, currencyCode)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-500 dark:text-[#8b949e] italic py-3 text-center">
                No recorded transactions for this account yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Account Add/Edit Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] text-neutral-900 dark:text-white rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl animate-fade-in text-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {accountToEdit ? 'Edit Account' : 'Add Financial Account'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main Checking, Chase Sapphire, Emergency Fund"
                  className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Account Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="cash">Cash Wallet</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="investment">Investment / Brokerage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Starting Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Bank / Institution</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Bank of America, Fidelity"
                    className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={accountNumberMasked}
                    onChange={(e) => setAccountNumberMasked(e.target.value)}
                    placeholder="e.g. 4892"
                    className="w-full bg-neutral-50 dark:bg-[#0d1117] border border-neutral-200 dark:border-[#30363d] focus:border-indigo-500 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-[#8b949e] mb-1">Color Theme</label>
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        color === c ? 'scale-125 border-indigo-600 dark:border-white' : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#21262d] hover:bg-neutral-200 dark:hover:bg-[#30363d] text-neutral-700 dark:text-[#c9d1d9] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
