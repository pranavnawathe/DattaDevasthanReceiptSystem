// API Request Types
export interface DonorInfo {
  name: string;
  mobile?: string;
  pan?: string;
  email?: string;
  gotra?: string;
  postalAddress?: string;
}

export interface PaymentInfo {
  mode: 'CASH' | 'CHEQUE' | 'ONLINE' | 'CARD';
  reference?: string;
}

export interface CreateReceiptRequest {
  donor: DonorInfo;
  breakup: Record<string, number>;
  payment: PaymentInfo;
  date?: string;
  eligible80G?: boolean;
  sankalp?: string;
  visheshSankalp?: string;
  yajmanUpasthit?: string;
}

// API Response Types
export interface CreateReceiptResponse {
  success: boolean;
  receiptNo: string;
  donorId: string;
  total: number;
  pdfKey: string;
  createdAt: number;
  message: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

// UI State Types
export interface FormErrors {
  name?: string;
  mobile?: string;
  pan?: string;
  email?: string;
  breakup?: string;
  payment?: string;
  gotra?: string;
  postalAddress?: string;
}

// Donation Categories
export const DONATION_CATEGORIES = {
  GENERAL: 'सामान्य / General',
  ANNADAN: 'अन्नदान / Annadan',
} as const;

export type DonationCategory = keyof typeof DONATION_CATEGORIES;

// Dharmik Karyas with predefined amounts
export const DHARMIK_KARYAS = {
  EKADASHANI: { label: 'एकादशनी / Ekadashani', amount: 201 },
  LAGHURUDRA: { label: 'लघुरुद्र / Laghurudra', amount: 501 },
  ABHISHEK: { label: 'अभिषेक / Abhishek', amount: 101 },
} as const;

export type DharmikKarya = keyof typeof DHARMIK_KARYAS;
