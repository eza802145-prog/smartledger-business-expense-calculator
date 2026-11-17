import {
  formatReadableDate,
  getIsoDateOffset,
  normalizeNumericInput,
  roundPercent,
  validatePositiveAmount,
  validateSaleDate,
} from './ledger';

export type SalesPaymentMethod = 'cash' | 'bank_transfer' | 'pos';

export const SALES_PAYMENT_LABELS: Record<SalesPaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  pos: 'POS',
};

export interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  productOrService: string;
  quantityRaw: string;
  unitPriceRaw: string;
  paymentMethod: SalesPaymentMethod;
  customerName: string;
}

export type SalesDatePeriod = 'all' | 'today' | '7d' | 'month';

export interface SalesFilterState {
  paymentMethod: SalesPaymentMethod | 'all';
  period: SalesDatePeriod;
  dateFilter: string | null;
  searchQuery: string;
}

export interface QuantityValidationResult {
  valid: boolean;
  value: number;
  error: string | null;
}

export interface PaymentChannelSummary {
  method: SalesPaymentMethod;
  label: string;
  count: number;
  total: number;
  totalKobo: number;
  sharePercent: number;
}

export interface SalesByDateRow {
  date: string;
  formattedDate: string;
  count: number;
  total: number;
  totalKobo: number;
  methods: SalesPaymentMethod[];
}

export interface SalesModuleSummary {
  totalSalesAmount: number;
  totalSalesKobo: number;
  totalQuantity: number;
  recordCount: number;
  breakdownByPayment: PaymentChannelSummary[];
  incomeByDate: SalesByDateRow[];
}

export function validateProductOrService(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Please enter a product or service name (e.g., 50kg Rice or Haircut).';
  }
  return null;
}

export function validateQuantitySold(raw: string): QuantityValidationResult {
  const normalized = normalizeNumericInput(raw);

  if (normalized === '') {
    return {
      valid: false,
      value: 0,
      error: 'Quantity sold is required. Enter a positive number (e.g., 1 or 5).',
    };
  }

  if (normalized.startsWith('-')) {
    return {
      valid: false,
      value: 0,
      error: 'Quantity sold cannot be negative. Enter a positive quantity.',
    };
  }

  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    return {
      valid: false,
      value: 0,
      error: 'Enter a valid numerical quantity (e.g., 2 or 1.5).',
    };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      valid: false,
      value: 0,
      error: 'Quantity sold must be greater than 0.',
    };
  }

  const decimalParts = normalized.split('.');
  if (decimalParts[1] && decimalParts[1].length > 3) {
    return {
      valid: false,
      value: 0,
      error: 'Quantity can have at most 3 decimal places.',
    };
  }

  return {
    valid: true,
    value: parsed,
    error: null,
  };
}

/**
 * Calculates exact line total in kobo and Naira for (Quantity Sold × Unit Selling Price).
 */
export function calculateSaleLineTotal(
  quantityRaw: string,
  unitPriceRaw: string
): { valid: boolean; totalKobo: number; totalAmount: number } {
  const qtyCheck = validateQuantitySold(quantityRaw);
  const priceCheck = validatePositiveAmount(unitPriceRaw, 'Unit selling price');

  if (!qtyCheck.valid || !priceCheck.valid) {
    return { valid: false, totalKobo: 0, totalAmount: 0 };
  }

  const totalKobo = Math.round(qtyCheck.value * priceCheck.kobo);
  return {
    valid: true,
    totalKobo,
    totalAmount: totalKobo / 100,
  };
}

export function filterSalesRecords(
  records: SalesRecord[],
  filters: SalesFilterState,
  referenceDate = new Date()
): SalesRecord[] {
  const todayStr = getIsoDateOffset(0, referenceDate);
  const weekStartStr = getIsoDateOffset(6, referenceDate);
  const monthPrefix = todayStr.slice(0, 7);
  const query = filters.searchQuery.trim().toLowerCase();

  return records.filter((record) => {
    if (
      filters.paymentMethod !== 'all' &&
      record.paymentMethod !== filters.paymentMethod
    ) {
      return false;
    }

    if (filters.dateFilter && record.date !== filters.dateFilter) {
      return false;
    }

    if (filters.period === 'today' && record.date !== todayStr) {
      return false;
    }
    if (
      filters.period === '7d' &&
      (record.date < weekStartStr || record.date > todayStr)
    ) {
      return false;
    }
    if (filters.period === 'month' && !record.date.startsWith(monthPrefix)) {
      return false;
    }

    if (query !== '') {
      const productMatch = record.productOrService.toLowerCase().includes(query);
      const customerMatch = record.customerName.toLowerCase().includes(query);
      if (!productMatch && !customerMatch) {
        return false;
      }
    }

    return true;
  });
}

export function calculateSalesModuleSummary(
  records: SalesRecord[]
): SalesModuleSummary {
  const methodKobo: Record<SalesPaymentMethod, number> = {
    cash: 0,
    bank_transfer: 0,
    pos: 0,
  };
  const methodCount: Record<SalesPaymentMethod, number> = {
    cash: 0,
    bank_transfer: 0,
    pos: 0,
  };

  interface DateBucket {
    totalKobo: number;
    count: number;
    methods: Set<SalesPaymentMethod>;
  }

  const dateMap = new Map<string, DateBucket>();
  let totalSalesKobo = 0;
  let totalQuantity = 0;
  let validCount = 0;

  for (const record of records) {
    const qtyCheck = validateQuantitySold(record.quantityRaw);
    const lineTotal = calculateSaleLineTotal(
      record.quantityRaw,
      record.unitPriceRaw
    );
    if (!qtyCheck.valid || !lineTotal.valid) continue;

    const method: SalesPaymentMethod =
      record.paymentMethod === 'cash' ||
      record.paymentMethod === 'bank_transfer' ||
      record.paymentMethod === 'pos'
        ? record.paymentMethod
        : 'cash';

    totalSalesKobo += lineTotal.totalKobo;
    totalQuantity += qtyCheck.value;
    validCount += 1;

    methodKobo[method] += lineTotal.totalKobo;
    methodCount[method] += 1;

    const dateKey = validateSaleDate(record.date) === null ? record.date : 'Unspecified';
    let bucket = dateMap.get(dateKey);
    if (!bucket) {
      bucket = {
        totalKobo: 0,
        count: 0,
        methods: new Set<SalesPaymentMethod>(),
      };
      dateMap.set(dateKey, bucket);
    }
    bucket.totalKobo += lineTotal.totalKobo;
    bucket.count += 1;
    bucket.methods.add(method);
  }

  const methodOrder: SalesPaymentMethod[] = ['cash', 'bank_transfer', 'pos'];
  const breakdownByPayment: PaymentChannelSummary[] = methodOrder.map((method) => {
    const kobo = methodKobo[method];
    return {
      method,
      label: SALES_PAYMENT_LABELS[method],
      count: methodCount[method],
      total: kobo / 100,
      totalKobo: kobo,
      sharePercent:
        totalSalesKobo > 0 ? roundPercent((kobo / totalSalesKobo) * 100) : 0,
    };
  });

  const incomeByDate: SalesByDateRow[] = Array.from(dateMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, bucket]) => ({
      date,
      formattedDate: formatReadableDate(date),
      count: bucket.count,
      total: bucket.totalKobo / 100,
      totalKobo: bucket.totalKobo,
      methods: methodOrder.filter((m) => bucket.methods.has(m)),
    }));

  return {
    totalSalesAmount: totalSalesKobo / 100,
    totalSalesKobo,
    totalQuantity: Math.round(totalQuantity * 1000) / 1000,
    recordCount: validCount,
    breakdownByPayment,
    incomeByDate,
  };
}
