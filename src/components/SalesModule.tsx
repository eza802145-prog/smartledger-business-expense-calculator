import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Calendar,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import {
  formatNaira,
  formatPercent,
  formatReadableDate,
  getTodayIsoDate,
  validatePositiveAmount,
  validateSaleDate,
} from '../utils/ledger';
import {
  calculateSaleLineTotal,
  calculateSalesModuleSummary,
  filterSalesRecords,
  SALES_PAYMENT_LABELS,
  SalesDatePeriod,
  SalesPaymentMethod,
  SalesRecord,
  validateProductOrService,
  validateQuantitySold,
} from '../utils/sales';
import { EditSaleModal } from './EditSaleModal';

interface SalesModuleProps {
  records: SalesRecord[];
  onAddRecord: (record: Omit<SalesRecord, 'id'>) => void;
  onUpdateRecord: (updated: SalesRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUndoDelete?: () => void;
  canUndoDelete?: boolean;
}

const PAYMENT_OPTIONS: Array<{
  value: SalesPaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Landmark },
  { value: 'pos', label: 'POS', icon: CreditCard },
];

const PERIOD_OPTIONS: Array<{ value: SalesDatePeriod; label: string }> = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
];

export const SalesModule: React.FC<SalesModuleProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onUndoDelete,
  canUndoDelete,
}) => {
  // Add Sale Form State
  const [saleDate, setSaleDate] = useState<string>(() => getTodayIsoDate());
  const [productOrService, setProductOrService] = useState<string>('');
  const [quantityRaw, setQuantityRaw] = useState<string>('1');
  const [unitPriceRaw, setUnitPriceRaw] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<SalesPaymentMethod>('cash');
  const [customerName, setCustomerName] = useState<string>('');

  // Validation Errors
  const [dateError, setDateError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Filters & Edit State
  const [paymentFilter, setPaymentFilter] = useState<SalesPaymentMethod | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<SalesDatePeriod>('all');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);

  const liveLineTotal = useMemo(
    () => calculateSaleLineTotal(quantityRaw, unitPriceRaw),
    [quantityRaw, unitPriceRaw]
  );

  const allSummary = useMemo(
    () => calculateSalesModuleSummary(records),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const filtered = filterSalesRecords(records, {
      paymentMethod: paymentFilter,
      period: periodFilter,
      dateFilter,
      searchQuery,
    });
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [records, paymentFilter, periodFilter, dateFilter, searchQuery]);

  const selectedSummary = useMemo(
    () => calculateSalesModuleSummary(filteredRecords),
    [filteredRecords]
  );

  const hasActiveFilter =
    paymentFilter !== 'all' ||
    periodFilter !== 'all' ||
    dateFilter !== null ||
    searchQuery.trim() !== '';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dErr = validateSaleDate(saleDate);
    const pErr = validateProductOrService(productOrService);
    const qCheck = validateQuantitySold(quantityRaw);
    const prCheck = validatePositiveAmount(unitPriceRaw, 'Unit selling price');

    setDateError(dErr);
    setProductError(pErr);
    setQtyError(qCheck.error);
    setPriceError(prCheck.error);

    if (dErr || pErr || !qCheck.valid || !prCheck.valid) {
      return;
    }

    onAddRecord({
      date: saleDate,
      productOrService: productOrService.trim(),
      quantityRaw: quantityRaw.trim(),
      unitPriceRaw: unitPriceRaw.trim(),
      paymentMethod,
      customerName: customerName.trim(),
    });

    setProductOrService('');
    setQuantityRaw('1');
    setUnitPriceRaw('');
    setCustomerName('');
    setDateError(null);
    setProductError(null);
    setQtyError(null);
    setPriceError(null);
  };

  const clearAllFilters = () => {
    setPaymentFilter('all');
    setPeriodFilter('all');
    setDateFilter(null);
    setSearchQuery('');
  };

  return (
    <section
      id="sales"
      aria-labelledby="sales-module-heading"
      className="scroll-mt-20 space-y-6"
    >
      {/* Section Heading */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <h2
              id="sales-module-heading"
              className="font-display text-xl sm:text-2xl font-bold text-slate-900"
            >
              Sales &amp; Income Management
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Record individual sales with quantity, unit price, payment method, and date. Tracked independently so sales are never mixed with expenses or double-counted in the profit calculator above.
            </p>
          </div>

          <div className="flex flex-col sm:items-end shrink-0">
            <span className="text-xs font-medium text-slate-500">
              All Recorded Sales ({allSummary.recordCount})
            </span>
            <span
              className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-blue-800"
              data-testid="sales-module-all-total"
            >
              {formatNaira(allSummary.totalSalesAmount)}
            </span>
          </div>
        </div>

        {/* Add Sale Form */}
        <form onSubmit={handleAddSubmit} noValidate className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-start">
            {/* 1. Sale Date */}
            <div className="lg:col-span-3">
              <label
                htmlFor="sales-date"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Sale Date
              </label>
              <div className="relative">
                <Calendar
                  className="pointer-events-none w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="sales-date"
                  type="date"
                  value={saleDate}
                  onChange={(e) => {
                    setSaleDate(e.target.value);
                    if (dateError) setDateError(null);
                  }}
                  aria-invalid={Boolean(dateError)}
                  aria-describedby={dateError ? 'sales-date-error' : undefined}
                  className={`w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    dateError
                      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                  }`}
                />
              </div>
              {dateError && (
                <p
                  id="sales-date-error"
                  role="alert"
                  className="mt-1.5 flex items-start gap-1 text-xs text-rose-700"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{dateError}</span>
                </p>
              )}
            </div>

            {/* 2. Product or Service Name */}
            <div className="lg:col-span-5">
              <label
                htmlFor="sales-product"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Product or Service Name
              </label>
              <input
                id="sales-product"
                type="text"
                value={productOrService}
                onChange={(e) => {
                  setProductOrService(e.target.value);
                  if (productError) setProductError(null);
                }}
                placeholder="e.g. 50kg Bag of Rice, Hair Braiding"
                aria-invalid={Boolean(productError)}
                aria-describedby={productError ? 'sales-product-error' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                  productError
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {productError && (
                <p
                  id="sales-product-error"
                  role="alert"
                  className="mt-1.5 flex items-start gap-1 text-xs text-rose-700"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{productError}</span>
                </p>
              )}
            </div>

            {/* 7. Optional Customer Name */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label
                htmlFor="sales-customer"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Customer Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="sales-customer"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ngozi Stores"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-start">
            {/* 3. Quantity Sold */}
            <div className="lg:col-span-2">
              <label
                htmlFor="sales-qty"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Quantity Sold
              </label>
              <input
                id="sales-qty"
                type="text"
                inputMode="decimal"
                value={quantityRaw}
                onChange={(e) => {
                  setQuantityRaw(e.target.value);
                  if (qtyError) setQtyError(null);
                }}
                placeholder="1"
                aria-invalid={Boolean(qtyError)}
                aria-describedby={qtyError ? 'sales-qty-error' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                  qtyError
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {qtyError && (
                <p
                  id="sales-qty-error"
                  role="alert"
                  className="mt-1.5 flex items-start gap-1 text-xs text-rose-700"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{qtyError}</span>
                </p>
              )}
            </div>

            {/* 4. Unit Selling Price (₦) */}
            <div className="lg:col-span-3">
              <label
                htmlFor="sales-unit-price"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Unit Selling Price (₦)
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-sm font-semibold text-slate-500"
                >
                  ₦
                </span>
                <input
                  id="sales-unit-price"
                  type="text"
                  inputMode="decimal"
                  value={unitPriceRaw}
                  onChange={(e) => {
                    setUnitPriceRaw(e.target.value);
                    if (priceError) setPriceError(null);
                  }}
                  placeholder="15000"
                  aria-invalid={Boolean(priceError)}
                  aria-describedby={priceError ? 'sales-price-error' : undefined}
                  className={`w-full min-h-[44px] pl-7 pr-3 py-2 rounded-lg border font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 placeholder:font-sans transition-colors focus:outline-none focus:ring-2 ${
                    priceError
                      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                  }`}
                />
              </div>
              {priceError && (
                <p
                  id="sales-price-error"
                  role="alert"
                  className="mt-1.5 flex items-start gap-1 text-xs text-rose-700"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{priceError}</span>
                </p>
              )}
            </div>

            {/* 6. Payment Method: Cash, Bank Transfer, POS */}
            <div className="sm:col-span-2 lg:col-span-4">
              <span className="block text-xs font-medium text-slate-700 mb-1.5">
                Payment Method
              </span>
              <div
                className="grid grid-cols-3 gap-1.5"
                role="group"
                aria-label="Select payment method"
              >
                {PAYMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = paymentMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      aria-pressed={active}
                      className={`min-h-[44px] px-2 py-2 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        active
                          ? 'bg-blue-50 border-blue-600 text-blue-800'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {opt.value === 'bank_transfer' ? 'Transfer' : opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Auto-Calculated Total + Add Sale CTA */}
            <div className="sm:col-span-2 lg:col-span-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-600">Total Amount:</span>
                <span
                  className="font-mono font-bold tabular-nums text-blue-800"
                  data-testid="sales-form-line-total"
                >
                  {formatNaira(liveLineTotal.totalAmount)}
                </span>
              </div>
              <button
                type="submit"
                className="w-full min-h-[44px] px-4 py-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Add Sale Record</span>
              </button>
            </div>
          </div>
        </form>

        {/* Undo Delete Notice */}
        {canUndoDelete && onUndoDelete && (
          <div
            role="status"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs sm:text-sm text-blue-900"
          >
            <span>Sale record deleted.</span>
            <button
              type="button"
              onClick={onUndoDelete}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Undo Delete</span>
            </button>
          </div>
        )}

        {/* Filters & Selected Records Summary */}
        <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Payment Filter */}
              <div
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
                role="group"
                aria-label="Filter sales by payment method"
              >
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'bank_transfer', label: 'Bank Transfer' },
                    { id: 'pos', label: 'POS' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPaymentFilter(tab.id)}
                    className={`min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      paymentFilter === tab.id
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Period Filter */}
              <div
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
                role="group"
                aria-label="Filter sales by date range"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriodFilter(opt.value)}
                    className={`min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      periodFilter === opt.value
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-64">
              <Search
                className="pointer-events-none w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product or customer..."
                aria-label="Search sales records"
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          {dateFilter && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDateFilter(null)}
                className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800 hover:bg-blue-100 transition-colors"
              >
                <span>Filtered Date: {formatReadableDate(dateFilter)}</span>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Selected Records Total Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg bg-blue-50/75 border border-blue-200 px-4 py-3">
              <span className="text-xs font-medium text-blue-900">
                {hasActiveFilter ? 'Total Sales (Selected)' : 'Total Sales'}
              </span>
              <p
                className="mt-1 font-mono text-lg font-bold tabular-nums text-blue-900"
                data-testid="sales-selected-total"
              >
                {formatNaira(selectedSummary.totalSalesAmount)}
              </p>
              <span className="text-xs text-blue-700">
                {selectedSummary.recordCount} of {records.length}{' '}
                {records.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {selectedSummary.breakdownByPayment.map((ch) => (
              <div
                key={ch.method}
                className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3"
              >
                <span className="text-xs font-medium text-slate-600">{ch.label}</span>
                <p
                  className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900"
                  data-testid={`sales-channel-total-${ch.method}`}
                >
                  {formatNaira(ch.total)}
                </p>
                <span className="text-xs text-slate-500">
                  {ch.count} {ch.count === 1 ? 'sale' : 'sales'} ·{' '}
                  {formatPercent(ch.sharePercent)}
                </span>
              </div>
            ))}
          </div>

          {/* Recorded Sales Table (Desktop) & Cards (Mobile) */}
          {records.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <ShoppingCart
                className="w-9 h-9 text-slate-400 mx-auto mb-3"
                aria-hidden="true"
              />
              <h3 className="font-display text-base font-semibold text-slate-800">
                No sales records added yet
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Use the form above to record your daily sales with quantity, unit price in ₦, and payment method (Cash, Bank Transfer, or POS).
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm font-medium text-slate-700">
                No sales records match your current filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2.5 min-h-[40px] px-4 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-blue-700 hover:bg-slate-50 transition-colors"
              >
                Reset Sales Filters
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4 whitespace-nowrap">Sale Date</th>
                      <th className="py-3 px-4">Product / Service</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Qty</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Unit Price</th>
                      <th className="py-3 px-4 whitespace-nowrap">Payment</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Total Amount</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRecords.map((rec) => {
                      const line = calculateSaleLineTotal(
                        rec.quantityRaw,
                        rec.unitPriceRaw
                      );
                      const unitPrice = validatePositiveAmount(
                        rec.unitPriceRaw,
                        'Unit price'
                      );

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-xs font-medium">
                            {formatReadableDate(rec.date)}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {rec.productOrService}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {rec.customerName || (
                              <span className="text-slate-400">Walk-in</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                            {rec.quantityRaw}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                            {formatNaira(unitPrice.value)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                            {SALES_PAYMENT_LABELS[rec.paymentMethod]}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900 whitespace-nowrap">
                            {formatNaira(line.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingRecord(rec)}
                                aria-label={`Edit ${rec.productOrService}`}
                                className="min-h-[36px] px-2.5 inline-flex items-center gap-1 rounded-md text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRecord(rec.id)}
                                aria-label={`Delete ${rec.productOrService}`}
                                className="min-h-[36px] px-2.5 inline-flex items-center gap-1 rounded-md text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td
                        colSpan={6}
                        className="py-3 px-4 text-sm font-semibold text-slate-700"
                      >
                        Total for {selectedSummary.recordCount} selected{' '}
                        {selectedSummary.recordCount === 1 ? 'record' : 'records'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base font-bold tabular-nums text-blue-800 whitespace-nowrap">
                        {formatNaira(selectedSummary.totalSalesAmount)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredRecords.map((rec) => {
                  const line = calculateSaleLineTotal(rec.quantityRaw, rec.unitPriceRaw);
                  const unitPrice = validatePositiveAmount(rec.unitPriceRaw, 'Unit price');

                  return (
                    <article
                      key={rec.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-slate-900 truncate">
                            {rec.productOrService}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatReadableDate(rec.date)} ·{' '}
                            {SALES_PAYMENT_LABELS[rec.paymentMethod]}
                            {rec.customerName ? ` · ${rec.customerName}` : ''}
                          </p>
                        </div>
                        <span className="font-mono text-base font-bold tabular-nums text-blue-800 shrink-0">
                          {formatNaira(line.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <span className="font-mono text-xs text-slate-600 tabular-nums">
                          {rec.quantityRaw} × {formatNaira(unitPrice.value)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingRecord(rec)}
                            aria-label={`Edit ${rec.productOrService}`}
                            className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            aria-label={`Delete ${rec.productOrService}`}
                            className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-medium text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Selected Total ({selectedSummary.recordCount})
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-blue-800">
                    {formatNaira(selectedSummary.totalSalesAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Income by Date Breakdown (when sales exist) */}
          {allSummary.incomeByDate.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Sales Income by Date
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select any date to filter the sales records table above
                  </p>
                </div>
                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => setDateFilter(null)}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Show all dates
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {allSummary.incomeByDate.map((day) => {
                  const active = dateFilter === day.date;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setDateFilter(active ? null : day.date)}
                      className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        active
                          ? 'bg-blue-50 border-blue-600'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {day.formattedDate}
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums text-blue-800">
                          {formatNaira(day.total)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 truncate">
                        {day.count} {day.count === 1 ? 'sale' : 'sales'} ·{' '}
                        {day.methods.map((m) => SALES_PAYMENT_LABELS[m]).join(', ')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <EditSaleModal
        record={editingRecord}
        onCancel={() => setEditingRecord(null)}
        onSave={(updated) => {
          onUpdateRecord(updated);
          setEditingRecord(null);
        }}
      />
    </section>
  );
};
