import assert from 'node:assert/strict';
import {
  calculateLedgerSummary,
  calculateSalesSummary,
  filterSalesByPeriod,
  formatNaira,
  formatPercent,
  SaleItem,
  validateExpenseDescription,
  validatePositiveAmount,
  validateSaleDate,
  validateSaleDescription,
} from './ledger.ts';
import {
  calculateSaleLineTotal,
  calculateSalesModuleSummary,
  filterSalesRecords,
  SalesRecord,
  validateProductOrService,
  validateQuantitySold,
} from './sales.ts';

// Case 1: Profitable Nigerian Retail Provision Shop
{
  const result = calculateLedgerSummary('850000', [
    { id: '1', description: 'Wholesale Stock Restock', amountRaw: '410000' },
    { id: '2', description: 'Monthly Shop Rent', amountRaw: '120000' },
    { id: '3', description: 'Staff Wages', amountRaw: '95000' },
    { id: '4', description: 'Generator Fuel', amountRaw: '48500' },
    { id: '5', description: 'POS Charges', amountRaw: '18500' },
  ]);
  assert.equal(result.totalIncome, 850000);
  assert.equal(result.totalExpenses, 692000);
  assert.equal(result.netProfit, 158000);
  assert.equal(result.status, 'profit');
  assert.equal(formatNaira(result.netProfit), '₦158,000.00');
}

// Case 2: Loss Scenario (Expenses exceed Income)
{
  const result = calculateLedgerSummary('145000', [
    { id: '1', description: 'Engine Overhaul & Spare Parts', amountRaw: '78000' },
    { id: '2', description: 'Petrol for Dispatch Bikes', amountRaw: '52000' },
    { id: '3', description: 'Rider Commission', amountRaw: '45000' },
    { id: '4', description: 'Airtime & Data', amountRaw: '8500' },
  ]);
  assert.equal(result.totalIncome, 145000);
  assert.equal(result.totalExpenses, 183500);
  assert.equal(result.netProfit, -38500);
  assert.equal(result.status, 'loss');
  assert.equal(formatNaira(result.netProfit), '-₦38,500.00');
}

// Case 3: Break-Even Scenario (Income equals Total Expenses)
{
  const result = calculateLedgerSummary('300000', [
    { id: '1', description: 'Raw Materials', amountRaw: '180000' },
    { id: '2', description: 'Packaging & Branding', amountRaw: '70000' },
    { id: '3', description: 'Delivery Logistics', amountRaw: '50000' },
  ]);
  assert.equal(result.totalIncome, 300000);
  assert.equal(result.totalExpenses, 300000);
  assert.equal(result.netProfit, 0);
  assert.equal(result.status, 'break-even');
  assert.equal(formatNaira(result.netProfit), '₦0.00');
}

// Case 4: Decimal / Kobo Precision & Comma-Formatted Inputs
{
  const result = calculateLedgerSummary('1,250,450.75', [
    { id: '1', description: 'Supplier Invoice', amountRaw: '500,125.25' },
    { id: '2', description: 'Bank Transfer Fees', amountRaw: '1,325.50' },
  ]);
  assert.equal(result.totalIncome, 1250450.75);
  assert.equal(result.totalExpenses, 501450.75);
  assert.equal(result.netProfit, 749000);
  assert.equal(result.status, 'profit');
  assert.equal(formatNaira(result.netProfit), '₦749,000.00');
}

// Case 5: High-Margin Service Business with Single Expense
{
  const result = calculateLedgerSummary('420000', [
    { id: '1', description: 'Internet & Power', amountRaw: '35000' },
  ]);
  assert.equal(result.totalIncome, 420000);
  assert.equal(result.totalExpenses, 35000);
  assert.equal(result.netProfit, 385000);
  assert.equal(result.status, 'profit');
  assert.equal(result.validExpenseCount, 1);
}

// Case 6: Expenses Recorded with Blank/Unentered Income (Loss Scenario, 0% indicators)
{
  const result = calculateLedgerSummary('', [
    { id: '1', description: 'Market Stall Permit', amountRaw: '15000' },
    { id: '2', description: 'Transport', amountRaw: '4500' },
  ]);
  assert.equal(result.totalIncome, 0);
  assert.equal(result.totalExpenses, 19500);
  assert.equal(result.netProfit, -19500);
  assert.equal(result.status, 'loss');
  assert.equal(result.profitMarginPercent, 0);
  assert.equal(result.expenseRatioPercent, 0);
  assert.equal(formatPercent(result.profitMarginPercent), '0%');
  assert.equal(formatPercent(result.expenseRatioPercent), '0%');
}

// Case 7: Validation Checks (Negative, Zero, Blank, Non-numeric, Invalid Description)
{
  const neg = validatePositiveAmount('-5000', 'Total income');
  assert.equal(neg.valid, false);
  assert.match(neg.error ?? '', /cannot be negative/i);

  const zero = validatePositiveAmount('0', 'Expense amount');
  assert.equal(zero.valid, false);
  assert.match(zero.error ?? '', /greater than ₦0\.00/i);

  const blank = validatePositiveAmount('   ', 'Expense amount');
  assert.equal(blank.valid, false);
  assert.match(blank.error ?? '', /required/i);

  const alpha = validatePositiveAmount('abc123', 'Total income');
  assert.equal(alpha.valid, false);

  const koboOverflow = validatePositiveAmount('100.123', 'Expense amount');
  assert.equal(koboOverflow.valid, false);

  assert.ok(validateExpenseDescription('   ') !== null);
  assert.equal(validateExpenseDescription('Shop Rent'), null);
}

// Case 8: Profit Margin & Expense-to-Income Ratio Upgrade Tests
{
  const profitCase = calculateLedgerSummary('250000', [
    { id: '1', description: 'Stock', amountRaw: '100000' },
    { id: '2', description: 'Rent', amountRaw: '50000' },
  ]);
  assert.equal(profitCase.netProfit, 100000);
  assert.equal(profitCase.profitMarginPercent, 40);
  assert.equal(profitCase.expenseRatioPercent, 60);
  assert.equal(formatPercent(profitCase.profitMarginPercent), '40%');
  assert.equal(formatPercent(profitCase.expenseRatioPercent), '60%');

  const lossCase = calculateLedgerSummary('80000', [
    { id: '1', description: 'Supplies', amountRaw: '100000' },
  ]);
  assert.equal(lossCase.netProfit, -20000);
  assert.equal(lossCase.profitMarginPercent, -25);
  assert.equal(lossCase.expenseRatioPercent, 125);
  assert.equal(formatPercent(lossCase.profitMarginPercent), '-25%');
  assert.equal(formatPercent(lossCase.expenseRatioPercent), '125%');

  const breakEvenCase = calculateLedgerSummary('75000', [
    { id: '1', description: 'Fuel & Operations', amountRaw: '75000' },
  ]);
  assert.equal(breakEvenCase.netProfit, 0);
  assert.equal(breakEvenCase.profitMarginPercent, 0);
  assert.equal(breakEvenCase.expenseRatioPercent, 100);

  const zeroIncomeEmpty = calculateLedgerSummary('0', []);
  assert.equal(zeroIncomeEmpty.profitMarginPercent, 0);
  assert.equal(zeroIncomeEmpty.expenseRatioPercent, 0);
}

// Case 9: Legacy Daily Sales Helpers Check
{
  const sales: SaleItem[] = [
    {
      id: 's1',
      date: '2026-11-16',
      description: 'Counter Walk-in Sales',
      paymentMethod: 'cash',
      amountRaw: '100000',
    },
    {
      id: 's2',
      date: '2026-11-16',
      description: 'Wholesale Bank Transfer',
      paymentMethod: 'bank_transfer',
      amountRaw: '100000',
    },
  ];
  const allSummary = calculateSalesSummary(sales);
  assert.equal(allSummary.totalSalesAmount, 200000);
  assert.equal(filterSalesByPeriod(sales, 'today', new Date(2026, 10, 16)).length, 2);
  assert.equal(validateSaleDate('2026-11-16'), null);
  assert.equal(validateSaleDescription('Walk-in'), null);
}

// Case 10: Sales & Income Management Module (Quantity × Unit Price, Cash/Bank Transfer/POS, Filtering, Validation)
{
  // Line total calculations
  const line1 = calculateSaleLineTotal('3', '15000');
  assert.equal(line1.valid, true);
  assert.equal(line1.totalAmount, 45000);

  const line2 = calculateSaleLineTotal('2.5', '1250.50');
  assert.equal(line2.valid, true);
  assert.equal(line2.totalAmount, 3126.25);

  // Validation: prevent negative quantities, zero quantities, negative prices
  assert.equal(validateQuantitySold('-2').valid, false);
  assert.match(validateQuantitySold('-2').error ?? '', /cannot be negative/i);
  assert.equal(validateQuantitySold('0').valid, false);
  assert.equal(validateQuantitySold('').valid, false);
  assert.equal(validatePositiveAmount('-500', 'Unit selling price').valid, false);
  assert.ok(validateProductOrService('  ') !== null);

  const records: SalesRecord[] = [
    {
      id: 'r1',
      date: '2026-11-16',
      productOrService: '50kg Bag of Rice',
      quantityRaw: '2',
      unitPriceRaw: '85000',
      paymentMethod: 'bank_transfer',
      customerName: 'Mama Tunde Kitchen',
    },
    {
      id: 'r2',
      date: '2026-11-16',
      productOrService: 'Vegetable Oil 25L',
      quantityRaw: '3',
      unitPriceRaw: '42000',
      paymentMethod: 'pos',
      customerName: '',
    },
    {
      id: 'r3',
      date: '2026-11-15',
      productOrService: 'Indomie Carton',
      quantityRaw: '5',
      unitPriceRaw: '9500',
      paymentMethod: 'cash',
      customerName: 'Chidi Mini Mart',
    },
  ];

  // Overall totals: (2*85000=170000) + (3*42000=126000) + (5*9500=47500) = 343500
  const moduleSummary = calculateSalesModuleSummary(records);
  assert.equal(moduleSummary.totalSalesAmount, 343500);
  assert.equal(moduleSummary.recordCount, 3);
  assert.equal(moduleSummary.totalQuantity, 10);

  // Selected filtering by Payment Method (POS only)
  const posOnly = filterSalesRecords(
    records,
    { paymentMethod: 'pos', period: 'all', dateFilter: null, searchQuery: '' },
    new Date(2026, 10, 16)
  );
  assert.equal(posOnly.length, 1);
  assert.equal(calculateSalesModuleSummary(posOnly).totalSalesAmount, 126000);

  // Selected filtering by Date (Today: 2026-11-16)
  const todayOnly = filterSalesRecords(
    records,
    { paymentMethod: 'all', period: 'today', dateFilter: null, searchQuery: '' },
    new Date(2026, 10, 16)
  );
  assert.equal(todayOnly.length, 2);
  assert.equal(calculateSalesModuleSummary(todayOnly).totalSalesAmount, 296000);

  // Selected filtering by Search Query (customer name)
  const searchChidi = filterSalesRecords(
    records,
    { paymentMethod: 'all', period: 'all', dateFilter: null, searchQuery: 'chidi' },
    new Date(2026, 10, 16)
  );
  assert.equal(searchChidi.length, 1);
  assert.equal(calculateSalesModuleSummary(searchChidi).totalSalesAmount, 47500);

  // Verify Profit Calculator remains completely independent (never double-counts sales records)
  const calcResult = calculateLedgerSummary('250000', [
    { id: 'e1', description: 'Shop Rent', amountRaw: '150000' },
  ]);
  assert.equal(calcResult.totalIncome, 250000);
  assert.equal(calcResult.netProfit, 100000);
  assert.equal(calcResult.profitMarginPercent, 40);
}

console.log('All 10 SmartLedger profit calculator & Sales Module test suites passed.');
