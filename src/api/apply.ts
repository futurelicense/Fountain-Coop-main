import { ApiError } from './client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

export type MembershipApplicationInput = {
  fullName: string;
  occupation: string;
  isEmployed: boolean;
  employer: string;
  ownsBusiness: boolean;
  businessType: string;
  homeAddress: string;
  officeAddress: string;
  phone: string;
  email: string;
  referralSource: string;
  monthlyContribution: string;
  wantsFountainBasket: boolean;
  nextOfKinName: string;
  nextOfKinAddress: string;
  nextOfKinPhone: string;
  emergencyContact: string;
  declarationAccepted: boolean;
  photo: File;
};

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

/** Public: submits the member application (multipart, includes the headshot photo). */
export async function submitMembershipApplication(
  input: MembershipApplicationInput
): Promise<{ applicationId: string }> {
  const form = new FormData();
  form.set('fullName', input.fullName);
  form.set('occupation', input.occupation);
  form.set('isEmployed', String(input.isEmployed));
  form.set('employer', input.employer);
  form.set('ownsBusiness', String(input.ownsBusiness));
  form.set('businessType', input.businessType);
  form.set('homeAddress', input.homeAddress);
  form.set('officeAddress', input.officeAddress);
  form.set('phone', input.phone);
  form.set('email', input.email);
  form.set('referralSource', input.referralSource);
  form.set('monthlyContribution', input.monthlyContribution);
  form.set('wantsFountainBasket', String(input.wantsFountainBasket));
  form.set('nextOfKinName', input.nextOfKinName);
  form.set('nextOfKinAddress', input.nextOfKinAddress);
  form.set('nextOfKinPhone', input.nextOfKinPhone);
  form.set('emergencyContact', input.emergencyContact);
  form.set('declarationAccepted', String(input.declarationAccepted));
  form.set('photo', input.photo);

  const res = await fetch(`${baseUrl}/api/apply`, {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as { applicationId: string };
}

/** Public: starts Paystack checkout for the ₦5,000 registration fee. */
export async function initializeApplicationPayment(
  applicationId: string
): Promise<{ authorization_url: string; reference: string }> {
  const res = await fetch(`${baseUrl}/api/apply/paystack/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId }),
    credentials: 'same-origin',
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as { authorization_url: string; reference: string };
}

/** Public: confirms payment succeeded for a given Paystack reference. */
export async function verifyApplicationPayment(reference: string): Promise<{
  applicationId: string;
  email: string;
  fullName: string;
  status: string;
}> {
  const res = await fetch(`${baseUrl}/api/apply/paystack/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
    credentials: 'same-origin',
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as { applicationId: string; email: string; fullName: string; status: string };
}

/** Public: creates the member's login (Supabase Auth account) after payment. */
export async function createMembershipAccount(
  applicationId: string,
  password: string
): Promise<{ email: string; alreadyCreated?: boolean }> {
  const res = await fetch(`${baseUrl}/api/apply/create-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId, password }),
    credentials: 'same-origin',
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as { email: string; alreadyCreated?: boolean };
}
