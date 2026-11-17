import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ConfirmModal } from './components/ConfirmModal';
import { ExpensePanel } from './components/ExpensePanel';
import { Header } from './components/Header';
import { IncomePanel } from './components/IncomePanel';
import { ProfitExplanation } from './components/ProfitExplanation';
import { SalesModule } from './components/SalesModule';
import { SummaryCards } from './components/SummaryCards';
import {
  calculateLedgerSummary,
  ExpenseItem,
  SAMPLE_SCENARIOS,
  SampleScenario,
} from './utils/ledger';
import { SalesRecord } from './utils/sales';

const STORAGE_KEY = 'smartledger_nigeria_v1';
const SALES_STORAGE_KEY = 'smartledger_sales_records_v1';

interface SavedSnapshot {
  incomeRaw: string;
  expenses: ExpenseItem[];
}

function createRecordId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadInitialCalculatorState(): SavedSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { incomeRaw: '', expenses: [] };
    const parsed = JSON.parse(raw) as Partial<SavedSnapshot>;
    const incomeRaw = typeof parsed.incomeRaw === 'string' ? parsed.incomeRaw : '';
    const expenses = Array.isArray(parsed.expenses)
      ? parsed.expenses.filter(
          (item): item is ExpenseItem =>
            Boolean(item) &&
            typeof item.id === 'string' &&
            typeof item.description === 'string' &&
            typeof item.amountRaw === 'string'
        )
      : [];
    return { incomeRaw, expenses };
  } catch {
    return { incomeRaw: '', expenses: [] };
  }
}

function loadInitialSalesRecords(): SalesRecord[] {
  try {
    const raw = window.localStorage.getItem(SALES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SalesRecord =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.date === 'string' &&
        typeof item.productOrService === 'string' &&
        typeof item.quantityRaw === 'string' &&
        typeof item.unitPriceRaw === 'string' &&
        (item.paymentMethod === 'cash' ||
          item.paymentMethod === 'bank_transfer' ||
          item.paymentMethod === 'pos') &&
        typeof item.customerName === 'string'
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [initialSnapshot] = useState<SavedSnapshot>(() =>
    loadInitialCalculatorState()
  );
  const [incomeRaw, setIncomeRaw] = useState<string>(initialSnapshot.incomeRaw);
  const [incomeTouched, setIncomeTouched] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialSnapshot.expenses);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [undoSnapshot, setUndoSnapshot] = useState<SavedSnapshot | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(() =>
    loadInitialSalesRecords()
  );
  const [deletedSaleUndo, setDeletedSaleUndo] = useState<{
    record: SalesRecord;
    index: number;
  } | null>(null);

  useEffect(() => {
    try {
      const payload: SavedSnapshot = { incomeRaw, expenses };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or private-browsing errors cleanly
    }
  }, [incomeRaw, expenses]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesRecords));
    } catch {
      // Ignore storage quota or private-browsing errors cleanly
    }
  }, [salesRecords]);

  useEffect(() => {
    if (!undoSnapshot) return;
    const timer = window.setTimeout(() => {
      setUndoSnapshot(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [undoSnapshot]);

  useEffect(() => {
    if (!deletedSaleUndo) return;
    const timer = window.setTimeout(() => {
      setDeletedSaleUndo(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [deletedSaleUndo]);

  const summary = useMemo(
    () => calculateLedgerSummary(incomeRaw, expenses),
    [incomeRaw, expenses]
  );

  const hasData = incomeRaw.trim() !== '' || expenses.length > 0;

  const handleIncomeChange = (value: string) => {
    setIncomeRaw(value);
    setActiveScenarioId(null);
    if (undoSnapshot) setUndoSnapshot(null);
  };

  const handleAddExpense = (description: string, amountRaw: string) => {
    const newItem: ExpenseItem = {
      id: createRecordId('exp'),
      description,
      amountRaw,
    };
    setExpenses((prev) => [...prev, newItem]);
    setActiveScenarioId(null);
    if (undoSnapshot) setUndoSnapshot(null);
  };

  const handleUpdateExpense = (
    id: string,
    field: 'description' | 'amountRaw',
    value: string
  ) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setActiveScenarioId(null);
    if (undoSnapshot) setUndoSnapshot(null);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    setActiveScenarioId(null);
  };

  const handleReset = () => {
    if (!hasData) return;
    setUndoSnapshot({ incomeRaw, expenses });
    setIncomeRaw('');
    setIncomeTouched(false);
    setExpenses([]);
    setActiveScenarioId(null);
  };

  const handleUndoReset = () => {
    if (!undoSnapshot) return;
    setIncomeRaw(undoSnapshot.incomeRaw);
    setExpenses(undoSnapshot.expenses);
    setIncomeTouched(false);
    setUndoSnapshot(null);
  };

  const handleConfirmClearAll = () => {
    setIncomeRaw('');
    setIncomeTouched(false);
    setExpenses([]);
    setUndoSnapshot(null);
    setActiveScenarioId(null);
    setIsClearModalOpen(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
  };

  const handleLoadScenario = (scenario: SampleScenario) => {
    setIncomeRaw(scenario.incomeRaw);
    setIncomeTouched(false);
    setExpenses(
      scenario.expenses.map((item) => ({
        id: createRecordId('exp'),
        description: item.description,
        amountRaw: item.amountRaw,
      }))
    );
    setActiveScenarioId(scenario.id);
    setUndoSnapshot(null);
  };

  // Sales & Income Management handlers (kept independent from Profit Calculator)
  const handleAddSaleRecord = (record: Omit<SalesRecord, 'id'>) => {
    const newRecord: SalesRecord = {
      id: createRecordId('sale'),
      ...record,
    };
    setSalesRecords((prev) => [newRecord, ...prev]);
    setDeletedSaleUndo(null);
  };

  const handleUpdateSaleRecord = (updated: SalesRecord) => {
    setSalesRecords((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setDeletedSaleUndo(null);
  };

  const handleDeleteSaleRecord = (id: string) => {
    setSalesRecords((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      setDeletedSaleUndo({ record: prev[index], index });
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleUndoDeleteSale = () => {
    if (!deletedSaleUndo) return;
    setSalesRecords((prev) => {
      const next = [...prev];
      const insertAt = Math.min(deletedSaleUndo.index, next.length);
      next.splice(insertAt, 0, deletedSaleUndo.record);
      return next;
    });
    setDeletedSaleUndo(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header onReset={handleReset} hasData={hasData} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page Heading & Quick Sample Scenarios */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Business Expense &amp; Profit Calculator
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 max-w-2xl">
              Track your Nigerian Naira (₦) income and business expenses to see instant net profit or loss, and manage your sales records below.
            </p>
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Sample business scenarios"
          >
            <span className="text-xs font-medium text-slate-500 mr-1">
              Sample scenarios:
            </span>
            {SAMPLE_SCENARIOS.map((scenario) => {
              const isActive = activeScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleLoadScenario(scenario)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {scenario.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Undo Notice after Reset */}
        {undoSnapshot && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-900"
          >
            <span>Calculator reset to ₦0.00.</span>
            <button
              type="button"
              onClick={handleUndoReset}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Undo Reset</span>
            </button>
          </div>
        )}

        {/* Financial Summary Cards + Profit Margin & Expense Ratio */}
        <SummaryCards summary={summary} />

        {/* Calculator Workspace: Income + Expenses */}
        <section
          id="calculator"
          aria-label="Income and expense calculator"
          className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          <div className="lg:col-span-5">
            <IncomePanel
              incomeRaw={incomeRaw}
              incomeTouched={incomeTouched}
              onIncomeChange={handleIncomeChange}
              onIncomeBlur={() => setIncomeTouched(true)}
              onReset={handleReset}
              onRequestClearAll={() => setIsClearModalOpen(true)}
              hasData={hasData}
            />
          </div>

          <div className="lg:col-span-7">
            <ExpensePanel
              expenses={expenses}
              totalExpenses={summary.totalExpenses}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onRemoveExpense={handleRemoveExpense}
            />
          </div>
        </section>

        {/* Dedicated Sales & Income Management Module */}
        <SalesModule
          records={salesRecords}
          onAddRecord={handleAddSaleRecord}
          onUpdateRecord={handleUpdateSaleRecord}
          onDeleteRecord={handleDeleteSaleRecord}
          onUndoDelete={handleUndoDeleteSale}
          canUndoDelete={Boolean(deletedSaleUndo)}
        />

        {/* How Profit Is Calculated */}
        <ProfitExplanation />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            SmartLedger · Business Expense &amp; Sales Calculator
          </span>
          <span>All calculations in Nigerian Naira (₦) · Saved locally on your device</span>
        </div>
      </footer>

      <ConfirmModal
        open={isClearModalOpen}
        expenseCount={expenses.length}
        onCancel={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearAll}
      />
    </div>
  );
}
