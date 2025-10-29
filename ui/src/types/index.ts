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
  flexibleMode?: boolean;  // Allow year mismatch (admin override)
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

// Range Management Types
export type RangeStatus = 'draft' | 'active' | 'locked' | 'exhausted' | 'archived';

export interface RangeItem {
  PK: string;
  SK: string;
  type: 'range';
  rangeId: string;
  alias: string;
  year: number;
  start: number;
  end: number;
  next: number;
  status: RangeStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  lockedBy?: string;
  lockedAt?: string;
  remaining?: number;
}

export interface CreateRangeRequest {
  alias: string;
  year: number;
  start: number;
  end: number;
  suffix?: string;
  createdBy: string;
}

export interface UpdateRangeStatusRequest {
  action: 'activate' | 'lock' | 'unlock' | 'archive';
  userId: string;
}

export interface ListRangesResponse {
  success: boolean;
  ranges: RangeItem[];
  count: number;
}

export interface GetRangeResponse {
  success: boolean;
  range: RangeItem;
}

export interface CreateRangeResponse {
  success: boolean;
  range: RangeItem;
  message: string;
}

export interface UpdateRangeStatusResponse {
  success: boolean;
  range: RangeItem;
  message: string;
}
