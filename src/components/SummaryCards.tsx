import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  PieChart,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { formatNaira, formatPercent, LedgerSummary } from '../utils/ledger';

interface SummaryCardsProps {
  summary: LedgerSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const {
    totalIncome,
    totalExpenses,
    netProfit,
    status,
    validExpenseCount,
    expenseRatioPercent,
    profitMarginPercent,
  } = summary;

  const isLoss = status === 'loss';
  const isProfit = status === 'profit';
  const isBreakEven = status === 'break-even';

  const netCardStyles = isProfit
    ? 'bg-emerald-50/75 border-emerald-200'
    : isLoss
      ? 'bg-rose-50/85 border-rose-200'
      : isBreakEven
        ? 'bg-blue-50/75 border-blue-200'
        : 'bg-white border-slate-200';

  const netAmountColor = isProfit
    ? 'text-emerald-800'
    : isLoss
      ? 'text-rose-700'
      : isBreakEven
        ? 'text-blue-800'
        : 'text-slate-900';

  const netHeadingLabel = isProfit
    ? 'Net Profit'
    : isLoss
      ? 'Net Loss'
      : isBreakEven
        ? 'Break-Even'
        : 'Net Profit / Loss';

  const barRatio = Math.min(Math.max(expenseRatioPercent, 0), 100);
  const marginPositive = totalIncome > 0 && profitMarginPercent > 0;
  const marginNegative = totalIncome > 0 && profitMarginPercent < 0;
  const ratioHigh = totalIncome > 0 && expenseRatioPercent > 100;

  return (
    <section id="summary" aria-labelledby="summary-heading" className="scroll-mt-20">
      <div className="sr-only">
        <h2 id="summary-heading">Financial Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Card 1: Total Income */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-600">Total Income</span>
            <span
              className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Wallet className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4">
            <p
              className="font-mono text-2xl sm:text-[1.75rem] font-bold tracking-tight text-slate-900 tabular-nums break-all"
              data-testid="summary-total-income"
            >
              {formatNaira(totalIncome)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
              <span>Total business revenue</span>
            </p>
          </div>
        </article>

        {/* Card 2: Total Expenses */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-600">Total Expenses</span>
            <span
              className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Receipt className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-4">
            <p
              className="font-mono text-2xl sm:text-[1.75rem] font-bold tracking-tight text-slate-900 tabular-nums break-all"
              data-testid="summary-total-expenses"
            >
              {formatNaira(totalExpenses)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span>
                {validExpenseCount === 0
                  ? 'No expenses recorded'
                  : validExpenseCount === 1
                    ? '1 expense item recorded'
                    : `${validExpenseCount} expense items recorded`}
              </span>
            </p>
          </div>
        </article>

        {/* Card 3: Net Profit / Loss */}
        <article
          className={`border rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-colors ${netCardStyles}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-sm font-semibold ${
                isProfit
                  ? 'text-emerald-800'
                  : isLoss
                    ? 'text-rose-800'
                    : isBreakEven
                      ? 'text-blue-800'
                      : 'text-slate-700'
              }`}
              data-testid="summary-net-label"
            >
              {netHeadingLabel}
            </span>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isProfit
                  ? 'bg-emerald-100 text-emerald-700'
                  : isLoss
                    ? 'bg-rose-100 text-rose-700'
                    : isBreakEven
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
              }`}
              aria-hidden="true"
            >
              {isProfit ? (
                <TrendingUp className="w-4 h-4" />
              ) : isLoss ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <Scale className="w-4 h-4" />
              )}
            </span>
          </div>

          <div className="mt-4">
            <p
              className={`font-mono text-2xl sm:text-[1.75rem] font-bold tracking-tight tabular-nums break-all ${netAmountColor}`}
              data-testid="summary-net-profit"
            >
              {formatNaira(netProfit)}
            </p>
            <p
              className={`mt-1.5 text-xs font-medium ${
                isProfit
                  ? 'text-emerald-700'
                  : isLoss
                    ? 'text-rose-700'
                    : isBreakEven
                      ? 'text-blue-700'
                      : 'text-slate-500'
              }`}
            >
              {isProfit && (
                <>
                  Surplus earned · {formatPercent(profitMarginPercent)} profit margin
                </>
              )}
              {isLoss && (
                <>Loss · Expenses exceed income by {formatNaira(Math.abs(netProfit))}</>
              )}
              {isBreakEven && <>Income equals expenses · Zero profit or loss</>}
              {status === 'empty' && <>Enter income and expenses below to calculate</>}
            </p>
          </div>
        </article>
      </div>

      {/* Two Neat Financial Indicators: Profit Margin & Expense-to-Income Ratio */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        {/* Indicator 1: Profit Margin */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Profit Margin</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                (Net Profit ÷ Total Income) × 100
              </p>
            </div>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                marginPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : marginNegative
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-blue-50 text-blue-700'
              }`}
              aria-hidden="true"
            >
              <Percent className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3.5 flex items-baseline justify-between gap-3">
            <p
              className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${
                marginPositive
                  ? 'text-emerald-700'
                  : marginNegative
                    ? 'text-rose-700'
                    : 'text-slate-900'
              }`}
              data-testid="indicator-profit-margin"
            >
              {formatPercent(profitMarginPercent)}
            </p>
            <span
              className={`text-xs font-medium ${
                marginPositive
                  ? 'text-emerald-700'
                  : marginNegative
                    ? 'text-rose-700'
                    : 'text-slate-500'
              }`}
            >
              {totalIncome === 0
                ? 'No income entered'
                : marginPositive
                  ? 'Profitable margin'
                  : marginNegative
                    ? 'Negative margin (loss)'
                    : 'Break-even margin'}
            </span>
          </div>
        </article>

        {/* Indicator 2: Expense-to-Income Ratio */}
        <article className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Expense-to-Income Ratio
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                (Total Expenses ÷ Total Income) × 100
              </p>
            </div>
            <span
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                ratioHigh ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
              }`}
              aria-hidden="true"
            >
              <PieChart className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3.5">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p
                className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${
                  ratioHigh
                    ? 'text-rose-700'
                    : totalIncome > 0
                      ? 'text-blue-700'
                      : 'text-slate-900'
                }`}
                data-testid="indicator-expense-ratio"
              >
                {formatPercent(expenseRatioPercent)}
              </p>
              <span
                className={`text-xs font-medium ${
                  ratioHigh ? 'text-rose-700' : 'text-slate-500'
                }`}
              >
                {totalIncome === 0
                  ? 'No income entered'
                  : ratioHigh
                    ? 'Expenses exceed income'
                    : `${formatPercent(expenseRatioPercent)} of income spent`}
              </span>
            </div>

            <div
              className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(barRatio)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Expense to income ratio"
            >
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  ratioHigh ? 'bg-rose-600' : 'bg-blue-700'
                }`}
                style={{ width: `${barRatio}%` }}
              />
            </div>
          </div>
        </article>
      </div>

      {/* Explicit Loss Notice */}
      {isLoss && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs sm:text-sm text-rose-800"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>Business Loss Alert:</strong> Your total expenses ({formatNaira(totalExpenses)}) exceed your total income ({formatNaira(totalIncome)}) by{' '}
            <strong className="font-mono tabular-nums">{formatNaira(Math.abs(netProfit))}</strong>.
          </span>
        </div>
      )}
    </section>
  );
};
