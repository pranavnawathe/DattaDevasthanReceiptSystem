// API Request Types
export interface DonorInfo {
  name: string;
  mobile?: string;
  pan?: string;
  email?: string;
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
}

// Donation Categories
export const DONATION_CATEGORIES = {
  TEMPLE_GENERAL: 'मंदिर सामान्य / Temple General',
  EDUCATION: 'शिक्षण / Education',
  ANNADAAN: 'अन्नदान / Annadaan',
  GAUSHALA: 'गौशाळा / Gaushala',
  CONSTRUCTION: 'बांधकाम / Construction',
  FESTIVAL: 'उत्सव / Festival',
  OTHER: 'इतर / Other',
} as const;

export type DonationCategory = keyof typeof DONATION_CATEGORIES;
