/**
 * @file types.ts
 * @description Types, constants, and tax definitions for the Habeshawi Calculator Suite.
 */

export type CalculatorCategory = 
  | 'standard' 
  | 'salary' 
  | 'loan' 
  | 'time_age' 
  | 'tip_split' 
  | 'discount_vat' 
  | 'investment' 
  | 'fuel_trip'
  | 'converter';

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number; // For conversion
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'ETB', name: 'Ethiopian Birr (ብር)', symbol: 'ETB', rateToUSD: 0.0076 }, // approx rate
  { code: 'USD', name: 'US Dollar ($)', symbol: '$', rateToUSD: 1.0 },
  { code: 'EUR', name: 'Euro (€)', symbol: '€', rateToUSD: 1.08 },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£', rateToUSD: 1.29 },
  { code: 'AED', name: 'UAE Dirham (د.إ)', symbol: 'AED', rateToUSD: 0.272 },
  { code: 'SAR', name: 'Saudi Riyal (﷼)', symbol: 'SAR', rateToUSD: 0.266 },
  { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$', rateToUSD: 0.73 },
  { code: 'KES', name: 'Kenyan Shilling (KSh)', symbol: 'KSh', rateToUSD: 0.0077 },
];

/**
 * Official Ethiopian Progressive Income Tax Brackets (Proclamation No. 979/2016)
 */
export interface EthiopianTaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}

export const ETHIOPIAN_TAX_BRACKETS: EthiopianTaxBracket[] = [
  { min: 0, max: 600, rate: 0.0, deduction: 0 },
  { min: 601, max: 1650, rate: 0.10, deduction: 60 },
  { min: 1651, max: 3200, rate: 0.15, deduction: 142.5 },
  { min: 3201, max: 5250, rate: 0.20, deduction: 302.5 },
  { min: 5251, max: 7800, rate: 0.25, deduction: 565 },
  { min: 7801, max: 10900, rate: 0.30, deduction: 955 },
  { min: 10901, max: Infinity, rate: 0.35, deduction: 1500 },
];

export interface SalaryCalculationInput {
  currency: string;
  payFrequency: 'monthly' | 'annual' | 'biweekly' | 'weekly';
  basicSalary: number;
  // Allowances
  housingAllowance: number;
  isHousingTaxable: boolean;
  transportAllowance: number;
  isTransportTaxable: boolean;
  transportTaxExemptThreshold: number; // e.g. 2200 ETB or 25% of basic
  applyTransportExemption: boolean;
  foodAllowance: number;
  isFoodTaxable: boolean;
  responsibilityAllowance: number;
  isResponsibilityTaxable: boolean;
  otherAllowances: number;
  isOtherTaxable: boolean;
  // Overtime (OT)
  standardWorkHoursPerDay: number;
  standardWorkDaysPerMonth: number;
  daytimeOtHours: number; // 1.25x
  nighttimeOtHours: number; // 1.5x
  weekendOtHours: number; // 2.0x
  holidayOtHours: number; // 2.5x
  // Taxes & Deductions
  taxMode: 'ethiopian' | 'flat' | 'none';
  customFlatTaxRate: number; // in percent
  enableEmployeePension: boolean;
  employeePensionRate: number; // default 7%
  enableEmployerPension: boolean;
  employerPensionRate: number; // default 11%
  costSharingDeduction: number;
  healthInsuranceDeduction: number;
  otherDeductions: number;
}

export interface SalaryCalculationResult {
  basicSalary: number;
  totalAllowances: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  totalOtHours: number;
  hourlyRate: number;
  daytimeOtPay: number;
  nighttimeOtPay: number;
  weekendOtPay: number;
  holidayOtPay: number;
  totalOtPay: number;
  grossSalary: number;
  taxableIncome: number;
  incomeTax: number;
  effectiveTaxRate: number;
  employeePension: number;
  employerPension: number;
  totalDeductions: number;
  netSalary: number;
  employerTotalCost: number;
}

export interface LoanCalculationInput {
  currency: string;
  loanAmount: number;
  interestRateAnnual: number;
  loanTenureYears: number;
  loanTenureMonths: number;
  interestType: 'reducing' | 'flat';
  extraMonthlyPayment: number;
  paymentFrequency: 'monthly' | 'biweekly' | 'quarterly';
  startDate: string;
}

export interface AmortizationRow {
  period: number;
  date: string;
  startingBalance: number;
  monthlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  extraPayment: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface LoanCalculationResult {
  monthlyPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPayment: number;
  payoffPeriodMonths: number;
  payoffDate: string;
  interestSavedWithExtra: number;
  monthsSavedWithExtra: number;
  amortizationSchedule: AmortizationRow[];
}
