/** Canonical investment return options for Fountain Coop. */

import { pickStr } from '@/lib/pickData';

export type InvestmentProductKind =
  | 'phone_charging_units'
  | 'ajo_for_foodstuffs';

export interface InvestmentProductTemplate {
  kind: InvestmentProductKind;
  name: string;
  tagline: string;
  description: string;
  returnModel: 'fixed_interest' | 'operating_profit';
  minInvestment: number;
  tenureMonths: number;
  /** Phone charging booth model */
  setupItems?: string[];
  investorsRequired?: number;
  investmentPerInvestor?: number;
  totalCapitalRequired?: number;
  investorInterestTotal?: number;
  dailyRevenuePerUnit?: number;
  weeklyCoopProfit?: number;
  paybackMonths?: number;
  /** Ajo-for-foodstuffs model */
  dailyMemberContribution?: number;
  dailyDeliverables?: string[];
  /** Daily wallet collection; basket delivered monthly */
  deliveryFrequency?: 'monthly';
  daysPerDeliveryCycle?: number;
  redemptionWindowDays?: number;
  missedDeliveryPenalty?: number;
  dailyProfit?: number;
  weeklyProfit?: number;
  monthlyProfit?: number;
  annualProfit?: number;
}

export const INVESTMENT_PRODUCT_TEMPLATES: InvestmentProductTemplate[] = [
  {
    kind: 'phone_charging_units',
    name: 'Phone Charging Units',
    tagline: 'Fund booth setup — earn fixed interest over 12 months',
    description:
      'Pool capital with other members to deploy a phone-charging booth (booth, generator, sockets, and POS stand). Each booth targets ₦6,000 daily revenue. Four investors at ₦250,000 each fund one unit; each earns ₦110,000 interest over 12 months with an estimated payback around 11 months.',
    returnModel: 'fixed_interest',
    minInvestment: 250_000,
    tenureMonths: 12,
    setupItems: ['Booth', 'Generator', 'Sockets', 'POS stand'],
    investorsRequired: 4,
    investmentPerInvestor: 250_000,
    totalCapitalRequired: 1_000_000,
    investorInterestTotal: 110_000,
    dailyRevenuePerUnit: 6_000,
    weeklyCoopProfit: 5_077,
    paybackMonths: 11,
  },
  {
    kind: 'ajo_for_foodstuffs',
    name: 'Ajo-for-Foodstuffs',
    tagline: 'Daily ₦1,500 contributions — monthly food basket delivery',
    description:
      'Members contribute ₦1,500 daily from their cooperative wallet. After 30 daily payments, a full food basket is delivered monthly. Provide drop-off location, name, and valid contact to redeem. Missing your delivery window incurs a penalty fee.',
    returnModel: 'operating_profit',
    minInvestment: 1_500,
    tenureMonths: 12,
    dailyMemberContribution: 1_500,
    deliveryFrequency: 'monthly',
    daysPerDeliveryCycle: 30,
    redemptionWindowDays: 3,
    missedDeliveryPenalty: 5_000,
    dailyDeliverables: [
      'Carton super pack Indomie',
      'Carton refill (small size)',
      'Peak milk pack',
      'Sugar 500g',
      'Custard big cup',
      '4 Spaghetti packs',
      'Sardine 4 cans',
      'Closeup toothpaste 2',
      'Golden Penny butter',
      'Detergent soap (big)',
      'Yale biscuits 1 pack',
    ],
    dailyProfit: 24_000,
    weeklyProfit: 168_000,
    monthlyProfit: 720_000,
    annualProfit: 8_760_000,
  },
];

export function getInvestmentTemplate(
  kind: InvestmentProductKind
): InvestmentProductTemplate | undefined {
  return INVESTMENT_PRODUCT_TEMPLATES.find((p) => p.kind === kind);
}

/** Flatten template into operational_items `data` payload. */
export function templateToProductData(
  template: InvestmentProductTemplate
): Record<string, unknown> {
  return {
    kind: template.kind,
    name: template.name,
    tagline: template.tagline,
    description: template.description,
    returnModel: template.returnModel,
    minInvestment: template.minInvestment,
    tenureMonths: template.tenureMonths,
    status: 'Active',
    setupItems: template.setupItems ?? [],
    investorsRequired: template.investorsRequired ?? 0,
    investmentPerInvestor: template.investmentPerInvestor ?? template.minInvestment,
    totalCapitalRequired: template.totalCapitalRequired ?? 0,
    investorInterestTotal: template.investorInterestTotal ?? 0,
    dailyRevenuePerUnit: template.dailyRevenuePerUnit ?? 0,
    weeklyCoopProfit: template.weeklyCoopProfit ?? 0,
    paybackMonths: template.paybackMonths ?? 0,
    dailyMemberContribution: template.dailyMemberContribution ?? 0,
    deliveryFrequency: template.deliveryFrequency ?? 'monthly',
    daysPerDeliveryCycle: template.daysPerDeliveryCycle ?? 30,
    redemptionWindowDays: template.redemptionWindowDays ?? 3,
    missedDeliveryPenalty: template.missedDeliveryPenalty ?? 5_000,
    dailyDeliverables: template.dailyDeliverables ?? [],
    dailyProfit: template.dailyProfit ?? 0,
    weeklyProfit: template.weeklyProfit ?? 0,
    monthlyProfit: template.monthlyProfit ?? 0,
    annualProfit: template.annualProfit ?? 0,
    slotsFilled: 0,
  };
}

export function productKindLabel(kind: string): string {
  if (kind === 'phone_charging_units') return 'Phone Charging Units';
  if (kind === 'ajo_for_foodstuffs') return 'Ajo-for-Foodstuffs';
  return kind;
}

/** Defaults used by foodstuffs subscription APIs. */
export const FOODSTUFFS_DEFAULTS = {
  dailyContribution: 1_500,
  daysPerDeliveryCycle: 30,
  redemptionWindowDays: 3,
  missedDeliveryPenalty: 5_000,
} as const;

export function chargingSlotsFilled(
  productId: string,
  holdings: { data: Record<string, unknown> }[]
): number {
  return holdings.filter(
    (h) =>
      pickStr(h.data, 'productId') === productId &&
      pickStr(h.data, 'productKind') === 'phone_charging_units' &&
      pickStr(h.data, 'status') === 'Active'
  ).length;
}
