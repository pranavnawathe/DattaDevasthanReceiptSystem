/**
 * Type definitions for Temple Receipt System
 * Matches the design document data model
 */

// ============================================================================
// DynamoDB Item Types
// ============================================================================

/**
 * Donation item stored in DynamoDB
 * PK: ORG#<orgId>
 * SK: RCPT#<yyyy>-<seq>
 */
export interface DonationItem {
  PK: string; // ORG#<orgId>
  SK: string; // RCPT#<yyyy>-<seq>
  GSI1PK: string; // DONOR#<donorId>
  GSI1SK: string; // DATE#<yyyy-mm-dd>#RCPT#<receiptNo>
  GSI2PK: string; // DATE#<yyyy-mm-dd>
  GSI2SK: string; // RCPT#<receiptNo>
  orgId: string;
  receiptNo: string; // e.g., "00071-2025-26"
  date: string; // ISO date: yyyy-mm-dd
  donorId: string; // e.g., "D_8b62f34a12ab"
  donor: DonorInfo;
  breakup: Record<string, number>; // purpose → amount mapping
  payment: PaymentInfo;
  eligible80G: boolean;
  total: number;
  pdfKey?: string; // S3 key for PDF receipt
  sankalp?: string; // Purpose/intention of the donation
  visheshSankalp?: string; // Additional/special purpose
  yajmanUpasthit?: string; // Whether/who the donor-performer is present
  createdAt: number; // Unix timestamp (ms)
  updatedAt?: number; // Unix timestamp (ms)
  createdBy?: string; // User ID who created
}

/**
 * Donor profile item stored in DynamoDB
 * PK: ORG#<orgId>
 * SK: DONOR#<donorId>
 */
export interface DonorItem {
  PK: string; // ORG#<orgId>
  SK: string; // DONOR#<donorId>
  donorId: string; // e.g., "D_8b62f34a12ab"
  primary: {
    name: string;
    mobile?: string; // E.164 format
    email?: string;
    pan?: string; // Masked (ABCDE****F)
  };
  ids: {
    panHash?: string; // SHA256 hash for lookups
    emailHash?: string;
    phoneE164?: string; // Normalized phone
  };
  stats: {
    lifetimeTotal: number; // Total donations amount
    lastDonationDate: string; // ISO date
    count: number; // Number of donations
  };
  address?: AddressInfo;
  gotra?: string; // Donor's gotra
  postalAddress?: string; // Flat postal address for prasad dispatch
  meta: {
    createdAt: number; // Unix timestamp (ms)
    updatedAt: number;
  };
}

/**
 * Alias item for fast lookups by phone/PAN/email
 * PK: ORG#<orgId>
 * SK: ALIAS#<type>#<value>
 */
export interface AliasItem {
  PK: string; // ORG#<orgId>
  SK: string; // ALIAS#PHONE#<e164> | ALIAS#PAN#<hash> | ALIAS#EMAIL#<hash>
  donorId: string; // Points to donor
  createdAt: number;
}

/**
 * Receipt counter item — sequential counter per financial year
 * PK: ORG#<orgId>
 * SK: COUNTER#RECEIPT#<year>
 */
export interface CounterItem {
  PK: string; // ORG#<orgId>
  SK: string; // COUNTER#RECEIPT#<year>
  year: number;
  currentSeq: number; // Current sequence number
  updatedAt: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request to create a new donation receipt
 */
export interface CreateReceiptRequest {
  donor: DonorInfo;
  breakup: Record<string, number>; // purpose → amount
  payment: PaymentInfo;
  eligible80G?: boolean; // Default: true
  date?: string; // Optional override (default: today)
  sankalp?: string;
  visheshSankalp?: string;
  yajmanUpasthit?: string;
}

/**
 * Response after creating a receipt
 */
export interface CreateReceiptResponse {
  success: boolean;
  receiptNo: string;
  donorId: string;
  total: number;
  pdfKey?: string;
  pdfUrl?: string; // Presigned URL
  createdAt: number;
}

/**
 * Donor lookup response
 */
export interface DonorLookupResponse {
  found: boolean;
  donor?: DonorItem;
  recentDonations?: DonationItem[];
}

// ============================================================================
// Nested Object Types
// ============================================================================

/**
 * Donor information
 */
export interface DonorInfo {
  name: string; // Required (Marathi or English)
  mobile?: string; // Phone number (will be normalized to E.164)
  email?: string;
  pan?: string; // 10-char PAN (ABCDE1234F)
  address?: AddressInfo;
  gotra?: string; // Donor's gotra (required for Dharmik donations)
  postalAddress?: string; // Flat postal address string for prasad dispatch (required for Dharmik donations)
}

/**
 * Address information
 */
export interface AddressInfo {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string; // Default: IN
}

/**
 * Payment information
 */
export interface PaymentInfo {
  mode: PaymentMode;
  ref?: string; // Reference number (UPI ID, cheque no, etc.)
  bank?: string; // Bank name for cheque/NEFT
  date?: string; // Payment date (if different from donation date)
}

/**
 * Payment modes
 */
export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  CHEQUE = 'CHEQUE',
  NEFT = 'NEFT',
  RTGS = 'RTGS',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
}

/**
 * Donation purposes / categories
 * These are configurable per organization
 */
export enum DonationPurpose {
  UTSAV_DANAGI = 'UTSAV_DANAGI', // Festival contribution
  GENERAL = 'GENERAL', // General donation
  PRASAD = 'PRASAD', // Offering
  POOJA = 'POOJA', // Worship service
  MAINTENANCE = 'MAINTENANCE', // Building maintenance
  SEVA = 'SEVA', // Service
  EDUCATION = 'EDUCATION', // Educational programs
  ANNADAAN = 'ANNADAAN', // Food donation
  OTHER = 'OTHER',
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number; // Default: 50, Max: 100
  lastEvaluatedKey?: string; // Base64 encoded
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string; // Base64 encoded lastEvaluatedKey
  count: number;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  startDate: string; // ISO date: yyyy-mm-dd
  endDate: string; // ISO date: yyyy-mm-dd
}

/**
 * List receipts request parameters
 */
export interface ListReceiptsRequest {
  date?: string; // Single date (YYYY-MM-DD)
  startDate?: string; // Range start date
  endDate?: string; // Range end date
  receiptNo?: string; // Exact receipt number lookup
  donorId?: string; // Filter by donor ID
  includeVoided?: boolean; // Include voided receipts (default: false)
  limit?: number; // Pagination limit (default: 50, max: 100)
  nextToken?: string; // Pagination token (base64 encoded)
}

/**
 * Donor search request parameters
 */
export interface DonorSearchRequest {
  query: string; // Search query (phone, PAN, email, or name)
  type?: 'phone' | 'pan' | 'email' | 'name'; // Identifier type (auto-detected if not provided)
}

/**
 * Donor search response
 */
export interface DonorSearchResponse {
  found: boolean;
  donor?: DonorItem;
  recentReceipts?: DonationItem[]; // Last 5 receipts
}

/**
 * Donor resolution result
 */
export interface DonorResolution {
  donorId: string;
  isNew: boolean;
  existingProfile?: DonorItem;
}

/**
 * Export request parameters
 */
export interface ExportRequest {
  format: 'csv' | 'excel'; // Export format
  startDate: string; // Start date (yyyy-mm-dd)
  endDate: string; // End date (yyyy-mm-dd)
  includeVoided?: boolean; // Include voided receipts (default: false)
}

/**
 * Export response
 */
export interface ExportResponse {
  success: boolean;
  format: 'csv' | 'excel';
  fileName: string;
  content: string; // CSV content or base64 for Excel
  recordCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

// ============================================================================
// Key Builder Types (for consistency)
// ============================================================================

export interface KeyPatterns {
  PK: {
    org: (orgId: string) => string;
  };
  SK: {
    receipt: (receiptNo: string) => string;
    donor: (donorId: string) => string;
    aliasPhone: (phone: string) => string;
    aliasPAN: (panHash: string) => string;
    aliasEmail: (emailHash: string) => string;
    counter: (year: number) => string;
  };
  GSI1: {
    donor: (donorId: string) => string;
    donorReceipt: (date: string, receiptNo: string) => string;
  };
  GSI2: {
    date: (date: string) => string;
    receipt: (receiptNo: string) => string;
  };
}

/**
 * Constants for key patterns
 */
export const Keys: KeyPatterns = {
  PK: {
    org: (orgId: string) => `ORG#${orgId}`,
  },
  SK: {
    receipt: (receiptNo: string) => `RCPT#${receiptNo}`,
    donor: (donorId: string) => `DONOR#${donorId}`,
    aliasPhone: (phone: string) => `ALIAS#PHONE#${phone}`,
    aliasPAN: (panHash: string) => `ALIAS#PAN#${panHash}`,
    aliasEmail: (emailHash: string) => `ALIAS#EMAIL#${emailHash}`,
    counter: (year: number) => `COUNTER#RECEIPT#${year}`,
  },
  GSI1: {
    donor: (donorId: string) => `DONOR#${donorId}`,
    donorReceipt: (date: string, receiptNo: string) => `DATE#${date}#RCPT#${receiptNo}`,
  },
  GSI2: {
    date: (date: string) => `DATE#${date}`,
    receipt: (receiptNo: string) => `RCPT#${receiptNo}`,
  },
};
