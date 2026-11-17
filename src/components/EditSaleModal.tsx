import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  formatNaira,
  validatePositiveAmount,
  validateSaleDate,
} from '../utils/ledger';
import {
  calculateSaleLineTotal,
  SALES_PAYMENT_LABELS,
  SalesPaymentMethod,
  SalesRecord,
  validateProductOrService,
  validateQuantitySold,
} from '../utils/sales';

interface EditSaleModalProps {
  record: SalesRecord | null;
  onCancel: () => void;
  onSave: (updated: SalesRecord) => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  record,
  onCancel,
  onSave,
}) => {
  const [date, setDate] = useState('');
  const [productOrService, setProductOrService] = useState('');
  const [quantityRaw, setQuantityRaw] = useState('');
  const [unitPriceRaw, setUnitPriceRaw] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<SalesPaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');

  const [dateError, setDateError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (!record) return;
    setDate(record.date);
    setProductOrService(record.productOrService);
    setQuantityRaw(record.quantityRaw);
    setUnitPriceRaw(record.unitPriceRaw);
    setPaymentMethod(record.paymentMethod);
    setCustomerName(record.customerName);
    setDateError(null);
    setProductError(null);
    setQtyError(null);
    setPriceError(null);
  }, [record]);

  useEffect(() => {
    if (!record) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [record, onCancel]);

  if (!record) return null;

  const liveLineTotal = calculateSaleLineTotal(quantityRaw, unitPriceRaw);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dErr = validateSaleDate(date);
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

    onSave({
      id: record.id,
      date,
      productOrService: productOrService.trim(),
      quantityRaw: quantityRaw.trim(),
      unitPriceRaw: unitPriceRaw.trim(),
      paymentMethod,
      customerName: customerName.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-sale-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <h3
            id="edit-sale-title"
            className="font-display text-lg font-bold text-slate-900"
          >
            Edit Sale Record
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close edit sale dialog"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-sale-date"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Sale Date
              </label>
              <input
                id="edit-sale-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (dateError) setDateError(null);
                }}
                aria-invalid={Boolean(dateError)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                  dateError
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {dateError && (
                <p role="alert" className="mt-1 flex items-start gap-1 text-xs text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{dateError}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-sale-method"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Payment Method
              </label>
              <select
                id="edit-sale-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as SalesPaymentMethod)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              >
                {(['cash', 'bank_transfer', 'pos'] as SalesPaymentMethod[]).map(
                  (method) => (
                    <option key={method} value={method}>
                      {SALES_PAYMENT_LABELS[method]}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-sale-product"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Product or Service Name
            </label>
            <input
              id="edit-sale-product"
              type="text"
              value={productOrService}
              onChange={(e) => {
                setProductOrService(e.target.value);
                if (productError) setProductError(null);
              }}
              aria-invalid={Boolean(productError)}
              className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                productError
                  ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
            {productError && (
              <p role="alert" className="mt-1 flex items-start gap-1 text-xs text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{productError}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-sale-qty"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Quantity Sold
              </label>
              <input
                id="edit-sale-qty"
                type="text"
                inputMode="decimal"
                value={quantityRaw}
                onChange={(e) => {
                  setQuantityRaw(e.target.value);
                  if (qtyError) setQtyError(null);
                }}
                aria-invalid={Boolean(qtyError)}
                className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border font-mono text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 ${
                  qtyError
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {qtyError && (
                <p role="alert" className="mt-1 flex items-start gap-1 text-xs text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{qtyError}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-sale-price"
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
                  id="edit-sale-price"
                  type="text"
                  inputMode="decimal"
                  value={unitPriceRaw}
                  onChange={(e) => {
                    setUnitPriceRaw(e.target.value);
                    if (priceError) setPriceError(null);
                  }}
                  aria-invalid={Boolean(priceError)}
                  className={`w-full min-h-[44px] pl-7 pr-3 py-2 rounded-lg border font-mono text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 ${
                    priceError
                      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 bg-white focus:border-blue-600 focus:ring-blue-600/20'
                  }`}
                />
              </div>
              {priceError && (
                <p role="alert" className="mt-1 flex items-start gap-1 text-xs text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{priceError}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-sale-customer"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Customer Name (Optional)
            </label>
            <input
              id="edit-sale-customer"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Chinedu Okeke"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-blue-900">
              Calculated Total Amount
            </span>
            <span className="font-mono text-base font-bold tabular-nums text-blue-800">
              {formatNaira(liveLineTotal.totalAmount)}
            </span>
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
