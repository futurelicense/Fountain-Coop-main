'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  Loader2Icon,
  UploadCloudIcon,
  UserIcon,
} from 'lucide-react';
import {
  ApiError,
  initializeApplicationPayment,
  submitMembershipApplication,
} from '@/api';
import { formatNaira } from '@/lib/formatNaira';
import { AlertBanner } from '@/components/member/ui/AlertBanner';

const REGISTRATION_FEE = 5000;
const STEP_LABELS = [
  'About you',
  'Contact details',
  'Membership',
  'Next of kin',
  'Photo & declaration',
];
const TOTAL_STEPS = STEP_LABELS.length;

const inputClass =
  'w-full px-4 py-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue focus:ring-2 focus:ring-fountain-blue/20 transition-all';
const labelClass = 'block text-sm font-medium text-fountain-gray-700 mb-1.5';

export default function MemberApplicationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isEmployed, setIsEmployed] = useState<boolean | null>(null);
  const [employer, setEmployer] = useState('');
  const [ownsBusiness, setOwnsBusiness] = useState<boolean | null>(null);
  const [businessType, setBusinessType] = useState('');

  const [homeAddress, setHomeAddress] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [referralSource, setReferralSource] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('5000');
  const [wantsFountainBasket, setWantsFountainBasket] = useState<boolean | null>(null);

  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinAddress, setNextOfKinAddress] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const declarationText = useMemo(
    () =>
      `I ${fullName.trim() || '_______________'} do solemnly swear/affirm that all the information provided by me are correct and I will be faithful and bear true allegiance to the Co-operative and that I will preserve, protect, and defend the constitution of Fountain Multi-Purpose Co-operative Society. So help me God.`,
    [fullName]
  );

  const handlePhotoChange = (file: File | null) => {
    setPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim()) return setError('Enter your full name.');
      if (isEmployed === null) return setError('Let us know if you are currently working.');
      if (isEmployed && !employer.trim()) return setError('Enter where you work.');
      if (ownsBusiness === null) return setError('Let us know if you own a business.');
      if (ownsBusiness && !businessType.trim()) return setError('Tell us what kind of business.');
    }
    if (step === 2) {
      if (!homeAddress.trim()) return setError('Enter your home address.');
      if (!phone.trim()) return setError('Enter your mobile / WhatsApp number.');
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return setError('Enter a valid email address.');
      }
    }
    if (step === 3) {
      if (!referralSource.trim()) return setError('Tell us how you heard about Fountain Coop.');
      if (!Number(monthlyContribution) || Number(monthlyContribution) <= 0) {
        return setError('Enter your planned monthly contribution.');
      }
      if (wantsFountainBasket === null) {
        return setError('Let us know if you want to register for Fountain Basket.');
      }
    }
    if (step === 4) {
      if (!nextOfKinName.trim() || !nextOfKinPhone.trim()) {
        return setError("Enter your next of kin's name and mobile number.");
      }
      if (!emergencyContact.trim()) return setError('Enter an emergency contact.');
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError(null);
    if (step === 1) {
      router.push('/login');
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!photo) return setError('Upload a headshot photo to continue.');
    if (!declarationAccepted) return setError('Please accept the declaration to continue.');

    setSubmitting(true);
    try {
      const { applicationId } = await submitMembershipApplication({
        fullName: fullName.trim(),
        occupation: occupation.trim(),
        isEmployed: Boolean(isEmployed),
        employer: employer.trim(),
        ownsBusiness: Boolean(ownsBusiness),
        businessType: businessType.trim(),
        homeAddress: homeAddress.trim(),
        officeAddress: officeAddress.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        referralSource: referralSource.trim(),
        monthlyContribution,
        wantsFountainBasket: Boolean(wantsFountainBasket),
        nextOfKinName: nextOfKinName.trim(),
        nextOfKinAddress: nextOfKinAddress.trim(),
        nextOfKinPhone: nextOfKinPhone.trim(),
        emergencyContact: emergencyContact.trim(),
        declarationAccepted,
        photo,
      });
      const { authorization_url } = await initializeApplicationPayment(applicationId);
      window.location.href = authorization_url;
    } catch (e) {
      const code = e instanceof ApiError ? (e.body as { error?: string })?.error : null;
      if (code === 'photo_too_large') setError('Photo is too large. Please use an image under 5MB.');
      else if (code === 'photo_invalid_type') setError('Photo must be a JPEG, PNG, or WEBP image.');
      else if (code === 'paystack_not_configured') {
        setError('Payments are not set up yet. Please contact the cooperative.');
      } else {
        setError('Could not submit your application. Please try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 font-sans">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <button
            type="button"
            onClick={goBack}
            className="p-2 -ml-2 text-fountain-gray-600"
            aria-label="Back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-fountain-gray-900">Member Application</h1>
            <p className="text-xs text-fountain-gray-500">Fountain Multi-Purpose Co-operative Society</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
            <div key={i} className="flex flex-col items-center flex-1 relative">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                  step >= i ? 'bg-fountain-blue text-white' : 'bg-fountain-gray-200 text-fountain-gray-500'
                }`}
              >
                {i}
              </div>
              {i < TOTAL_STEPS ? (
                <div
                  className={`absolute top-3 left-1/2 w-full h-0.5 ${
                    step > i ? 'bg-fountain-blue' : 'bg-fountain-gray-200'
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
        <p className="text-center text-xs font-medium text-fountain-gray-500 uppercase tracking-wider mb-6">
          {STEP_LABELS[step - 1]}
        </p>

        {error ? <div className="mb-4"><AlertBanner tone="warning" message={error} /></div> : null}

        <div className="bg-white rounded-2xl shadow-sm border border-fountain-gray-200 p-6 space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className={labelClass}>1. Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Chioma Okafor"
                />
              </div>
              <div>
                <label className={labelClass}>2. Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Teacher, Trader, Civil Servant"
                />
              </div>
              <div>
                <label className={labelClass}>3. Are you working? If yes, where?</label>
                <div className="flex gap-3 mb-2">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setIsEmployed(val)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        isEmployed === val
                          ? 'bg-fountain-blue text-white border-fountain-blue'
                          : 'bg-white text-fountain-gray-600 border-fountain-gray-200'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {isEmployed ? (
                  <input
                    type="text"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    className={inputClass}
                    placeholder="Where do you work?"
                  />
                ) : null}
              </div>
              <div>
                <label className={labelClass}>4. Do you own a business? If yes, what kind?</label>
                <div className="flex gap-3 mb-2">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setOwnsBusiness(val)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        ownsBusiness === val
                          ? 'bg-fountain-blue text-white border-fountain-blue'
                          : 'bg-white text-fountain-gray-600 border-fountain-gray-200'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                {ownsBusiness ? (
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className={inputClass}
                    placeholder="What kind of business?"
                  />
                ) : null}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <label className={labelClass}>5. Home address</label>
                <textarea
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>6. Office address</label>
                <textarea
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>7. Mobile number / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 0803 123 4567"
                />
              </div>
              <div>
                <label className={labelClass}>7.1 Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="This becomes your login email"
                />
                <p className="text-xs text-fountain-gray-400 mt-1">
                  You&apos;ll use this email to sign in once your membership is set up.
                </p>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div>
                <label className={labelClass}>8. How did you get to know about Fountain Coop?</label>
                <input
                  type="text"
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. A friend, social media, church"
                />
              </div>
              <div>
                <label className={labelClass}>9. How much will be your monthly contribution?</label>
                <input
                  type="number"
                  min={0}
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-fountain-gray-400 mt-1">
                  {formatNaira(Number(monthlyContribution) || 0)} per month
                </p>
              </div>
              <div>
                <label className={labelClass}>
                  10. Would you like to register for Fountain Basket? (Contribute monthly to get
                  food provisions)
                </label>
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setWantsFountainBasket(val)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        wantsFountainBasket === val
                          ? 'bg-fountain-blue text-white border-fountain-blue'
                          : 'bg-white text-fountain-gray-600 border-fountain-gray-200'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <p className="text-sm font-semibold text-fountain-gray-800">11. Your next of kin</p>
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={nextOfKinName}
                  onChange={(e) => setNextOfKinName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <textarea
                  value={nextOfKinAddress}
                  onChange={(e) => setNextOfKinAddress(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mobile number</label>
                <input
                  type="tel"
                  value={nextOfKinPhone}
                  onChange={(e) => setNextOfKinPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>12. Emergency contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className={inputClass}
                  placeholder="Name and phone number"
                />
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <div>
                <label className={labelClass}>14. Upload headshot photo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-4 bg-fountain-gray-50 border border-dashed border-fountain-gray-300 rounded-xl hover:border-fountain-blue transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-white border border-fountain-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="Headshot preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-7 h-7 text-fountain-gray-300" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-fountain-blue flex items-center gap-1.5">
                      <UploadCloudIcon className="w-4 h-4" />
                      {photo ? 'Change photo' : 'Choose a photo'}
                    </p>
                    <p className="text-xs text-fountain-gray-500 mt-0.5">JPEG, PNG, or WEBP — up to 5MB</p>
                  </div>
                </button>
              </div>

              <div>
                <p className={labelClass}>13. Declaration</p>
                <div className="bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl p-4 text-xs text-fountain-gray-600 leading-relaxed">
                  {declarationText}
                </div>
                <label className="flex items-start gap-3 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-fountain-gray-300 text-fountain-blue focus:ring-fountain-blue/20"
                  />
                  <span className="text-xs text-fountain-gray-600 font-medium">
                    I agree to the declaration above.
                  </span>
                </label>
              </div>

              <div className="bg-fountain-amber/10 border border-fountain-amber/30 rounded-xl p-3 text-xs text-amber-900 font-medium">
                Notice: Registration fee is {formatNaira(REGISTRATION_FEE)}, non-refundable. You&apos;ll
                pay securely via Paystack on the next step, then set your login password.
              </div>
            </>
          ) : null}
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={() => (step === TOTAL_STEPS ? void handleSubmit() : goNext())}
          className="w-full mt-6 py-3.5 bg-fountain-blue text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-fountain-blue/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2Icon className="w-4 h-4 animate-spin" /> Redirecting to payment…
            </>
          ) : step === TOTAL_STEPS ? (
            `Proceed to pay ${formatNaira(REGISTRATION_FEE)}`
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
