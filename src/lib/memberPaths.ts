/** Member app routes under `/member`. */
export const memberPaths = {
  home: '/member',
  savings: '/member/savings',
  savingsThrift: '/member/savings/thrift',
  loans: '/member/loans',
  loanApply: '/member/loans/apply',
  activity: '/member/activity',
  profile: '/member/profile',
} as const;
