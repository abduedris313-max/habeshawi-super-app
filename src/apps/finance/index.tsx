/**
 * @file index.tsx
 * @description Harmony Finance & Ledger Mini App Module.
 * Complete financial services suite: Expense & Income tracking, multi-category budgeting,
 * general ledger & accounts, loan EMI & debt payoff tracking, subscriptions, and AI financial advisor.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  Wallet, 
  PieChart, 
  Landmark, 
  Clock, 
  Sparkles, 
  Plus, 
  ArrowRightLeft, 
  Layers, 
  ChevronLeft,
  Settings,
  ShieldCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { 
  FinanceTransaction, 
  FinanceAccount, 
  FinanceLoan, 
  FinanceBudget, 
  FinanceSubscription, 
  FinanceTab,
  TransactionType,
  FinanceCategory,
  PaymentMethod
} from './types';
import { SUPPORTED_CURRENCIES } from './lib/calculations';
import { FinanceOverview } from './components/FinanceOverview';
import { ExpenseTrackerView } from './components/ExpenseTrackerView';
import { BudgetingView } from './components/BudgetingView';
import { LedgerAccountsView } from './components/LedgerAccountsView';
import { LoanTrackerView } from './components/LoanTrackerView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { FinanceAiAdvisorView } from './components/FinanceAiAdvisorView';
import { TransactionModal } from './components/TransactionModal';
import { LoanModal } from './components/LoanModal';
import { SystemUser } from '../../types';
import {
  saveFinanceTransaction,
  deleteFinanceTransaction,
  subscribeFinanceTransactions,
  saveFinanceBudget,
  deleteFinanceBudget,
  subscribeFinanceBudgets,
  saveFinanceAccount,
  deleteFinanceAccount,
  subscribeFinanceAccounts,
  saveFinanceLoan,
  deleteFinanceLoan,
  subscribeFinanceLoans,
  saveFinanceSubscription,
  deleteFinanceSubscription,
  subscribeFinanceSubscriptions
} from '../../lib/firebase';
import {
  getLocalItem,
  setLocalItem,
  STORAGE_KEYS,
  INITIAL_OFFLINE_FINANCE_TRANSACTIONS,
  INITIAL_OFFLINE_FINANCE_ACCOUNTS,
  INITIAL_OFFLINE_FINANCE_BUDGETS,
  INITIAL_OFFLINE_FINANCE_LOANS,
  INITIAL_OFFLINE_FINANCE_SUBSCRIPTIONS
} from '../../lib/offlinePersistence';
import { useTheme } from '../../hooks/useTheme';

interface HarmonyFinanceAppModuleProps {
  user?: SystemUser | null;
}

export const HarmonyFinanceAppModule: React.FC<HarmonyFinanceAppModuleProps> = ({ user }) => {
  const theme = useTheme();
  const userId = user?.uid || 'offline-user';

  // Active Tab
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');

  // Active Currency
  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    return localStorage.getItem('harmony_finance_currency') || 'USD';
  });

  // State: Transactions
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => {
    return getLocalItem<FinanceTransaction[]>(
      STORAGE_KEYS.FINANCE_TRANSACTIONS,
      INITIAL_OFFLINE_FINANCE_TRANSACTIONS
    );
  });

  // State: Accounts
  const [accounts, setAccounts] = useState<FinanceAccount[]>(() => {
    return getLocalItem<FinanceAccount[]>(
      STORAGE_KEYS.FINANCE_ACCOUNTS,
      INITIAL_OFFLINE_FINANCE_ACCOUNTS
    );
  });

  // State: Budgets
  const [budgets, setBudgets] = useState<FinanceBudget[]>(() => {
    return getLocalItem<FinanceBudget[]>(
      STORAGE_KEYS.FINANCE_BUDGETS,
      INITIAL_OFFLINE_FINANCE_BUDGETS
    );
  });

  // State: Loans
  const [loans, setLoans] = useState<FinanceLoan[]>(() => {
    return getLocalItem<FinanceLoan[]>(
      STORAGE_KEYS.FINANCE_LOANS,
      INITIAL_OFFLINE_FINANCE_LOANS
    );
  });

  // State: Subscriptions
  const [subscriptions, setSubscriptions] = useState<FinanceSubscription[]>(() => {
    return getLocalItem<FinanceSubscription[]>(
      STORAGE_KEYS.FINANCE_SUBSCRIPTIONS,
      INITIAL_OFFLINE_FINANCE_SUBSCRIPTIONS
    );
  });

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<FinanceTransaction | null>(null);
  const [initialTxType, setInitialTxType] = useState<TransactionType>('expense');

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<FinanceLoan | null>(null);

  // Currency Selection toggle
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Firestore Subscriptions
  useEffect(() => {
    if (!userId || userId === 'offline-user') return;

    const unsubTx = subscribeFinanceTransactions(userId, (cloudTx) => {
      if (cloudTx && cloudTx.length > 0) {
        setTransactions(cloudTx);
        setLocalItem(STORAGE_KEYS.FINANCE_TRANSACTIONS, cloudTx);
      }
    });

    const unsubAcc = subscribeFinanceAccounts(userId, (cloudAcc) => {
      if (cloudAcc && cloudAcc.length > 0) {
        setAccounts(cloudAcc);
        setLocalItem(STORAGE_KEYS.FINANCE_ACCOUNTS, cloudAcc);
      }
    });

    const unsubBud = subscribeFinanceBudgets(userId, (cloudBud) => {
      if (cloudBud && cloudBud.length > 0) {
        setBudgets(cloudBud);
        setLocalItem(STORAGE_KEYS.FINANCE_BUDGETS, cloudBud);
      }
    });

    const unsubLoans = subscribeFinanceLoans(userId, (cloudLoans) => {
      if (cloudLoans && cloudLoans.length > 0) {
        setLoans(cloudLoans);
        setLocalItem(STORAGE_KEYS.FINANCE_LOANS, cloudLoans);
      }
    });

    const unsubSubs = subscribeFinanceSubscriptions(userId, (cloudSubs) => {
      if (cloudSubs && cloudSubs.length > 0) {
        setSubscriptions(cloudSubs);
        setLocalItem(STORAGE_KEYS.FINANCE_SUBSCRIPTIONS, cloudSubs);
      }
    });

    return () => {
      unsubTx();
      unsubAcc();
      unsubBud();
      unsubLoans();
      unsubSubs();
    };
  }, [userId]);

  const handleSelectCurrency = (code: string) => {
    setCurrencyCode(code);
    localStorage.setItem('harmony_finance_currency', code);
    setIsCurrencyDropdownOpen(false);
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: Transactions
  // ---------------------------------------------------------------------------
  const handleSaveTransaction = async (txData: Partial<FinanceTransaction> & { id: string; title: string; amount: number; type: TransactionType; category: FinanceCategory; date: string; accountId: string; paymentMethod: PaymentMethod }) => {
    const updated = [
      txData as FinanceTransaction,
      ...transactions.filter(t => t.id !== txData.id)
    ];
    setTransactions(updated);
    setLocalItem(STORAGE_KEYS.FINANCE_TRANSACTIONS, updated);

    // Auto-update account balances
    setAccounts(prevAccounts => {
      return prevAccounts.map(acc => {
        if (acc.id === txData.accountId) {
          const delta = txData.type === 'expense' ? -txData.amount : txData.type === 'income' ? txData.amount : -txData.amount;
          return { ...acc, balance: Math.round((acc.balance + delta) * 100) / 100 };
        }
        if (txData.type === 'transfer' && acc.id === txData.toAccountId) {
          return { ...acc, balance: Math.round((acc.balance + txData.amount) * 100) / 100 };
        }
        return acc;
      });
    });

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await saveFinanceTransaction(userId, txData);
      } catch (err) {
        console.warn('[Finance Save Tx Cloud Error]', err);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const filtered = transactions.filter(t => t.id !== id);
    setTransactions(filtered);
    setLocalItem(STORAGE_KEYS.FINANCE_TRANSACTIONS, filtered);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await deleteFinanceTransaction(id);
      } catch (err) {
        console.warn('[Finance Delete Tx Cloud Error]', err);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: Accounts
  // ---------------------------------------------------------------------------
  const handleSaveAccount = async (accData: Partial<FinanceAccount> & { id: string; name: string; type: any; balance: number }) => {
    const updated = [
      accData as FinanceAccount,
      ...accounts.filter(a => a.id !== accData.id)
    ];
    setAccounts(updated);
    setLocalItem(STORAGE_KEYS.FINANCE_ACCOUNTS, updated);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await saveFinanceAccount(userId, accData);
      } catch (err) {
        console.warn('[Finance Save Account Cloud Error]', err);
      }
    }
  };

  const handleDeleteAccount = async (id: string) => {
    const filtered = accounts.filter(a => a.id !== id);
    setAccounts(filtered);
    setLocalItem(STORAGE_KEYS.FINANCE_ACCOUNTS, filtered);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await deleteFinanceAccount(id);
      } catch (err) {
        console.warn('[Finance Delete Account Cloud Error]', err);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: Budgets
  // ---------------------------------------------------------------------------
  const handleSaveBudget = async (bData: Partial<FinanceBudget> & { id: string; category: FinanceCategory; monthlyLimit: number }) => {
    const updated = [
      bData as FinanceBudget,
      ...budgets.filter(b => b.id !== bData.id)
    ];
    setBudgets(updated);
    setLocalItem(STORAGE_KEYS.FINANCE_BUDGETS, updated);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await saveFinanceBudget(userId, bData);
      } catch (err) {
        console.warn('[Finance Save Budget Cloud Error]', err);
      }
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const filtered = budgets.filter(b => b.id !== id);
    setBudgets(filtered);
    setLocalItem(STORAGE_KEYS.FINANCE_BUDGETS, filtered);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await deleteFinanceBudget(id);
      } catch (err) {
        console.warn('[Finance Delete Budget Cloud Error]', err);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: Loans
  // ---------------------------------------------------------------------------
  const handleSaveLoan = async (loanData: Partial<FinanceLoan> & { id: string }) => {
    const updated = [
      loanData as FinanceLoan,
      ...loans.filter(l => l.id !== loanData.id)
    ];
    setLoans(updated);
    setLocalItem(STORAGE_KEYS.FINANCE_LOANS, updated);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await saveFinanceLoan(userId, loanData as any);
      } catch (err) {
        console.warn('[Finance Save Loan Cloud Error]', err);
      }
    }
  };

  const handleDeleteLoan = async (id: string) => {
    const filtered = loans.filter(l => l.id !== id);
    setLoans(filtered);
    setLocalItem(STORAGE_KEYS.FINANCE_LOANS, filtered);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await deleteFinanceLoan(id);
      } catch (err) {
        console.warn('[Finance Delete Loan Cloud Error]', err);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: Subscriptions
  // ---------------------------------------------------------------------------
  const handleSaveSubscription = async (subData: Partial<FinanceSubscription> & { id: string; name: string; amount: number; billingCycle: any; nextBillingDate: string; category: FinanceCategory }) => {
    const updated = [
      subData as FinanceSubscription,
      ...subscriptions.filter(s => s.id !== subData.id)
    ];
    setSubscriptions(updated);
    setLocalItem(STORAGE_KEYS.FINANCE_SUBSCRIPTIONS, updated);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await saveFinanceSubscription(userId, subData);
      } catch (err) {
        console.warn('[Finance Save Sub Cloud Error]', err);
      }
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    const filtered = subscriptions.filter(s => s.id !== id);
    setSubscriptions(filtered);
    setLocalItem(STORAGE_KEYS.FINANCE_SUBSCRIPTIONS, filtered);

    if (navigator.onLine && userId !== 'offline-user') {
      try {
        await deleteFinanceSubscription(id);
      } catch (err) {
        console.warn('[Finance Delete Sub Cloud Error]', err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 dark:bg-[#0d1117] text-neutral-900 dark:text-white overflow-hidden select-none">
      {/* Mini App Top Header Bar (Compact & Responsive) */}
      <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-white dark:bg-[#161b22] border-b border-neutral-200 dark:border-[#30363d] flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs font-bold text-xs shrink-0">
            <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-1 sm:gap-1.5 truncate">
              <span className="truncate">Habeshawi Finance</span>
              <span className="hidden xs:inline text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-mono border border-emerald-500/30 shrink-0">
                PRO
              </span>
            </h1>
            <p className="hidden sm:block text-[10px] text-neutral-500 dark:text-[#8b949e] truncate">Personal & Business Wealth Management</p>
          </div>
        </div>

        {/* Currency & Quick Add */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Currency Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-neutral-200 dark:border-[#30363d] text-[11px] sm:text-xs font-mono font-bold text-neutral-800 dark:text-white flex items-center gap-1 transition-colors"
              title="Change Display Currency"
            >
              <span>{currencyCode}</span>
              <span className="text-[8px] text-neutral-500 dark:text-[#8b949e]">▼</span>
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 sm:w-44 bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-[#30363d] rounded-xl shadow-2xl p-1 z-50 text-xs font-mono max-h-56 overflow-y-auto scrollbar-none">
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => handleSelectCurrency(curr.code)}
                    className={`w-full px-2 py-1 rounded-lg flex items-center justify-between text-left transition-colors ${
                      currencyCode === curr.code
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-neutral-700 dark:text-[#c9d1d9] hover:bg-neutral-100 dark:hover:bg-[#21262d] hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{curr.code} ({curr.symbol})</span>
                    <span className="text-[9px] opacity-70">{curr.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setTransactionToEdit(null);
              setInitialTxType('expense');
              setIsTransactionModalOpen(true);
            }}
            className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Record</span>
          </button>
        </div>
      </div>

      {/* iOS Segmented Navigation Tab Bar (Compact & Responsive) */}
      <div className="px-2 py-1 sm:py-1.5 bg-neutral-100/90 dark:bg-[#161b22]/90 border-b border-neutral-200 dark:border-[#30363d]/60 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {[
          { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: ShieldCheck },
          { id: 'expenses', label: 'Transactions', shortLabel: 'Activity', icon: Wallet },
          { id: 'budget', label: 'Budgets', shortLabel: 'Budgets', icon: PieChart },
          { id: 'ledger', label: 'Accounts', shortLabel: 'Accounts', icon: Landmark },
          { id: 'loans', label: 'Loans & Debts', shortLabel: 'Loans', icon: DollarSign },
          { id: 'subscriptions', label: 'Subscriptions', shortLabel: 'Subs', icon: Clock },
          { id: 'ai-advisor', label: 'AI Advisor', shortLabel: 'Advisor', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-white dark:bg-[#0d1117] text-neutral-600 dark:text-[#8b949e] hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#21262d] border border-neutral-200 dark:border-[#30363d]/60'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content View */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3.5 md:p-4 scrollbar-none">
        {activeTab === 'overview' && (
          <FinanceOverview
            transactions={transactions}
            accounts={accounts}
            loans={loans}
            budgets={budgets}
            subscriptions={subscriptions}
            currencyCode={currencyCode}
            onOpenAddTransaction={(type) => {
              setTransactionToEdit(null);
              setInitialTxType(type || 'expense');
              setIsTransactionModalOpen(true);
            }}
            onOpenAddLoan={() => {
              setLoanToEdit(null);
              setIsLoanModalOpen(true);
            }}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTrackerView
            transactions={transactions}
            accounts={accounts}
            currencyCode={currencyCode}
            onOpenAddModal={(type) => {
              setTransactionToEdit(null);
              setInitialTxType(type || 'expense');
              setIsTransactionModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setTransactionToEdit(tx);
              setIsTransactionModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetingView
            budgets={budgets}
            transactions={transactions}
            currencyCode={currencyCode}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerAccountsView
            accounts={accounts}
            transactions={transactions}
            currencyCode={currencyCode}
            onSaveAccount={handleSaveAccount}
            onDeleteAccount={handleDeleteAccount}
            onOpenTransferModal={() => {
              setTransactionToEdit(null);
              setInitialTxType('transfer');
              setIsTransactionModalOpen(true);
            }}
          />
        )}

        {activeTab === 'loans' && (
          <LoanTrackerView
            loans={loans}
            currencyCode={currencyCode}
            onOpenAddLoan={() => {
              setLoanToEdit(null);
              setIsLoanModalOpen(true);
            }}
            onEditLoan={(l) => {
              setLoanToEdit(l);
              setIsLoanModalOpen(true);
            }}
            onDeleteLoan={handleDeleteLoan}
            onSaveLoan={handleSaveLoan}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsView
            subscriptions={subscriptions}
            accounts={accounts}
            currencyCode={currencyCode}
            onSaveSubscription={handleSaveSubscription}
            onDeleteSubscription={handleDeleteSubscription}
          />
        )}

        {activeTab === 'ai-advisor' && (
          <FinanceAiAdvisorView
            transactions={transactions}
            accounts={accounts}
            loans={loans}
            budgets={budgets}
            subscriptions={subscriptions}
            currencyCode={currencyCode}
          />
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
        accounts={accounts}
        currencyCode={currencyCode}
        initialType={initialTxType}
      />

      {/* Loan Modal */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSave={handleSaveLoan as any}
        loanToEdit={loanToEdit}
        currencyCode={currencyCode}
      />
    </div>
  );
};

export default HarmonyFinanceAppModule;
