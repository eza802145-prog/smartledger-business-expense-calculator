import React from 'react';
import { AlertCircle, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { formatNaira, validatePositiveAmount } from '../utils/ledger';

interface IncomePanelProps {
  incomeRaw: string;
  incomeTouched: boolean;
  onIncomeChange: (value: string) => void;
  onIncomeBlur: () => void;
  onReset: () => void;
  onRequestClearAll: () => void;
  hasData: boolean;
}

export const IncomePanel: React.FC<IncomePanelProps> = ({
  incomeRaw,
  incomeTouched,
  onIncomeChange,
  onIncomeBlur,
  onReset,
  onRequestClearAll,
  hasData,
}) => {
  const validation = validatePositiveAmount(incomeRaw, 'Total income', {
    allowBlank: false,
  });

  // Show error immediately if user types an invalid/negative/zero value,
  // or if field was touched and left blank.
  const showError =
    !validation.valid && (incomeRaw.trim() !== '' || incomeTouched);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            1. Business Income
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter your total sales or business revenue in Nigerian Naira (₦).
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="income-input"
          className="block text-sm font-medium text-slate-800 mb-2"
        >
          Total Business Income (₦)
        </label>

        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-mono text-base font-semibold text-slate-500"
          >
            ₦
          </span>
          <input
            id="income-input"
            type="text"
            inputMode="decimal"
            value={incomeRaw}
            onChange={(e) => onIncomeChange(e.target.value)}
            onBlur={onIncomeBlur}
            placeholder="e.g. 250000"
            aria-invalid={showError}
            aria-describedby={showError ? 'income-error' : 'income-help'}
            className={`w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-lg border font-mono text-base sm:text-lg tabular-nums text-slate-900 placeholder:text-slate-400 placeholder:font-sans transition-colors focus:outline-none focus:ring-2 ${
              showError
                ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
            }`}
          />
        </div>

        {showError ? (
          <p
            id="income-error"
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-xs sm:text-sm text-rose-700"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{validation.error}</span>
          </p>
        ) : validation.valid ? (
          <p
            id="income-help"
            className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm text-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Recorded income:{' '}
              <strong className="font-mono tabular-nums">
                {formatNaira(validation.value)}
              </strong>
            </span>
          </p>
        ) : (
          <p id="income-help" className="mt-2 text-xs text-slate-500">
            Positive numerical amounts only (commas like 250,000 are accepted).
          </p>
        )}
      </div>

      {/* Workspace Actions: Reset & Clear All */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          disabled={!hasData}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={onRequestClearAll}
          disabled={!hasData}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 hover:border-rose-300 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
};
