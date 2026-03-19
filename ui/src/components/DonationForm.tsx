import { useState } from 'react';
import type { CreateReceiptRequest, CreateReceiptResponse, FormErrors, DharmikKarya } from '../types';
import { DONATION_CATEGORIES, DHARMIK_KARYAS } from '../types';
import { validateDonorInfo, validateBreakup, validatePayment, validateDharmikInfo } from '../utils/validators';
import { formatCurrency, getTodayIST } from '../utils/formatters';
import { api } from '../services/api';

interface DonationFormProps {
  onSuccess: (receipt: CreateReceiptResponse) => void;
}

export function DonationForm({ onSuccess }: DonationFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pan, setPan] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(getTodayIST());
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CHEQUE' | 'ONLINE' | 'CARD'>('CASH');
  const [paymentRef, setPaymentRef] = useState('');

  // Donation breakup state
  const [breakup, setBreakup] = useState<Record<string, number>>({});

  // Dharmik state
  const [dharmikEnabled, setDharmikEnabled] = useState(false);
  const [dharmikKarya, setDharmikKarya] = useState<DharmikKarya>('EKADASHANI');
  const [gotra, setGotra] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [sankalp, setSankalp] = useState('');
  const [visheshSankalp, setVisheshSankalp] = useState('');
  const [yajmanUpasthit, setYajmanUpasthit] = useState('');

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleBreakupChange = (category: string, value: string) => {
    if (value === '' || value === null || value === undefined) {
      setBreakup(prev => {
        const updated = { ...prev };
        delete updated[category];
        return updated;
      });
      return;
    }

    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      setBreakup(prev => {
        const updated = { ...prev };
        delete updated[category];
        return updated;
      });
      return;
    }

    setBreakup(prev => ({ ...prev, [category]: amount }));
  };

  const handleDharmikToggle = (checked: boolean) => {
    setDharmikEnabled(checked);
    if (checked) {
      const karya = dharmikKarya;
      setBreakup(prev => ({ ...prev, [`DHARMIK_${karya}`]: DHARMIK_KARYAS[karya].amount }));
    } else {
      setBreakup(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(k => { if (k.startsWith('DHARMIK_')) delete updated[k]; });
        return updated;
      });
    }
  };

  const handleDharmikKaryaChange = (newKarya: DharmikKarya) => {
    const oldKey = `DHARMIK_${dharmikKarya}`;
    const newKey = `DHARMIK_${newKarya}`;
    setBreakup(prev => {
      const updated = { ...prev };
      delete updated[oldKey];
      updated[newKey] = DHARMIK_KARYAS[newKarya].amount;
      return updated;
    });
    setDharmikKarya(newKarya);
  };

  const calculateTotal = (): number => {
    return Object.values(breakup).reduce((sum, val) => sum + val, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const donorErrors = validateDonorInfo({ name, mobile, pan, email });
    const breakupError = validateBreakup(breakup);
    const paymentError = validatePayment({ mode: paymentMode, reference: paymentRef });
    const dharmikErrors = dharmikEnabled ? validateDharmikInfo(gotra, postalAddress) : {};

    const allErrors: FormErrors = {
      ...donorErrors,
      ...(breakupError ? { breakup: breakupError } : {}),
      ...(paymentError ? { payment: paymentError } : {}),
      ...dharmikErrors,
    };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const request: CreateReceiptRequest = {
        donor: {
          name: name.trim(),
          ...(mobile && { mobile }),
          ...(pan && { pan: pan.toUpperCase() }),
          ...(email && { email }),
          ...(dharmikEnabled && gotra && { gotra: gotra.trim() }),
          ...(dharmikEnabled && postalAddress && { postalAddress: postalAddress.trim() }),
        },
        breakup,
        payment: {
          mode: paymentMode,
          ...(paymentRef && { reference: paymentRef }),
        },
        date,
        eligible80G: false,
        ...(dharmikEnabled && sankalp && { sankalp: sankalp.trim() }),
        ...(dharmikEnabled && visheshSankalp && { visheshSankalp: visheshSankalp.trim() }),
        ...(dharmikEnabled && yajmanUpasthit && { yajmanUpasthit: yajmanUpasthit.trim() }),
      };

      const response = await api.createReceipt(request);
      onSuccess(response);
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setMobile('');
    setPan('');
    setEmail('');
    setDate(getTodayIST());
    setPaymentMode('CASH');
    setPaymentRef('');
    setBreakup({});
    setDharmikEnabled(false);
    setDharmikKarya('EKADASHANI');
    setGotra('');
    setPostalAddress('');
    setSankalp('');
    setVisheshSankalp('');
    setYajmanUpasthit('');
    setErrors({});
    setSubmitError(null);
  };

  const total = calculateTotal();
  const isFormValid = name.trim().length >= 2 && total > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Donor Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-secondary mb-4 border-b pb-2">
          <span className="marathi">दात्याची माहिती</span> / Donor Information
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="marathi">नाव</span> / Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.name ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="राम शिंदे / Ram Shinde"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="marathi">मोबाईल</span> / Mobile Number
            </label>
            <input
              type="tel"
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.mobile ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="9876543210"
              maxLength={10}
            />
            {errors.mobile && <p className="text-error text-xs mt-1">{errors.mobile}</p>}
          </div>

          {/* PAN */}
          <div>
            <label htmlFor="pan" className="block text-sm font-medium text-gray-700 mb-1">
              PAN Card
            </label>
            <input
              type="text"
              id="pan"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.pan ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            {errors.pan && <p className="text-error text-xs mt-1">{errors.pan}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="marathi">ई-मेल</span> / Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.email ? 'border-error' : 'border-gray-300'
              }`}
              placeholder="donor@example.com"
            />
            {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Donation Details Section */}
      <div>
        <h3 className="text-lg font-semibold text-secondary mb-4 border-b pb-2">
          <span className="marathi">देणगी तपशील</span> / Donation Details
        </h3>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="marathi">दिनांक</span> / Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              max={getTodayIST()}
            />
          </div>

          {/* Donation Breakup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="marathi">देणगी विभाजन</span> / Donation Breakup <span className="text-error">*</span>
            </label>
            <div className="space-y-2">
              {/* General and Annadan */}
              {(Object.keys(DONATION_CATEGORIES) as Array<keyof typeof DONATION_CATEGORIES>).map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={breakup[category] || ''}
                    onChange={(e) => handleBreakupChange(category, e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0"
                  />
                  <label className="text-sm text-gray-700">{DONATION_CATEGORIES[category]}</label>
                </div>
              ))}

              {/* Dharmik opt-in */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dharmikEnabled"
                    checked={dharmikEnabled}
                    onChange={(e) => handleDharmikToggle(e.target.checked)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="dharmikEnabled" className="text-sm font-medium text-gray-700">
                    <span className="marathi">धार्मिक</span> / Dharmik
                  </label>
                </div>

                {dharmikEnabled && (
                  <div className="ml-6 space-y-3 border-l-2 border-primary border-opacity-30 pl-4">
                    {/* Karya selector + fixed amount */}
                    <div className="flex items-center gap-3">
                      <select
                        value={dharmikKarya}
                        onChange={(e) => handleDharmikKaryaChange(e.target.value as DharmikKarya)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      >
                        {(Object.keys(DHARMIK_KARYAS) as DharmikKarya[]).map((karya) => (
                          <option key={karya} value={karya}>
                            {DHARMIK_KARYAS[karya].label}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm font-semibold text-secondary">
                        ₹ {DHARMIK_KARYAS[dharmikKarya].amount}
                      </span>
                    </div>

                    {/* Gotra */}
                    <div>
                      <label htmlFor="gotra" className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="marathi">गोत्र</span> / Gotra <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        id="gotra"
                        value={gotra}
                        onChange={(e) => setGotra(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors.gotra ? 'border-error' : 'border-gray-300'
                        }`}
                        placeholder="कश्यप / Kashyap"
                      />
                      {errors.gotra && <p className="text-error text-xs mt-1">{errors.gotra}</p>}
                    </div>

                    {/* Postal Address */}
                    <div>
                      <label htmlFor="postalAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="marathi">पत्ता</span> / Postal Address <span className="text-error">*</span>
                      </label>
                      <textarea
                        id="postalAddress"
                        value={postalAddress}
                        onChange={(e) => setPostalAddress(e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
                          errors.postalAddress ? 'border-error' : 'border-gray-300'
                        }`}
                        placeholder="123, मेन रोड, कोंडगांव, रत्नागिरी - 415640"
                      />
                      {errors.postalAddress && <p className="text-error text-xs mt-1">{errors.postalAddress}</p>}
                    </div>

                    {/* Sankalp */}
                    <div>
                      <label htmlFor="sankalp" className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="marathi">सन्कल्प</span> / Sankalp
                      </label>
                      <input
                        type="text"
                        id="sankalp"
                        value={sankalp}
                        onChange={(e) => setSankalp(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="गुरुसेवा"
                      />
                    </div>

                    {/* Vishesh Sankalp */}
                    <div>
                      <label htmlFor="visheshSankalp" className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="marathi">विशेष सन्कल्प</span> / Vishesh Sankalp
                      </label>
                      <input
                        type="text"
                        id="visheshSankalp"
                        value={visheshSankalp}
                        onChange={(e) => setVisheshSankalp(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder=""
                      />
                    </div>

                    {/* Yajman Upasthit */}
                    <div>
                      <label htmlFor="yajmanUpasthit" className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="marathi">यजमान उपस्थित</span> / Yajman Upasthit
                      </label>
                      <input
                        type="text"
                        id="yajmanUpasthit"
                        value={yajmanUpasthit}
                        onChange={(e) => setYajmanUpasthit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder=""
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {errors.breakup && <p className="text-error text-xs mt-1">{errors.breakup}</p>}
          </div>

          {/* Total Display */}
          <div className="bg-accent bg-opacity-10 border-l-4 border-accent p-4 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">
                <span className="marathi">एकूण</span> / Total:
              </span>
              <span className="text-2xl font-bold text-secondary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-secondary mb-4 border-b pb-2">
          <span className="marathi">पेमेंट माहिती</span> / Payment Information
        </h3>

        <div className="space-y-4">
          {/* Payment Mode */}
          <div>
            <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="marathi">पेमेंट प्रकार</span> / Payment Mode <span className="text-error">*</span>
            </label>
            <select
              id="paymentMode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="CASH">रोख / Cash</option>
              <option value="CHEQUE">चेक / Cheque</option>
              <option value="ONLINE">ऑनलाइन / Online</option>
              <option value="CARD">कार्ड / Card</option>
            </select>
          </div>

          {/* Payment Reference (conditional) */}
          {(paymentMode === 'CHEQUE' || paymentMode === 'ONLINE') && (
            <div>
              <label htmlFor="paymentRef" className="block text-sm font-medium text-gray-700 mb-1">
                {paymentMode === 'CHEQUE' ? 'चेक क्रमांक / Cheque Number' : 'व्यवहार क्रमांक / Transaction ID'}
              </label>
              <input
                type="text"
                id="paymentRef"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder={paymentMode === 'CHEQUE' ? '123456' : 'TXN123456789'}
              />
            </div>
          )}
          {errors.payment && <p className="text-error text-xs mt-1">{errors.payment}</p>}
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-error bg-opacity-10 border-l-4 border-error p-4 rounded">
          <p className="text-error text-sm font-medium">{submitError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="flex-1 bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="marathi">प्रक्रिया सुरू आहे...</span> Processing...
            </span>
          ) : (
            <>
              <span className="marathi">पावती तयार करा</span> / Create Receipt
            </>
          )}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="marathi">रीसेट</span> / Reset
        </button>
      </div>
    </form>
  );
}
