import React from 'react';
import { Calculator } from 'lucide-react';

export const ProfitExplanation: React.FC = () => {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20 bg-white border border-slate-200 rounded-xl p-5 sm:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2
            id="how-it-works-heading"
            className="font-display text-lg sm:text-xl font-bold text-slate-900"
          >
            How Net Profit Is Calculated
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            SmartLedger subtracts all recorded business expenses from your total business income to show whether your business made a profit or a loss.
          </p>
        </div>

        <div className="inline-flex items-center gap-2.5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 shrink-0">
          <Calculator className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
          <span className="font-mono text-xs sm:text-sm font-semibold text-blue-900 whitespace-nowrap">
            Net Profit = Total Income − Total Expenses
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-display text-sm font-bold text-emerald-800">
            01. When You Make a Profit
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            If your total income is higher than your total expenses, the result is positive. This surplus is your net profit for the period.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-blue-800">
            02. When You Break Even
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            If your total income equals your total expenses, your net figure is{' '}
            <span className="font-mono font-medium text-slate-800">₦0.00</span>. Your revenue covered all costs with no surplus or shortfall.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-rose-800">
            03. When You Record a Loss
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            If your total expenses exceed your total income, the result is negative and clearly marked as a <strong>Net Loss</strong> so you can review your highest costs.
          </p>
        </div>
      </div>
    </section>
  );
};
