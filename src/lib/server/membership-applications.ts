import type { SupabaseClient } from '@supabase/supabase-js';

export const MEMBERSHIP_REGISTRATION_FEE_NAIRA = 5000;
export const MEMBERSHIP_PHOTOS_BUCKET = 'membership-photos';

export type MembershipApplicationRecord = {
  id: string;
  full_name: string;
  occupation: string | null;
  is_employed: boolean;
  employer: string | null;
  owns_business: boolean;
  business_type: string | null;
  home_address: string;
  office_address: string | null;
  phone: string;
  email: string;
  referral_source: string | null;
  monthly_contribution: number;
  wants_fountain_basket: boolean;
  next_of_kin_name: string | null;
  next_of_kin_address: string | null;
  next_of_kin_phone: string | null;
  emergency_contact: string | null;
  declaration_accepted: boolean;
  photo_path: string | null;
  status: 'pending_payment' | 'paid' | 'account_created' | 'cancelled';
  registration_fee: number;
  payment_reference: string | null;
  amount_paid: number | null;
  paid_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchMembershipApplicationById(
  supabase: SupabaseClient,
  id: string
): Promise<MembershipApplicationRecord | null> {
  const { data } = await supabase
    .from('membership_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as MembershipApplicationRecord | null) ?? null;
}
