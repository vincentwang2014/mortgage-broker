import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 2025 CA conforming limits
const CONFORMING_LIMIT = 806500;
const HIGH_COST_CA_LIMIT = 1209750;

const FICO_BUCKET_MAP = {
  'below 640': 620,
  '640-679': 640, '640–679': 640,
  '680-719': 680, '680–719': 680,
  '720-759': 720, '720–759': 720,
  '760+': 760, '760 or above': 760, '760 and above': 760,
};

const PROPERTY_TYPE_MAP = {
  'single family': 'single_family', 'single_family': 'single_family', 'sfh': 'single_family', 'sf': 'single_family',
  'condo': 'condo', 'condominium': 'condo',
  '2-4 units': 'two_to_four_units', '2–4 units': 'two_to_four_units',
  '2 to 4 units': 'two_to_four_units', 'multi': 'two_to_four_units', 'multifamily': 'two_to_four_units',
  'investment': 'investment_property', 'investment property': 'investment_property',
};

const LOAN_PURPOSE_MAP = {
  'purchase': 'purchase', 'buy': 'purchase', 'buying': 'purchase',
  'refinance': 'refinance', 'refi': 'refinance', 'rate/term': 'refinance',
  'rate and term': 'refinance', 'rate term': 'refinance',
  'cash-out': 'cash_out_refinance', 'cash out': 'cash_out_refinance', 'cashout': 'cash_out_refinance',
  'dscr': 'dscr', 'investment': 'dscr', 'investor': 'dscr',
};

// Parse dollar amounts — handles "$800,000", "800K", "1.2M", 800000
function parseAmount(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number' && !isNaN(val)) return val;
  const str = String(val).replace(/[$,\s]/g, '').toUpperCase();
  if (str.endsWith('K')) return parseFloat(str) * 1000;
  if (str.endsWith('M')) return parseFloat(str) * 1000000;
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

// Determine loan program from scenario fields
function determineLoanProgram({ loan_amount, fico_for_pricing, ltv, loan_purpose, property_type, occupancy }) {
  if (loan_purpose === 'dscr' || property_type === 'investment_property') return 'dscr';
  if (loan_amount > HIGH_COST_CA_LIMIT) return 'jumbo';
  if (fico_for_pricing && fico_for_pricing < 640) return 'fha';
  if (ltv && ltv > 96.5) return 'fha';
  return 'conventional';
}

/**
 * Normalizes raw AI intake data into a standard pricing scenario.
 *
 * @param {Object} raw - Raw fields from AI chat or form
 * @returns {{ scenario: Object, errors: string[], valid: boolean }}
 */
export function normalizeScenario(raw) {
  const errors = [];

  // Loan purpose
  const purposeKey = (raw.loan_purpose || '').toLowerCase().trim();
  const loan_purpose = LOAN_PURPOSE_MAP[purposeKey] || null;
  if (!loan_purpose) errors.push('loan_purpose is required (purchase / refinance / cash_out_refinance / dscr)');

  // Property type
  const propKey = (raw.property_type || '').toLowerCase().trim();
  const property_type = PROPERTY_TYPE_MAP[propKey] || propKey || 'single_family';

  // FICO
  const ficoBucketKey = (raw.fico_bucket || raw.credit_score || '').trim();
  const fico_for_pricing = FICO_BUCKET_MAP[ficoBucketKey] ?? (raw.fico_for_pricing ? parseInt(raw.fico_for_pricing) : null);
  if (!fico_for_pricing) errors.push('credit_score / fico_bucket is required (e.g. "720-759" or "760+")');

  // Amounts
  const loan_amount   = parseAmount(raw.loan_amount);
  const purchase_price = parseAmount(raw.purchase_price);
  const down_payment   = parseAmount(raw.down_payment);
  const property_value = parseAmount(raw.property_value);
  const current_balance = parseAmount(raw.current_balance);

  // LTV calculation
  let ltv = null;
  let resolved_loan_amount = loan_amount;
  let resolved_purchase_price = purchase_price;

  if (loan_purpose === 'purchase' || !loan_purpose) {
    if (purchase_price && down_payment) {
      resolved_loan_amount = resolved_loan_amount ?? (purchase_price - down_payment);
      resolved_purchase_price = purchase_price;
      ltv = Math.round((resolved_loan_amount / purchase_price) * 100);
    } else if (loan_amount && purchase_price) {
      ltv = Math.round((loan_amount / purchase_price) * 100);
    } else if (loan_amount && down_payment) {
      resolved_purchase_price = loan_amount + down_payment;
      ltv = Math.round((loan_amount / resolved_purchase_price) * 100);
    } else if (loan_purpose === 'purchase') {
      errors.push('For purchase: provide purchase_price + down_payment, or purchase_price + loan_amount');
    }
  }

  if (loan_purpose === 'refinance' || loan_purpose === 'cash_out_refinance') {
    if (property_value && loan_amount) {
      ltv = Math.round((loan_amount / property_value) * 100);
    } else if (property_value && current_balance) {
      resolved_loan_amount = resolved_loan_amount ?? current_balance;
      ltv = Math.round((current_balance / property_value) * 100);
    } else {
      errors.push('For refinance: provide property_value + loan_amount (or current_balance)');
    }
  }

  if (!resolved_loan_amount) errors.push('loan_amount could not be determined');

  // Other fields
  const state      = (raw.state || 'CA').toUpperCase().trim();
  const county     = raw.county || (state === 'CA' ? 'Los Angeles' : null);
  const occupancy  = raw.occupancy || 'primary';
  const lock_days  = parseInt(raw.lock_days) || 30;
  const term       = raw.term || '30_year_fixed';
  const refi_type  = raw.refi_type || null; // 'rate_term' | 'cash_out'

  const loan_program = raw.loan_program ||
    determineLoanProgram({ loan_amount: resolved_loan_amount, fico_for_pricing, ltv, loan_purpose, property_type, occupancy });

  const scenario = {
    loan_purpose,
    loan_program,
    state,
    county,
    property_type,
    occupancy,
    ...(resolved_purchase_price && { purchase_price: Math.round(resolved_purchase_price) }),
    ...(down_payment           && { down_payment:    Math.round(down_payment) }),
    ...(property_value         && { property_value:  Math.round(property_value) }),
    ...(current_balance        && { current_balance: Math.round(current_balance) }),
    ...(refi_type              && { refi_type }),
    loan_amount: resolved_loan_amount ? Math.round(resolved_loan_amount) : null,
    ltv,
    fico_bucket: ficoBucketKey,
    fico_for_pricing,
    lock_days,
    term,
  };

  return { scenario, errors, valid: errors.length === 0 };
}

/**
 * Loads current field mapping config.
 */
export function loadFieldMapping() {
  const path = join(__dirname, '../config/field_mapping.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}
