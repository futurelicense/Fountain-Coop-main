/** Member app routes under `/member`. */
export const memberPaths = {
  home: '/member',
  savings: '/member/savings',
  savingsThrift: '/member/savings/thrift',
  loans: '/member/loans',
  loanApply: '/member/loans/apply',
  investments: '/member/investments',
  activity: '/member/activity',
  support: '/member/support',
  profile: '/member/profile',
} as const;
