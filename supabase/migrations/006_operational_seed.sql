-- Migration 006: Seed operational_items catalog data for each admin module.
-- Gives every admin page real starting data on first deploy.
-- Depends on: 003_operational_items.sql
-- Safe to re-run (inserts only when module is empty).

-- Helper: insert only if module+subtype has 0 rows
-- We use a DO block to check each module individually.

do $$
begin

-- ─── BRANCHES ────────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'branches') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('branches','branchDetail',true,'{"name":"Lagos Main","address":"15 Marina Road, Lagos Island","manager":"Adebayo Ogundimu","phone":"+234 801 000 0001","status":"Active","activeMembers":6,"staff":8,"monthlyCollections":1850000,"recoveryRate":94,"totalSavings":5200000,"loanBook":1800000}'),
  ('branches','branchDetail',true,'{"name":"Ikeja","address":"42 Awolowo Way, Ikeja, Lagos","manager":"Bayo Afolabi","phone":"+234 801 000 0002","status":"Active","activeMembers":2,"staff":5,"monthlyCollections":720000,"recoveryRate":88,"totalSavings":1950000,"loanBook":650000}'),
  ('branches','branchDetail',true,'{"name":"Abuja","address":"Plot 18 Wuse Zone 5, Abuja","manager":"Fatima Aliyu","phone":"+234 801 000 0003","status":"Active","activeMembers":2,"staff":4,"monthlyCollections":580000,"recoveryRate":91,"totalSavings":1420000,"loanBook":450000}'),
  ('branches','branchDetail',true,'{"name":"Port Harcourt","address":"21 Rumuola Road, Port Harcourt","manager":"Emeka Obi","phone":"+234 801 000 0004","status":"Active","activeMembers":1,"staff":3,"monthlyCollections":310000,"recoveryRate":87,"totalSavings":820000,"loanBook":220000}'),
  ('branches','branchDetail',true,'{"name":"Lekki","address":"4 Admiralty Way, Lekki Phase 1, Lagos","manager":"Sade Fashola","phone":"+234 801 000 0005","status":"Active","activeMembers":1,"staff":3,"monthlyCollections":290000,"recoveryRate":96,"totalSavings":760000,"loanBook":180000}'),
  ('branches','branchStaff',true,'{"name":"Adebayo Ogundimu","role":"Branch Manager","branch":"Lagos Main","status":"Active","joinDate":"2022-01-15"}'),
  ('branches','branchStaff',true,'{"name":"Tolu Adegoke","role":"Thrift Collector","branch":"Lagos Main","status":"Active","joinDate":"2022-03-20"}'),
  ('branches','branchStaff',true,'{"name":"Bayo Afolabi","role":"Branch Manager","branch":"Ikeja","status":"Active","joinDate":"2022-06-01"}');
end if;

-- ─── LOANS ───────────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'loans') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('loans','loanProduct',true,'{"name":"Regular Loan","maxAmount":2000000,"tenure":"12 months","interestRate":"1.5% monthly","requirement":"6 months savings history + 2 guarantors"}'),
  ('loans','loanProduct',true,'{"name":"Emergency Loan","maxAmount":500000,"tenure":"6 months","interestRate":"2.0% monthly","requirement":"3 months savings history"}'),
  ('loans','loanProduct',true,'{"name":"Asset Loan","maxAmount":5000000,"tenure":"24 months","interestRate":"1.8% monthly","requirement":"12 months savings + asset collateral"}'),
  ('loans','loanProduct',true,'{"name":"Business Loan","maxAmount":10000000,"tenure":"36 months","interestRate":"1.5% monthly","requirement":"12 months savings + business plan + 3 guarantors"}'),
  ('loans','loanApplication',false,'{"memberName":"Emeka Nwosu","memberId":"FC-1002","loanType":"Regular","amount":500000,"appliedDate":"2026-03-01","guarantors":"2/2","status":"Approved"}'),
  ('loans','loanApplication',false,'{"memberName":"Fatima Abdullahi","memberId":"FC-1003","loanType":"Emergency","amount":150000,"appliedDate":"2026-04-10","guarantors":"1/2","status":"Pending"}'),
  ('loans','activeLoan',false,'{"memberName":"Emeka Nwosu","memberId":"FC-1002","branch":"Ikeja","loanType":"Regular","tenure":12,"principal":500000,"outstanding":500000,"nextPaymentDate":"2026-05-01","nextPaymentAmount":50750,"status":"Current","daysOverdue":0,"disbursedThisMonth":500000}'),
  ('loans','activeLoan',false,'{"memberName":"Ngozi Chukwu","memberId":"FC-1007","branch":"Lagos Main","loanType":"Asset","tenure":24,"principal":1200000,"outstanding":1200000,"nextPaymentDate":"2026-02-15","nextPaymentAmount":105000,"status":"Overdue","daysOverdue":62,"disbursedThisMonth":0}'),
  ('loans','activeLoan',false,'{"memberName":"Tunde Olatunji","memberId":"FC-1010","branch":"Lagos Main","loanType":"Regular","tenure":12,"principal":750000,"outstanding":750000,"nextPaymentDate":"2026-04-20","nextPaymentAmount":76125,"status":"Current","daysOverdue":0,"disbursedThisMonth":750000}');
end if;

-- ─── THRIFT ──────────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'thrift') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('thrift','thriftPlan',true,'{"name":"Daily Saver","description":"₦500 per day. Collected daily by field agents.","frequency":"Daily","participants":6,"amount":500,"totalCollected":450000}'),
  ('thrift','thriftPlan',true,'{"name":"Weekly Thrift","description":"₦2,500 per week. Ideal for traders.","frequency":"Weekly","participants":3,"amount":2500,"totalCollected":120000}'),
  ('thrift','thriftPlan',true,'{"name":"Monthly Thrift","description":"₦10,000 per month. Corporate salary earners.","frequency":"Monthly","participants":2,"amount":10000,"totalCollected":80000}'),
  ('thrift','collector',true,'{"name":"Tolu Adegoke","route":"Lagos Main - Zone A","assignedMembers":4,"todayCollected":2000,"dailyTarget":3000,"status":"Active"}'),
  ('thrift','collector',true,'{"name":"Kemi Badmos","route":"Ikeja - Zone B","assignedMembers":2,"todayCollected":1000,"dailyTarget":1500,"status":"Active"}'),
  ('thrift','thriftParticipant',false,'{"memberName":"Chioma Okafor","branch":"Lagos Main","plan":"Daily Saver","frequency":"Daily","amount":500,"totalPaid":45000,"daysStreak":31,"collector":"Tolu Adegoke","status":"Active"}'),
  ('thrift','thriftParticipant',false,'{"memberName":"Chinedu Eze","branch":"Port Harcourt","plan":"Daily Saver","frequency":"Daily","amount":500,"totalPaid":62000,"daysStreak":45,"collector":"Tolu Adegoke","status":"Active"}'),
  ('thrift','thriftParticipant',false,'{"memberName":"Tunde Olatunji","branch":"Lagos Main","plan":"Weekly Thrift","frequency":"Weekly","amount":2500,"totalPaid":30000,"daysStreak":12,"collector":"Kemi Badmos","status":"Active"}');
end if;

-- ─── AJO/OSUSU ───────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'ajo') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('ajo','ajoCycle',true,'{"name":"Lagos Women Circle","status":"Active","contributionAmount":50000,"frequency":"Monthly","totalParticipants":12,"totalValue":600000,"nextPayoutDate":"2026-05-01","nextPayoutRecipient":"Aisha Ibrahim","completedPayouts":4,"nextPayoutValue":600000}'),
  ('ajo','ajoCycle',true,'{"name":"Ikeja Traders Union","status":"Active","contributionAmount":25000,"frequency":"Monthly","totalParticipants":8,"totalValue":200000,"nextPayoutDate":"2026-05-15","nextPayoutRecipient":"Emeka Nwosu","completedPayouts":2,"nextPayoutValue":200000}'),
  ('ajo','cycleSlot',false,'{"cycleId":"","position":1,"memberName":"Chioma Okafor","status":"Paid Out","contributionStatus":"Completed"}'),
  ('ajo','cycleSlot',false,'{"cycleId":"","position":2,"memberName":"Fatima Abdullahi","status":"Paid Out","contributionStatus":"Completed"}'),
  ('ajo','cycleSlot',false,'{"cycleId":"","position":3,"memberName":"Aisha Ibrahim","status":"Next Payout","contributionStatus":"Current"}'),
  ('ajo','cycleSlot',false,'{"cycleId":"","position":4,"memberName":"Tunde Olatunji","status":"Waiting","contributionStatus":"Current"}');
end if;

-- ─── COOPERATIVE ─────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'cooperative') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('cooperative','savingsPlan',true,'{"name":"Standard Monthly","description":"Monthly contribution of ₦20,000–₦100,000. 5% p.a. interest. 30-day withdrawal notice.","monthlyTarget":50000,"members":6,"lockPeriod":"1 month notice"}'),
  ('cooperative','savingsPlan',true,'{"name":"Premium Monthly","description":"Monthly contribution ₦100,000+. 6% p.a. interest. Preferred loan rates.","monthlyTarget":100000,"members":2,"lockPeriod":"1 month notice"}'),
  ('cooperative','savingsPlan',true,'{"name":"Junior Saver","description":"For members under 25. ₦5,000/month minimum. 5% p.a.","monthlyTarget":5000,"members":2,"lockPeriod":"6 months"}'),
  ('cooperative','memberSaving',false,'{"memberName":"Chioma Okafor","memberId":"FC-1001","branch":"Lagos Main","plan":"Premium Monthly","monthlyTarget":50000,"currentBalance":450000,"monthsActive":9,"lastContribution":"2026-03-26","status":"On Track"}'),
  ('cooperative','memberSaving',false,'{"memberName":"Emeka Nwosu","memberId":"FC-1002","branch":"Ikeja","plan":"Standard Monthly","monthlyTarget":20000,"currentBalance":120000,"monthsActive":6,"lastContribution":"2026-03-01","status":"On Track"}'),
  ('cooperative','memberSaving',false,'{"memberName":"Fatima Abdullahi","memberId":"FC-1003","branch":"Abuja","plan":"Standard Monthly","monthlyTarget":20000,"currentBalance":340000,"monthsActive":17,"lastContribution":"2026-02-15","status":"Behind"}'),
  ('cooperative','memberSaving',false,'{"memberName":"Chinedu Eze","memberId":"FC-1006","branch":"Port Harcourt","plan":"Premium Monthly","monthlyTarget":50000,"currentBalance":670000,"monthsActive":13,"lastContribution":"2026-03-20","status":"On Track"}'),
  ('cooperative','coopChart',true,'{"month":"Nov","totalSavings":4800000,"contributions":420000}'),
  ('cooperative','coopChart',true,'{"month":"Dec","totalSavings":5100000,"contributions":480000}'),
  ('cooperative','coopChart',true,'{"month":"Jan","totalSavings":5400000,"contributions":520000}'),
  ('cooperative','coopChart',true,'{"month":"Feb","totalSavings":5800000,"contributions":580000}'),
  ('cooperative','coopChart',true,'{"month":"Mar","totalSavings":6200000,"contributions":620000}');
end if;

-- ─── PACKS ───────────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'packs') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('packs','pack',true,'{"name":"Daily 30 Pack","status":"Active","contributionAmount":1500,"frequency":"Daily","packValue":45000,"durationDays":30,"adminFee":0,"nextPayoutDate":"2026-05-01","filledSlots":24,"totalSlots":30}'),
  ('packs','pack',true,'{"name":"Premium 60 Pack","status":"Active","contributionAmount":2000,"frequency":"Daily","packValue":120000,"durationDays":60,"adminFee":500,"nextPayoutDate":"2026-06-01","filledSlots":40,"totalSlots":60}'),
  ('packs','pack',true,'{"name":"Weekend Saver","status":"Upcoming","contributionAmount":5000,"frequency":"Weekly","packValue":60000,"durationDays":84,"adminFee":1000,"nextPayoutDate":"2026-07-01","filledSlots":0,"totalSlots":12}');
end if;

-- ─── RECOVERY ────────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'recovery') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('recovery','recoveryCase',false,'{"memberName":"Ngozi Chukwu","branch":"Lagos Main","loanType":"Asset","outstanding":1200000,"originalAmount":1200000,"agingBucket":"61-90","daysOverdue":62,"assignedOfficer":"Tolu Adegoke","lastContact":"2026-04-01","status":"Escalated","recoveredThisMonth":0}'),
  ('recovery','recoveryCase',false,'{"memberName":"Fatima Abdullahi","branch":"Abuja","loanType":"Emergency","outstanding":150000,"originalAmount":150000,"agingBucket":"1-30","daysOverdue":18,"assignedOfficer":"Kemi Badmos","lastContact":"2026-04-10","status":"Promise to Pay","recoveredThisMonth":0}'),
  ('recovery','recoveryCase',false,'{"memberName":"Tunde Olatunji","branch":"Lagos Main","loanType":"Regular","outstanding":750000,"originalAmount":750000,"agingBucket":"1-30","daysOverdue":5,"assignedOfficer":"Tolu Adegoke","lastContact":"2026-04-15","status":"Active","recoveredThisMonth":0}'),
  ('recovery','recoveryOfficer',true,'{"name":"Tolu Adegoke","casesAssigned":2,"casesResolved":1,"amountRecovered":80000,"successRate":78}'),
  ('recovery','recoveryOfficer',true,'{"name":"Kemi Badmos","casesAssigned":1,"casesResolved":0,"amountRecovered":0,"successRate":0}'),
  ('recovery','recoveryTrend',true,'{"month":"Nov","recovered":280000,"target":400000}'),
  ('recovery','recoveryTrend',true,'{"month":"Dec","recovered":410000,"target":400000}'),
  ('recovery','recoveryTrend',true,'{"month":"Jan","recovered":320000,"target":450000}'),
  ('recovery','recoveryTrend',true,'{"month":"Feb","recovered":390000,"target":450000}'),
  ('recovery','recoveryTrend',true,'{"month":"Mar","recovered":480000,"target":500000}'),
  ('recovery','agingSnapshot',true,'{"current":{"count":8,"amount":4200000},"bucket1_30":{"count":3,"amount":900000},"bucket31_60":{"count":1,"amount":150000},"bucket61_90":{"count":1,"amount":1200000},"bucket90plus":{"count":0,"amount":0}}'),
  ('recovery','promiseToPay',false,'{"memberName":"Fatima Abdullahi","dueDate":"2026-04-25","amount":150000,"status":"Pending"}');
end if;

-- ─── COMPLIANCE ──────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'compliance') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('compliance','pendingApproval',false,'{"type":"Loan","priority":"high","description":"₦1.2M loan restructure request for FC-1007","requestedBy":"Tolu Adegoke","requestDate":"2026-04-15","requiresDual":true,"status":"pending"}'),
  ('compliance','pendingApproval',false,'{"type":"Withdrawal","priority":"medium","description":"₦450,000 cooperative savings withdrawal – FC-1001","requestedBy":"Adebayo Ogundimu","requestDate":"2026-04-18","requiresDual":false,"status":"pending"}'),
  ('compliance','auditLog',false,'{"timestamp":"2026-04-18 09:15","user":"Adebayo Ogundimu","role":"super_admin","action":"Approved loan application for Emeka Nwosu (FC-1002)","category":"Loans","severity":"normal","ip":"197.210.x.x"}'),
  ('compliance','auditLog',false,'{"timestamp":"2026-04-17 14:32","user":"System","role":"Automated","action":"KYC reminder sent to 3 members with pending documents","category":"Compliance","severity":"warning","ip":"—"}'),
  ('compliance','auditLog',false,'{"timestamp":"2026-04-16 11:00","user":"Tolu Adegoke","role":"group_admin","action":"Escalated overdue loan case – Ngozi Chukwu (FC-1007)","category":"Recovery","severity":"high","ip":"197.210.x.x"}'),
  ('compliance','auditLog',false,'{"timestamp":"2026-04-15 16:45","user":"Bayo Afolabi","role":"tenant_admin","action":"Monthly reconciliation report generated for Ikeja branch","category":"Finance","severity":"normal","ip":"197.210.x.x"}');
end if;

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'transactions') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('transactions','ledgerEntry',false,'{"idLabel":"TXN-001","date":"2026-04-18 09:30","member":"Chioma Okafor","memberId":"FC-1001","type":"Savings Deposit","category":"Cooperative","amount":50000,"direction":"credit","branch":"Lagos Main","reference":"SAV-18042601","status":"Completed"}'),
  ('transactions','ledgerEntry',false,'{"idLabel":"TXN-002","date":"2026-04-17 08:00","member":"Chioma Okafor","memberId":"FC-1001","type":"Thrift Contribution","category":"Thrift","amount":500,"direction":"credit","branch":"Lagos Main","reference":"THR-17042601","status":"Completed"}'),
  ('transactions','ledgerEntry',false,'{"idLabel":"TXN-003","date":"2026-04-15 11:20","member":"Emeka Nwosu","memberId":"FC-1002","type":"Loan Disbursement","category":"Loans","amount":500000,"direction":"debit","branch":"Ikeja","reference":"LN-15042601","status":"Completed"}'),
  ('transactions','ledgerEntry',false,'{"idLabel":"TXN-004","date":"2026-04-14 14:00","member":"Chinedu Eze","memberId":"FC-1006","type":"Savings Deposit","category":"Cooperative","amount":50000,"direction":"credit","branch":"Port Harcourt","reference":"SAV-14042601","status":"Completed"}'),
  ('transactions','ledgerEntry',false,'{"idLabel":"TXN-005","date":"2026-04-10 09:00","member":"Tunde Olatunji","memberId":"FC-1010","type":"Ajo Payout","category":"Ajo/Osusu","amount":600000,"direction":"credit","branch":"Lagos Main","reference":"AJO-10042601","status":"Completed"}'),
  ('transactions','ledgerEntry',false,'{"idLabel":"TXN-006","date":"2026-04-05 10:30","member":"Fatima Abdullahi","memberId":"FC-1003","type":"Loan Repayment","category":"Loans","amount":25000,"direction":"credit","branch":"Abuja","reference":"LNR-05042601","status":"Completed"}');
end if;

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'notifications') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('notifications','notification',false,'{"title":"Loan Approved – Emeka Nwosu","message":"Your Regular Loan of ₦500,000 has been approved and disbursed.","channel":"SMS","type":"loan","recipient":"FC-1002","sentAt":"2026-04-15 11:25","status":"Delivered"}'),
  ('notifications','notification',false,'{"title":"Monthly Savings Reminder","message":"Your April cooperative savings contribution of ₦50,000 is due by April 30.","channel":"WhatsApp","type":"reminder","recipient":"All members","sentAt":"2026-04-01 08:00","status":"Delivered"}'),
  ('notifications','notification',false,'{"title":"KYC Pending – Action Required","message":"Please complete your KYC documentation at your nearest branch.","channel":"SMS","type":"alert","recipient":"3 members","sentAt":"2026-04-17 14:35","status":"Partial"}'),
  ('notifications','notification',false,'{"title":"Ajo Payout – Tunde Olatunji","message":"Congratulations! Your Ajo payout of ₦600,000 has been processed.","channel":"In-App","type":"payout","recipient":"FC-1010","sentAt":"2026-04-10 09:05","status":"Delivered"}');
end if;

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
if not exists (select 1 from public.operational_items where module = 'reports') then
  insert into public.operational_items (module, subtype, is_catalog, data) values
  ('reports','catalogEntry',true,'{"name":"Monthly Member Statement","description":"All member savings, loan, and thrift activity for the selected month.","category":"Members","frequency":"Monthly","lastGenerated":"2026-04-01"}'),
  ('reports','catalogEntry',true,'{"name":"Loan Portfolio Report","description":"Active loans, overdue accounts, and PAR ratio by branch.","category":"Loans","frequency":"Weekly","lastGenerated":"2026-04-14"}'),
  ('reports','catalogEntry',true,'{"name":"Daily Collection Summary","description":"Thrift collections by collector and route.","category":"Thrift","frequency":"Daily","lastGenerated":"2026-04-18"}'),
  ('reports','catalogEntry',true,'{"name":"Ajo Cycle Status","description":"Open cycles, slot status, and upcoming payouts.","category":"Ajo/Osusu","frequency":"On Demand","lastGenerated":"2026-04-10"}'),
  ('reports','catalogEntry',true,'{"name":"Executive Dashboard","description":"KPIs, branch performance, and compliance summary for management.","category":"Executive","frequency":"Monthly","lastGenerated":"2026-04-01"}'),
  ('reports','catalogEntry',true,'{"name":"Compliance Audit Log","description":"Full audit trail of staff actions and system events.","category":"Compliance","frequency":"On Demand","lastGenerated":"2026-04-16"}');
end if;

end $$;
