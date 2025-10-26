# Implementation Plan - Temple Donation & E-Receipt System

## Current State Assessment

### Completed
- ✅ Basic CDK infrastructure (FoundationStack + ApiStack)
- ✅ DynamoDB table with GSI1 and GSI2 (but keys don't match design spec)
- ✅ S3 buckets for receipts and exports
- ✅ Stub Lambda handler with /health and /receipts endpoints
- ✅ Basic API Gateway HTTP API setup

### Gaps Identified
1. **DynamoDB schema mismatch**: GSI keys use `donorId`/`date`/`receiptNo` instead of composite keys like `GSI1PK`/`GSI1SK`
2. **No donor/alias logic**: Missing donor resolution and alias management
3. **No shared types/utilities**: No common code structure
4. **No receipt numbering**: Auto-incrementing sequential receipt numbers not implemented
5. **No actual data operations**: Stub handler doesn't write to DynamoDB or S3

---

## Phase 1: Foundation & Core Data Model (MVP - Week 1-2)

### 1.1 Fix DynamoDB Schema
**Priority: CRITICAL**

- [ ] Update `lib/foundation-stack.ts` GSI definitions to match design spec
  - GSI1: `GSI1PK` (STRING) / `GSI1SK` (STRING)
  - GSI2: `GSI2PK` (STRING) / `GSI2SK` (STRING)
- [ ] Remove old GSI definitions using `donorId`, `date`, `receiptNo` as direct attributes

**Files to modify:**
- `TempleReceiptSystemCDK/lib/foundation-stack.ts`

---

### 1.2 Create Shared Type Definitions
**Priority: HIGH**

- [ ] Create `lambda/common/types.ts` with interfaces:
  ```typescript
  - DonationItem (matches design doc)
  - DonorItem
  - AliasItem
  - CreateReceiptRequest
  - CreateReceiptResponse
  - DonorInfo
  - PaymentInfo
  - DonationBreakup
  ```

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/types.ts`

**Example structure:**
```typescript
export interface DonationItem {
  PK: string;                    // ORG#<orgId>
  SK: string;                    // RCPT#<yyyy>-<seq>
  GSI1PK: string;                // DONOR#<donorId>
  GSI1SK: string;                // DATE#<yyyy-mm-dd>#RCPT#<receiptNo>
  GSI2PK: string;                // DATE#<yyyy-mm-dd>
  GSI2SK: string;                // RCPT#<receiptNo>
  orgId: string;
  receiptNo: string;
  date: string;
  donorId: string;
  donor: DonorInfo;
  breakup: Record<string, number>;
  payment: PaymentInfo;
  eligible80G: boolean;
  total: number;
  pdfKey?: string;
  createdAt: number;
}
```

---

### 1.3 Utility Functions Module
**Priority: HIGH**

- [ ] Create `lambda/common/utils/id-generator.ts`
  - `generateDonorId(pan?, phone?, email?, orgId)` - stable hash-based ID
  - `generateReceiptNo(year, sequence)` - format: `2025-00071`

- [ ] Create `lambda/common/utils/normalizers.ts`
  - `normalizePhone(phone)` - convert to E.164
  - `normalizeEmail(email)` - lowercase trim
  - `normalizePAN(pan)` - uppercase trim

- [ ] Create `lambda/common/utils/crypto.ts`
  - `hashPAN(pan)` - SHA256 hash with prefix
  - `maskPAN(pan)` - show first 5 + last 1 char
  - `hashIdentifier(value, type)` - generic hash function

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/utils/id-generator.ts`
- `TempleReceiptSystemCDK/lambda/common/utils/normalizers.ts`
- `TempleReceiptSystemCDK/lambda/common/utils/crypto.ts`

---

### 1.4 DynamoDB Helper Module
**Priority: HIGH**

- [ ] Create `lambda/common/db/dynamo-client.ts`
  - Initialize DynamoDB DocumentClient
  - Export configured client

- [ ] Create `lambda/common/db/queries.ts`
  - `getAliasByPhone(orgId, phone)` → donorId
  - `getAliasByPAN(orgId, panHash)` → donorId
  - `getAliasByEmail(orgId, emailHash)` → donorId
  - `getDonorProfile(orgId, donorId)` → DonorItem
  - `getDonationsByDonor(donorId, limit?)` → DonationItem[]
  - `getDonationsByDateRange(orgId, startDate, endDate)` → DonationItem[]

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/db/dynamo-client.ts`
- `TempleReceiptSystemCDK/lambda/common/db/queries.ts`

---

### 1.5 Receipt Counter Management
**Priority: HIGH**

- [ ] Create `lambda/common/db/counter.ts`
  - `getNextReceiptNumber(orgId, year)` - atomic increment using DynamoDB
  - Store counter in table: `PK=ORG#<orgId>`, `SK=COUNTER#RECEIPT#<year>`

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/db/counter.ts`

**Implementation notes:**
- Use DynamoDB UpdateItem with atomic increment
- Initialize counter to 1 if not exists
- Return formatted receipt number (e.g., `2025-00071`)

---

## Phase 2: Core Donation Creation Logic (Week 2-3)

### 2.1 Donor Resolution Service
**Priority: HIGH**

- [ ] Create `lambda/common/services/donor-resolver.ts`
  - `resolveDonor(orgId, donorInfo)` → donorId (new or existing)
  - Check aliases (phone → PAN → email priority)
  - Handle new donor creation
  - Return donorId + isNew flag

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/services/donor-resolver.ts`

**Logic flow:**
1. Normalize all identifiers (phone, PAN, email)
2. Check phone alias first (most reliable)
3. If not found, check PAN alias
4. If not found, check email alias
5. If none found, generate new donorId
6. Return `{ donorId, isNew: boolean }`

---

### 2.2 Donation Service
**Priority: HIGH**

- [ ] Create `lambda/common/services/donation-service.ts`
  - `createDonation(orgId, payload)` - orchestrate full flow
  - Validate input data
  - Resolve/create donor
  - Get next receipt number
  - Write donation item with GSI1/GSI2 keys
  - Upsert donor profile (update stats)
  - Create alias items (transactional if possible)

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/services/donation-service.ts`

**Transaction items:**
1. Put donation item
2. Update/Put donor profile (increment stats)
3. Put alias items (phone, PAN, email if new donor)
4. Increment receipt counter

---

### 2.3 Update POST /receipts Handler
**Priority: HIGH**

- [ ] Refactor `lambda/receipts/index.ts`
  - Replace stub with real `createDonation()` call
  - Add proper error handling
  - Validate required fields
  - Return structured response with receiptNo, donorId, pdfKey (stub)

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/receipts/index.ts`

---

### 2.4 S3 Receipt Artifact Creation
**Priority: MEDIUM**

- [ ] Create `lambda/common/services/receipt-artifact.ts`
  - `createTextReceipt(donation)` → text format
  - `uploadReceiptToS3(receiptNo, year, content)` → s3Key
  - Store at `receipts/<year>/<receiptNo>.txt` (PDF in Phase 3)

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/services/receipt-artifact.ts`

---

## Phase 3: Search & Retrieval Endpoints (Week 3-4)

### 3.1 Donor Lookup Endpoint
**Priority: MEDIUM**

- [ ] Implement `GET /donors/lookup?phone=X` or `?pan=X` or `?email=X`
  - Query alias table
  - Return donor profile + stats
  - Add to API Gateway routes

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/receipts/index.ts`
- `TempleReceiptSystemCDK/lib/api-stack.ts`

---

### 3.2 Donor Receipts List
**Priority: MEDIUM**

- [ ] Implement `GET /donors/{donorId}/receipts`
  - Query GSI1 by donorId
  - Return paginated list of donations
  - Add to API Gateway routes

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/receipts/index.ts`
- `TempleReceiptSystemCDK/lib/api-stack.ts`

---

### 3.3 Receipt Retrieval
**Priority: MEDIUM**

- [ ] Implement `GET /receipts/{receiptNo}`
  - Query by PK/SK: `ORG#<orgId>` / `RCPT#<receiptNo>`
  - Return full donation details
  - Generate signed S3 URL for PDF download

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/receipts/index.ts`
- `TempleReceiptSystemCDK/lib/api-stack.ts`

---

### 3.4 Date Range Query
**Priority: MEDIUM**

- [ ] Implement `GET /receipts?startDate=X&endDate=Y`
  - Query GSI2 by date range
  - Support pagination
  - Add to API Gateway routes

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/receipts/index.ts`
- `TempleReceiptSystemCDK/lib/api-stack.ts`

---

## Phase 4: Export & Reporting (Week 4-5)

### 4.1 CSV Export Service
**Priority: MEDIUM**

- [ ] Create `lambda/common/services/export-service.ts`
  - `generateCSV(donations)` - Tally-compatible format
  - Include: Date, Receipt No, Donor Name, PAN, Amount, Purpose, Payment Mode

- [ ] Implement `GET /export?startDate=X&endDate=Y&format=csv`
  - Query donations by date range
  - Generate CSV
  - Upload to S3 exports bucket
  - Return signed download URL

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/services/export-service.ts`

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/receipts/index.ts`
- `TempleReceiptSystemCDK/lib/api-stack.ts`

**CSV Format (Tally-compatible):**
```csv
Date,Receipt No,Donor Name,PAN,Mobile,Amount,Purpose,Payment Mode,Reference
2025-10-18,2025-00071,राम शिंदे,ABCDE****F,+9198XXXXXXXX,500,UTSAV_DANAGI,UPI,UPI-123
```

---

### 4.2 Excel Export (Optional)
**Priority: LOW**

- [ ] Add XLSX generation using `exceljs` library
- [ ] Support `format=xlsx` parameter

**Dependencies to add:**
- `exceljs` npm package

---

## Phase 5: PDF Receipt Generation (Week 5-6)

### 5.1 PDF Template Engine
**Priority: HIGH**

- [ ] Choose PDF library (puppeteer-core + chrome-aws-lambda OR pdfkit)
- [ ] Create bilingual HTML template with:
  - Trust letterhead (org name, PAN, 80G registration)
  - Donor details (Marathi + English)
  - Donation breakup table
  - Legal disclaimer & signature section

- [ ] Create `lambda/common/services/pdf-generator.ts`
  - `generateReceiptPDF(donation, donorProfile)` → Buffer

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/services/pdf-generator.ts`
- `TempleReceiptSystemCDK/lambda/common/templates/receipt-template.html`

**Dependencies to add:**
- Option 1: `@sparticuz/chromium` + `puppeteer-core` (for HTML → PDF)
- Option 2: `pdfkit` (programmatic PDF generation)

**Recommendation:** Use pdfkit for smaller bundle size and faster cold starts

---

### 5.2 Update Receipt Creation Flow
**Priority: HIGH**

- [ ] Replace text artifact with PDF generation
- [ ] Update S3 storage to `.pdf` extension
- [ ] Update response to include presigned PDF URL

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/common/services/receipt-artifact.ts`
- `TempleReceiptSystemCDK/lambda/common/services/donation-service.ts`

---

## Phase 6: Security & Validation (Week 6-7)

### 6.1 Input Validation
**Priority: HIGH**

- [ ] Install validation library (Zod or Joi)
- [ ] Create schemas for all request payloads
- [ ] Add middleware for validation in Lambda handler

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/validation/schemas.ts`

**Dependencies to add:**
- `zod` npm package (recommended for TypeScript)

**Example schema:**
```typescript
import { z } from 'zod';

export const CreateReceiptSchema = z.object({
  donor: z.object({
    name: z.string().min(1),
    mobile: z.string().regex(/^\+91\d{10}$/),
    pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/).optional(),
    email: z.string().email().optional(),
  }),
  breakup: z.record(z.number().positive()),
  payment: z.object({
    mode: z.enum(['CASH', 'UPI', 'CHEQUE', 'NEFT', 'CARD']),
    ref: z.string().optional(),
  }),
  eligible80G: z.boolean().default(true),
});
```

---

### 6.2 PII Protection Audit
**Priority: HIGH**

- [ ] Ensure PAN is never logged
- [ ] Mask sensitive data in CloudWatch logs
- [ ] Add request/response sanitization

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/utils/logger.ts`

**Implementation:**
- Create custom logger that auto-masks PAN, email, phone
- Replace all `console.log` with custom logger

---

### 6.3 Organization Context
**Priority: HIGH**

- [ ] Add orgId extraction (from JWT claims or header)
- [ ] Currently hardcoded to `DATTA-SAKHARAPA`
- [ ] Prepare for multi-org support

**Files to modify:**
- `TempleReceiptSystemCDK/lambda/common/utils/context.ts` (create)
- All service files to accept `orgId` parameter

---

## Phase 7: Authentication & Authorization (Week 7-8)

### 7.1 Cognito Setup (Future)
**Priority: LOW (defer to Phase 7+)**

- [ ] Create AuthStack with Cognito User Pool
- [ ] Define user groups (Committee, Treasurer, Auditor)
- [ ] Configure JWT authorizer for API Gateway

**Files to create:**
- `TempleReceiptSystemCDK/lib/auth-stack.ts`

**Stack includes:**
- Cognito User Pool
- User Pool Client
- Identity Pool (optional)
- User groups with IAM roles

---

### 7.2 Role-Based Access Control
**Priority: LOW**

- [ ] Implement permission checks in Lambda
- [ ] Limit export/search to Treasurer role
- [ ] Limit PII visibility

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/auth/authorizer.ts`

---

## Phase 8: Email & Notifications (Week 8+)

### 8.1 SES Setup
**Priority: LOW**

- [ ] Verify sender email domain
- [ ] Create email templates (Marathi + English)
- [ ] Implement `sendReceiptEmail(donorEmail, pdfBuffer)`

**Files to create:**
- `TempleReceiptSystemCDK/lambda/common/services/email-service.ts`
- `TempleReceiptSystemCDK/lambda/common/templates/email-template.html`

**CDK changes:**
- Grant Lambda SES send permissions
- Add SES verified sender to environment variables

---

### 8.2 WhatsApp Integration (Future)
**Priority: LOW**

- [ ] Research WhatsApp Business API
- [ ] Implement receipt sharing via WhatsApp

**Notes:**
- Requires WhatsApp Business account
- Options: Twilio, MessageBird, or official WhatsApp Business API

---

## Technical Debt & Improvements

### Testing Strategy

- [ ] Unit tests for utility functions (crypto, normalizers, ID generation)
- [ ] Integration tests for DynamoDB operations
- [ ] End-to-end API tests
- [ ] Load testing for peak festival days

**Tools:**
- Jest for unit/integration tests
- Artillery or k6 for load testing

---

### Monitoring & Observability

- [ ] Add structured logging with correlation IDs
- [ ] CloudWatch dashboard for key metrics
- [ ] Alarms for Lambda errors, DynamoDB throttling
- [ ] X-Ray tracing for performance insights

**Files to create:**
- `TempleReceiptSystemCDK/lib/monitoring-stack.ts` (optional)

**Key metrics to track:**
- Receipt creation rate
- Lambda duration and errors
- DynamoDB read/write capacity
- S3 upload success rate

---

### Documentation

- [ ] API documentation (OpenAPI spec)
- [ ] Deployment guide
- [ ] Developer setup guide
- [ ] Data retention & backup policy

**Files to create:**
- `TempleReceiptSystem/API_DOCS.md`
- `TempleReceiptSystem/DEPLOYMENT.md`
- `TempleReceiptSystem/DEVELOPER_GUIDE.md`

---

## Immediate Next Steps (This Week)

### Start with Phase 1:

1. **Fix DynamoDB GSI schema** (`foundation-stack.ts`) ✅ CRITICAL
2. **Create `lambda/common/` directory structure**
3. **Implement type definitions** (`types.ts`)
4. **Build utility functions** (normalizers, crypto, ID generation)
5. **Set up DynamoDB client and basic queries**
6. **Implement receipt counter logic**

**Target:** Complete Phase 1 + start Phase 2 by end of Week 2

---

## Dependencies & Package Requirements

### CDK Project Dependencies (Already installed)
```json
{
  "aws-cdk-lib": "^2.130.0",
  "constructs": "^10.0.0",
  "@aws-sdk/client-dynamodb": "^3.913.0",
  "@aws-sdk/client-s3": "^3.913.0",
  "@aws-sdk/lib-dynamodb": "^3.913.0"
}
```

### Lambda Dependencies (to be added)
```json
{
  "zod": "^3.22.0",           // Input validation
  "pdfkit": "^0.14.0",        // PDF generation (Phase 5)
  "@types/pdfkit": "^0.13.0"
}
```

### Optional (Future Phases)
```json
{
  "exceljs": "^4.4.0",        // Excel export
  "nodemailer": "^6.9.0"      // Email (or use AWS SDK SES directly)
}
```

---

## Risk Mitigation

### Data Migration Risk
- **Issue:** Changing GSI schema requires table recreation
- **Mitigation:** Currently in development, no production data. Deploy fresh stack.
- **Future:** Use DynamoDB export/import or custom migration scripts

### PAN Security
- **Issue:** Storing PAN requires compliance with data protection laws
- **Mitigation:** Hash PAN for lookups, mask in responses, never log raw PAN

### Receipt Number Uniqueness
- **Issue:** Concurrent requests might generate duplicate receipt numbers
- **Mitigation:** Use DynamoDB atomic counter with conditional updates

### Lambda Cold Starts
- **Issue:** PDF generation increases bundle size and cold start time
- **Mitigation:**
  - Use pdfkit instead of Puppeteer
  - Consider provisioned concurrency for production
  - Optimize bundle size (exclude dev dependencies)

---

## Success Criteria

### Phase 1 Complete When:
- ✅ DynamoDB schema matches design document
- ✅ All utility functions have unit tests
- ✅ Receipt counter generates unique sequential numbers
- ✅ Type definitions cover all data models

### Phase 2 Complete When:
- ✅ POST /receipts creates donation in DynamoDB
- ✅ Donor resolution works (existing + new donors)
- ✅ Alias items are created/updated correctly
- ✅ Text receipt artifact stored in S3

### MVP Complete When:
- ✅ Full donation creation flow works end-to-end
- ✅ Basic search/retrieval endpoints functional
- ✅ CSV export works for Tally integration
- ✅ Input validation prevents bad data
- ✅ API returns proper error messages

---

## Rollout Plan

1. **Development** (Weeks 1-6): Build core features
2. **Testing** (Weeks 6-7): Manual + automated testing
3. **Staging Deployment** (Week 7): Deploy to test AWS account
4. **User Acceptance Testing** (Week 8): Committee members test with real scenarios
5. **Production Deployment** (Week 9): Deploy to production AWS account
6. **Training** (Week 9-10): Train committee members on system usage
7. **Go Live** (Week 10+): Start using for actual donations

---

## Questions & Decisions Needed

1. **PDF Library Choice:** pdfkit (smaller) vs Puppeteer (HTML templates)?
2. **Multi-org Support:** Build now or defer to future phase?
3. **Authentication:** Cognito vs API keys vs custom solution?
4. **Email Provider:** SES vs third-party (SendGrid, Postmark)?
5. **Testing Scope:** How much test coverage is required before production?
6. **Backup Strategy:** DynamoDB PITR sufficient or need custom backups?
7. **Deployment Strategy:** Blue-green deployment or simple update?

---

*Last Updated: 2025-10-18*
*Author: Claude Code*
*Version: 1.0*
