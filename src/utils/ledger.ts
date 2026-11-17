export type PaymentMethod = 'cash' | 'bank_transfer' | 'other';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

export interface SaleItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  paymentMethod: PaymentMethod;
  amountRaw: string;
}

export type SalesPeriodFilter = 'all' | 'today' | '7d' | 'month';

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  label: string;
  count: number;
  total: number;
  totalKobo: number;
  sharePercent: number;
}

export interface DailyIncomeSummary {
  date: string;
  formattedDate: string;
  saleCount: number;
  total: number;
  totalKobo: number;
  cashTotal: number;
  bankTransferTotal: number;
  otherTotal: number;
  methodsUsed: PaymentMethod[];
}

export interface SalesSummary {
  totalSalesAmount: number;
  totalSalesKobo: number;
  saleCount: number;
  validSaleCount: number;
  averageSaleAmount: number;
  breakdownByMethod: PaymentMethodBreakdown[];
  incomeByDate: DailyIncomeSummary[];
}

export interface ExpenseItem {
  id: string;
  description: string;
  amountRaw: string;
}

export interface AmountValidationResult {
  valid: boolean;
  value: number;
  kobo: number;
  error: string | null;
}

export type ProfitStatus = 'profit' | 'loss' | 'break-even' | 'empty';

export interface LedgerSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalIncomeKobo: number;
  totalExpensesKobo: number;
  netProfitKobo: number;
  status: ProfitStatus;
  expenseCount: number;
  validExpenseCount: number;
  expenseRatioPercent: number;
  profitMarginPercent: number;
}

export interface SampleScenario {
  id: string;
  label: string;
  businessType: string;
  incomeRaw: string;
  sales: Array<{
    daysAgo: number;
    description: string;
    paymentMethod: PaymentMethod;
    amountRaw: string;
  }>;
  expenses: Array<{ description: string; amountRaw: string }>;
}

/**
 * Returns local YYYY-MM-DD date string, optionally offset by days ago.
 */
export function getIsoDateOffset(daysAgo = 0, referenceDate = new Date()): string {
  const date = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - daysAgo
  );
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  return getIsoDateOffset(0);
}

/**
 * Formats a YYYY-MM-DD date string into a clean human-readable label (e.g. "Mon, 16 Nov 2026").
 */
export function formatReadableDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Strips formatting commas and surrounding whitespace from a user-entered monetary string.
 */
export function normalizeNumericInput(raw: string): string {
  return raw.replace(/,/g, '').trim();
}

/**
 * Parses and validates a Nigerian Naira amount string.
 * Enforces strictly positive (> 0), finite numerical amounts with up to 2 decimal places.
 */
export function validatePositiveAmount(
  raw: string,
  fieldLabel = 'Amount',
  options: { allowBlank?: boolean } = {}
): AmountValidationResult {
  const normalized = normalizeNumericInput(raw);

  if (normalized === '') {
    if (options.allowBlank) {
      return { valid: true, value: 0, kobo: 0, error: null };
    }
    return {
      valid: false,
      value: 0,
      kobo: 0,
      error: `${fieldLabel} is required. Enter a positive amount in Naira (e.g., 25000).`,
    };
  }

  if (normalized.startsWith('-')) {
    return {
      valid: false,
      value: 0,
      kobo: 0,
      error: `${fieldLabel} cannot be negative. Please enter a positive Naira amount.`,
    };
  }

  // Strictly match positive decimal numbers (e.g., "100", "100.5", "100.50", ".50")
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    return {
      valid: false,
      value: 0,
      kobo: 0,
      error: `Enter a valid numerical ${fieldLabel.toLowerCase()} using digits only (e.g., 150000).`,
    };
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return {
      valid: false,
      value: 0,
      kobo: 0,
      error: `${fieldLabel} is too large or invalid. Please enter a realistic amount.`,
    };
  }

  if (parsed <= 0) {
    return {
      valid: false,
      value: 0,
      kobo: 0,
      error: `${fieldLabel} must be greater than ₦0.00.`,
    };
  }

  const decimalParts = normalized.split('.');
  if (decimalParts[1] && decimalParts[1].length > 2) {
    return {
      valid: false,
      value: 0,
      kobo: 0,
      error: `${fieldLabel} can have at most 2 decimal places (kobo).`,
    };
  }

  const kobo = Math.round(parsed * 100);
  return {
    valid: true,
    value: kobo / 100,
    kobo,
    error: null,
  };
}

/**
 * Validates an expense description so empty/whitespace-only entries are rejected.
 */
export function validateExpenseDescription(description: string): string | null {
  if (!description || description.trim().length === 0) {
    return 'Please enter a short description for this expense (e.g., Shop Rent).';
  }
  return null;
}

/**
 * Validates a sale description so empty/whitespace-only entries are rejected.
 */
export function validateSaleDescription(description: string): string | null {
  if (!description || description.trim().length === 0) {
    return 'Please enter a sale description (e.g., Walk-in Customer Sales).';
  }
  return null;
}

/**
 * Validates a YYYY-MM-DD sale date string.
 */
export function validateSaleDate(dateStr: string): string | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 'Please select a valid sale date.';
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return 'Please enter a valid calendar date.';
  }
  return null;
}

/**
 * Formats a Naira number cleanly with Nigerian thousands separators and 2 decimal places.
 */
export function formatNaira(amount: number, options: { showPlus?: boolean } = {}): string {
  const absFormatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (amount < 0) {
    return `-₦${absFormatted}`;
  }
  if (amount > 0 && options.showPlus) {
    return `+₦${absFormatted}`;
  }
  return `₦${absFormatted}`;
}

/**
 * Rounds a number symmetrically to 1 decimal place and formats as a clean percentage (e.g., "40%", "-25%", "18.6%", "0%").
 */
export function roundPercent(value: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  const rounded = Math.sign(value) * (Math.round(Math.abs(value) * 10) / 10);
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatPercent(value: number): string {
  const safe = roundPercent(value);
  return Number.isInteger(safe) ? `${safe}%` : `${safe.toFixed(1)}%`;
}

/**
 * Filters sales items by a selected date period relative to a reference date.
 */
export function filterSalesByPeriod(
  sales: SaleItem[],
  period: SalesPeriodFilter,
  referenceDate = new Date()
): SaleItem[] {
  if (period === 'all') return sales;

  const todayStr = getIsoDateOffset(0, referenceDate);
  if (period === 'today') {
    return sales.filter((s) => s.date === todayStr);
  }

  if (period === '7d') {
    const startStr = getIsoDateOffset(6, referenceDate);
    return sales.filter((s) => s.date >= startStr && s.date <= todayStr);
  }

  // 'month': current calendar month YYYY-MM
  const monthPrefix = todayStr.slice(0, 7);
  return sales.filter((s) => s.date.startsWith(monthPrefix));
}

/**
 * Generates payment method breakdown and daily income summaries from a list of sales.
 */
export function calculateSalesSummary(sales: SaleItem[]): SalesSummary {
  const methodKobo: Record<PaymentMethod, number> = {
    cash: 0,
    bank_transfer: 0,
    other: 0,
  };
  const methodCount: Record<PaymentMethod, number> = {
    cash: 0,
    bank_transfer: 0,
    other: 0,
  };

  interface DateBucket {
    totalKobo: number;
    saleCount: number;
    cashKobo: number;
    bankTransferKobo: number;
    otherKobo: number;
    methods: Set<PaymentMethod>;
  }

  const dateMap = new Map<string, DateBucket>();
  let totalSalesKobo = 0;
  let validSaleCount = 0;

  for (const sale of sales) {
    const amountCheck = validatePositiveAmount(sale.amountRaw, 'Sale amount');
    if (!amountCheck.valid) continue;

    const kobo = amountCheck.kobo;
    const method: PaymentMethod =
      sale.paymentMethod === 'cash' ||
      sale.paymentMethod === 'bank_transfer' ||
      sale.paymentMethod === 'other'
        ? sale.paymentMethod
        : 'other';

    totalSalesKobo += kobo;
    validSaleCount += 1;
    methodKobo[method] += kobo;
    methodCount[method] += 1;

    const dateKey = validateSaleDate(sale.date) === null ? sale.date : 'Unspecified';
    let bucket = dateMap.get(dateKey);
    if (!bucket) {
      bucket = {
        totalKobo: 0,
        saleCount: 0,
        cashKobo: 0,
        bankTransferKobo: 0,
        otherKobo: 0,
        methods: new Set<PaymentMethod>(),
      };
      dateMap.set(dateKey, bucket);
    }

    bucket.totalKobo += kobo;
    bucket.saleCount += 1;
    bucket.methods.add(method);
    if (method === 'cash') bucket.cashKobo += kobo;
    else if (method === 'bank_transfer') bucket.bankTransferKobo += kobo;
    else bucket.otherKobo += kobo;
  }

  const methodsOrder: PaymentMethod[] = ['cash', 'bank_transfer', 'other'];
  const breakdownByMethod: PaymentMethodBreakdown[] = methodsOrder.map((method) => {
    const kobo = methodKobo[method];
    return {
      method,
      label: PAYMENT_METHOD_LABELS[method],
      count: methodCount[method],
      total: kobo / 100,
      totalKobo: kobo,
      sharePercent:
        totalSalesKobo > 0 ? roundPercent((kobo / totalSalesKobo) * 100) : 0,
    };
  });

  const incomeByDate: DailyIncomeSummary[] = Array.from(dateMap.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, bucket]) => ({
      date,
      formattedDate: formatReadableDate(date),
      saleCount: bucket.saleCount,
      total: bucket.totalKobo / 100,
      totalKobo: bucket.totalKobo,
      cashTotal: bucket.cashKobo / 100,
      bankTransferTotal: bucket.bankTransferKobo / 100,
      otherTotal: bucket.otherKobo / 100,
      methodsUsed: methodsOrder.filter((m) => bucket.methods.has(m)),
    }));

  const averageSaleKobo =
    validSaleCount > 0 ? Math.round(totalSalesKobo / validSaleCount) : 0;

  return {
    totalSalesAmount: totalSalesKobo / 100,
    totalSalesKobo,
    saleCount: sales.length,
    validSaleCount,
    averageSaleAmount: averageSaleKobo / 100,
    breakdownByMethod,
    incomeByDate,
  };
}

/**
 * Formats a plain-text sales summary ready to copy into WhatsApp or business reports.
 */
export function formatSalesReportText(
  summary: SalesSummary,
  periodLabel: string
): string {
  const lines = [
    `SmartLedger Sales Summary (${periodLabel})`,
    `Total Sales Revenue: ${formatNaira(summary.totalSalesAmount)} (${summary.validSaleCount} ${
      summary.validSaleCount === 1 ? 'sale' : 'sales'
    })`,
    '',
    'By Payment Method:',
    ...summary.breakdownByMethod.map(
      (b) =>
        `- ${b.label}: ${formatNaira(b.total)} (${b.count} ${
          b.count === 1 ? 'sale' : 'sales'
        }, ${formatPercent(b.sharePercent)})`
    ),
  ];

  if (summary.incomeByDate.length > 0) {
    lines.push('', 'Income by Date:');
    for (const day of summary.incomeByDate) {
      lines.push(
        `- ${day.formattedDate}: ${formatNaira(day.total)} (${day.saleCount} ${
          day.saleCount === 1 ? 'sale' : 'sales'
        })`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Computes exact Naira & Kobo totals using integer kobo math to avoid floating-point drift.
 */
export function calculateLedgerSummary(
  incomeRaw: string,
  expenses: ExpenseItem[]
): LedgerSummary {
  const incomeValidation = validatePositiveAmount(incomeRaw, 'Total income', {
    allowBlank: true,
  });

  const totalIncomeKobo = incomeValidation.valid ? incomeValidation.kobo : 0;

  let totalExpensesKobo = 0;
  let validExpenseCount = 0;

  for (const item of expenses) {
    const expCheck = validatePositiveAmount(item.amountRaw, 'Expense amount');
    if (expCheck.valid) {
      totalExpensesKobo += expCheck.kobo;
      validExpenseCount += 1;
    }
  }

  const netProfitKobo = totalIncomeKobo - totalExpensesKobo;

  let status: ProfitStatus = 'empty';
  if (totalIncomeKobo === 0 && totalExpensesKobo === 0) {
    status = 'empty';
  } else if (netProfitKobo > 0) {
    status = 'profit';
  } else if (netProfitKobo < 0) {
    status = 'loss';
  } else {
    status = 'break-even';
  }

  const expenseRatioPercent =
    totalIncomeKobo > 0
      ? roundPercent((totalExpensesKobo / totalIncomeKobo) * 100)
      : 0;

  const profitMarginPercent =
    totalIncomeKobo > 0
      ? roundPercent((netProfitKobo / totalIncomeKobo) * 100)
      : 0;

  return {
    totalIncome: totalIncomeKobo / 100,
    totalExpenses: totalExpensesKobo / 100,
    netProfit: netProfitKobo / 100,
    totalIncomeKobo,
    totalExpensesKobo,
    netProfitKobo,
    status,
    expenseCount: expenses.length,
    validExpenseCount,
    expenseRatioPercent,
    profitMarginPercent,
  };
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'retail-profit',
    label: 'Retail Shop (Profit)',
    businessType: 'Provisions & Minimart',
    incomeRaw: '850000',
    sales: [
      {
        daysAgo: 0,
        description: 'Counter Walk-in Provisions',
        paymentMethod: 'cash',
        amountRaw: '185000',
      },
      {
        daysAgo: 0,
        description: 'Bulk Cartons Wholesale Order',
        paymentMethod: 'bank_transfer',
        amountRaw: '320000',
      },
      {
        daysAgo: 1,
        description: 'POS & Mobile Checkout Sales',
        paymentMethod: 'other',
        amountRaw: '145000',
      },
      {
        daysAgo: 2,
        description: 'Beverages & Household Supplies',
        paymentMethod: 'bank_transfer',
        amountRaw: '200000',
      },
    ],
    expenses: [
      { description: 'Wholesale Stock Restock', amountRaw: '410000' },
      { description: 'Monthly Shop Rent', amountRaw: '120000' },
      { description: 'Staff Wages (2 Assistants)', amountRaw: '95000' },
      { description: 'Generator Fuel & Maintenance', amountRaw: '48500' },
      { description: 'POS Charges & Transport', amountRaw: '18500' },
    ],
  },
  {
    id: 'logistics-loss',
    label: 'Delivery Week (Loss)',
    businessType: 'Dispatch & Logistics',
    incomeRaw: '145000',
    sales: [
      {
        daysAgo: 0,
        description: 'Same-Day Island & Mainland Drops',
        paymentMethod: 'bank_transfer',
        amountRaw: '82000',
      },
      {
        daysAgo: 1,
        description: 'Cash on Delivery Collections',
        paymentMethod: 'cash',
        amountRaw: '43000',
      },
      {
        daysAgo: 3,
        description: 'Corporate Courier Wallet Settlement',
        paymentMethod: 'other',
        amountRaw: '20000',
      },
    ],
    expenses: [
      { description: 'Engine Overhaul & Spare Parts', amountRaw: '78000' },
      { description: 'Petrol for 2 Dispatch Bikes', amountRaw: '52000' },
      { description: 'Rider Weekly Commission', amountRaw: '45000' },
      { description: 'Call Airtime & Data Bundle', amountRaw: '8500' },
    ],
  },
];
