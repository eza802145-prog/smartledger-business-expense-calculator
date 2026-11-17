import React, { useState } from 'react';
import { AlertCircle, Plus, ReceiptText, Trash2 } from 'lucide-react';
import {
  ExpenseItem,
  formatNaira,
  validateExpenseDescription,
  validatePositiveAmount,
} from '../utils/ledger';

interface ExpensePanelProps {
  expenses: ExpenseItem[];
  totalExpenses: number;
  onAddExpense: (description: string, amountRaw: string) => void;
  onUpdateExpense: (id: string, field: 'description' | 'amountRaw', value: string) => void;
  onRemoveExpense: (id: string) => void;
}

export const ExpensePanel: React.FC<ExpensePanelProps> = ({
  expenses,
  totalExpenses,
  onAddExpense,
  onUpdateExpense,
  onRemoveExpense,
}) => {
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [descError, setDescError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dErr = validateExpenseDescription(newDescription);
    const aCheck = validatePositiveAmount(newAmount, 'Expense amount');

    setDescError(dErr);
    setAmountError(aCheck.error);

    if (dErr || !aCheck.valid) {
      return;
    }

    onAddExpense(newDescription.trim(), newAmount.trim());
    setNewDescription('');
    setNewAmount('');
    setDescError(null);
    setAmountError(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            2. Business Expenses
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Add each operating cost below. Amounts update your net profit immediately.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
          {expenses.length} {expenses.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Add Expense Form */}
      <form onSubmit={handleAddSubmit} noValidate className="mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <div className="sm:col-span-6">
            <label
              htmlFor="new-expense-description"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Expense Description
            </label>
            <input
              id="new-expense-description"
              type="text"
              value={newDescription}
              onChange={(e) => {
                setNewDescription(e.target.value);
                if (descError) setDescError(null);
              }}
              placeholder="e.g. Shop Rent, Fuel, Stock"
              aria-invalid={Boolean(descError)}
              aria-describedby={descError ? 'new-desc-error' : undefined}
              className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                descError
                  ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
            {descError && (
              <p
                id="new-desc-error"
                role="alert"
                className="mt-1.5 flex items-start gap-1 text-xs text-rose-700"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{descError}</span>
              </p>
            )}
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="new-expense-amount"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Amount (₦)
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-sm font-semibold text-slate-500"
              >
                ₦
              </span>
              <input
                id="new-expense-amount"
                type="text"
                inputMode="decimal"
                value={newAmount}
                onChange={(e) => {
                  setNewAmount(e.target.value);
                  if (amountError) setAmountError(null);
                }}
                placeholder="25000"
                aria-invalid={Boolean(amountError)}
                aria-describedby={amountError ? 'new-amount-error' : undefined}
                className={`w-full min-h-[44px] pl-7 pr-3 py-2 rounded-lg border font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 placeholder:font-sans transition-colors focus:outline-none focus:ring-2 ${
                  amountError
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
            </div>
            {amountError && (
              <p
                id="new-amount-error"
                role="alert"
                className="mt-1.5 flex items-start gap-1 text-xs text-rose-700"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{amountError}</span>
              </p>
            )}
          </div>

          <div className="sm:col-span-3 sm:pt-[22px]">
            <button
              type="submit"
              className="w-full min-h-[44px] px-4 py-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </form>

      {/* Expense Ledger List */}
      <div className="mt-6 border-t border-slate-200 pt-4">
        {expenses.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-lg bg-slate-50 border border-dashed border-slate-200">
            <ReceiptText
              className="w-8 h-8 text-slate-400 mx-auto mb-2.5"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-700">
              No expenses added yet
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Use the form above to record business costs like inventory restock, shop rent, fuel, or staff wages.
            </p>
          </div>
        ) : (
          <div>
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-2 pb-2 text-xs font-medium text-slate-500 border-b border-slate-100">
              <div className="sm:col-span-6">Description</div>
              <div className="sm:col-span-4 text-right">Amount (₦)</div>
              <div className="sm:col-span-2 text-right">Action</div>
            </div>

            <ul className="divide-y divide-slate-100" aria-label="Recorded expenses">
              {expenses.map((item, idx) => {
                const rowDescError = validateExpenseDescription(item.description);
                const rowAmountCheck = validatePositiveAmount(
                  item.amountRaw,
                  'Amount'
                );
                const hasRowError = Boolean(rowDescError || !rowAmountCheck.valid);

                return (
                  <li key={item.id} className="py-3 px-1 sm:px-2">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                      <div className="sm:col-span-6">
                        <label
                          htmlFor={`expense-desc-${item.id}`}
                          className="sr-only"
                        >
                          Expense {idx + 1} description
                        </label>
                        <input
                          id={`expense-desc-${item.id}`}
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            onUpdateExpense(item.id, 'description', e.target.value)
                          }
                          placeholder="Expense description"
                          aria-invalid={Boolean(rowDescError)}
                          className={`w-full min-h-[42px] px-3 py-1.5 rounded-lg border text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                            rowDescError
                              ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-blue-600/20'
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-4 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-sm font-medium text-slate-500"
                          >
                            ₦
                          </span>
                          <label
                            htmlFor={`expense-amt-${item.id}`}
                            className="sr-only"
                          >
                            Expense {idx + 1} amount in Naira
                          </label>
                          <input
                            id={`expense-amt-${item.id}`}
                            type="text"
                            inputMode="decimal"
                            value={item.amountRaw}
                            onChange={(e) =>
                              onUpdateExpense(item.id, 'amountRaw', e.target.value)
                            }
                            placeholder="0.00"
                            aria-invalid={!rowAmountCheck.valid}
                            className={`w-full min-h-[42px] pl-7 pr-3 py-1.5 rounded-lg border font-mono text-sm tabular-nums text-right text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                              !rowAmountCheck.valid
                                ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                                : 'border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-blue-600/20'
                            }`}
                          />
                        </div>

                        {/* Mobile Remove Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveExpense(item.id)}
                          aria-label={`Remove ${item.description || 'expense'}`}
                          className="sm:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Desktop Remove Button */}
                      <div className="hidden sm:flex sm:col-span-2 justify-end">
                        <button
                          type="button"
                          onClick={() => onRemoveExpense(item.id)}
                          aria-label={`Remove ${item.description || 'expense'}`}
                          className="min-h-[40px] px-2.5 inline-flex items-center justify-center gap-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {hasRowError && (
                      <p
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-700"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{rowDescError || rowAmountCheck.error}</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Subtotal Row */}
            <div className="mt-3 pt-3.5 border-t border-slate-200 flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-slate-700">
                Total Valid Expenses
              </span>
              <span className="font-mono text-base sm:text-lg font-bold tabular-nums text-slate-900">
                {formatNaira(totalExpenses)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
