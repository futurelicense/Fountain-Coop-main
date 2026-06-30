/** Cooperative bank details shown for member bank-transfer instructions. */
export const COOPERATIVE_BANK = {
  bankName: 'Access Bank',
  accountName: 'Fountain Cooperative Society Ltd',
  accountNumber: '0123456789',
};

/** Branch pickup details for cash withdrawals. */
export const BRANCH_PICKUP_INFO: Record<
  string,
  { address: string; hours: string; phone: string }
> = {
  'Lagos Main': {
    address: '12 Adeniyi Jones Ave, Ikeja, Lagos',
    hours: 'Mon–Fri, 9:00 AM – 4:00 PM',
    phone: '+234 803 100 2000',
  },
};

export function branchPickupInfo(branch: string | null | undefined) {
  if (branch && BRANCH_PICKUP_INFO[branch]) {
    return BRANCH_PICKUP_INFO[branch];
  }
  return {
    address: 'Contact your branch admin for pickup location.',
    hours: 'Mon–Fri, 9:00 AM – 4:00 PM',
    phone: '+234 803 100 2000',
  };
}
