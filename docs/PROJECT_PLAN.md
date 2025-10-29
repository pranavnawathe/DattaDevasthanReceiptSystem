# Project Plan: Range-Based Receipt System Implementation

**Project:** Temple Receipt System - Admin Home & Range Management
**Start Date:** 2025-10-26
**Status:** Planning Phase
**Owner:** Pranav Nawathe

---

## Overview

Implement a range-based receipt numbering system that replaces the current year-based counter with physical book mirroring. Each feature will be implemented end-to-end (UI + Backend) before moving to the next.

### Design Documents
- [receipt_ids.md](in_progress/receipt_ids.md) - Backend design & data model
- [ui-spec-admin-home.md](in_progress/ui-spec-admin-home.md) - UI/UX specifications

---

## Implementation Strategy

**Approach:** Feature-by-feature, full-stack implementation
- Each feature = UI component + Backend API + Database changes
- Test and verify before moving to next feature
- Deploy incrementally with feature flags

---

## Phase 1: Foundation & Admin Home (Priority)

### Feature 1.1: Database Schema for Ranges ⭐ START HERE

**Objective:** Add Range entity to DynamoDB foundation

**Backend Tasks:**
- [ ] Update `foundation-stack.ts` to add Range items to DonationsTable
- [ ] Define Range item schema (PK, SK, year, start, end, next, status, version)
- [ ] Add GSI for querying ranges by status and year (optional)
- [ ] Create TypeScript interfaces in `lambda/common/types.ts`
- [ ] Write unit tests for Range schema validation

**Deliverables:**
- Updated CloudFormation template
- TypeScript types: `Range`, `RangeStatus`
- Test coverage for schema

**Acceptance Criteria:**
- [ ] `cdk synth` succeeds without errors
- [ ] Can deploy stack with new schema
- [ ] Types available for Lambda functions

**Estimated Time:** 2-3 hours

---

### Feature 1.2: Range Management API (Backend)

**Objective:** Create CRUD endpoints for range management

**Backend Tasks:**
- [ ] Create Lambda function: `lambda/ranges/index.ts`
- [ ] Implement `GET /ranges?status=active&year=YYYY` - list ranges
- [ ] Implement `GET /ranges/{rangeId}` - get single range
- [ ] Implement `POST /ranges` - create new range (admin only)
- [ ] Implement `PUT /ranges/{rangeId}/status` - activate/lock/archive
- [ ] Add range validation logic (start < end, no overlaps)
- [ ] Update `api-stack.ts` to add new routes
- [ ] Write integration tests

**Deliverables:**
- Range management Lambda function
- API Gateway routes configured
- Admin authorization middleware

**Acceptance Criteria:**
- [ ] Can create range via API
- [ ] Can list ranges filtered by year/status
- [ ] Can activate/lock ranges
- [ ] Admin-only endpoints reject non-admin users
- [ ] Returns proper error codes (400, 403, 409)

**Estimated Time:** 4-5 hours

---

### Feature 1.3: Admin Home Screen (UI)

**Objective:** Build landing page with Active Range card and Quick Actions

**Frontend Tasks:**
- [ ] Identify frontend framework/location (React? Next.js? Existing app?)
- [ ] Create `pages/home.tsx` (or equivalent)
- [ ] Build Active Range Card component
  - Display: alias, year, next number, remaining count
  - Status badge (ACTIVE, LOCKED, EXHAUSTED)
  - Switch Range button
  - Lock for Audit button (admin only)
- [ ] Build Quick Actions panel
  - Issue Receipt tile → `/issue`
  - Donor Search tile → `/donors`
  - Range Manager tile → `/settings/ranges` (admin only)
- [ ] Build Range Health widget
  - Show remaining count with color coding
  - Alert banner when remaining < 50
- [ ] Add API client functions
  - `fetchActiveRange()`
  - `fetchRanges(year, status)`
- [ ] Implement responsive layout (mobile: 2 rows)

**Deliverables:**
- Admin Home page component
- Active Range Card component
- Quick Actions panel component
- API client utilities

**Acceptance Criteria:**
- [ ] Page renders with mock data
- [ ] Page loads real data from API
- [ ] Displays active range correctly
- [ ] Quick action tiles navigate to correct routes
- [ ] Responsive on mobile devices
- [ ] Shows loading states

**Estimated Time:** 6-8 hours

---

### Feature 1.4: Active Range Context & Session Management

**Objective:** Implement client-side range selection persistence

**Frontend Tasks:**
- [ ] Create `contexts/ActiveRangeContext.tsx`
- [ ] Implement context provider with state:
  - `activeRange: Range | null`
  - `setActiveRange(range: Range)`
  - `clearActiveRange()`
- [ ] Add localStorage persistence
- [ ] Implement route guard for `/issue`
  - Redirect to `/home` if no active range
  - Show inline message: "Select a range first"
- [ ] Add loading state on app initialization
  - Fetch `/ranges/active` on mount
  - Restore from localStorage as fallback

**Backend Tasks:**
- [ ] Implement `GET /ranges/active` endpoint
  - Returns suggested range for user
  - Logic: most recently used by user, or highest remaining
- [ ] Implement `POST /session/activeRange` endpoint
  - Store user's active range selection
  - Return confirmation

**Deliverables:**
- ActiveRangeContext provider
- Route guard hook
- Session management endpoints

**Acceptance Criteria:**
- [ ] Active range persists across page refreshes
- [ ] Cannot access `/issue` without range
- [ ] Context available throughout app
- [ ] Loading states handled gracefully

**Estimated Time:** 3-4 hours

---

### Feature 1.5: Range Selection Modal with Year Filter

**Objective:** Allow users to switch between ranges

**Frontend Tasks:**
- [ ] Create `components/RangeSelectionModal.tsx`
- [ ] Build year filter (tabs or buttons)
  - Default to current year
  - Show available years based on ranges
- [ ] Display range list for selected year
  - Radio buttons for selection
  - Show: alias, next number, remaining, status
  - Disable locked/exhausted ranges
- [ ] Add confirmation logic
  - Show warning: "Numbers are monotonic..."
  - Update ActiveRangeContext on confirm
  - Call `POST /session/activeRange`
- [ ] Handle empty state (no ranges available)

**Deliverables:**
- Range selection modal component
- Year filter UI
- Confirmation flow

**Acceptance Criteria:**
- [ ] Modal opens from "Switch Range" button
- [ ] Year filter works correctly
- [ ] Can select and confirm new range
- [ ] Active range updates in UI
- [ ] Shows appropriate warnings

**Estimated Time:** 4-5 hours

---

### Feature 1.6: Range Manager (Admin Page)

**Objective:** Admin interface to manage ranges

**Frontend Tasks:**
- [ ] Create `pages/settings/ranges.tsx`
- [ ] Build ranges table
  - Columns: Alias, Year, Start, End, Next, Remaining, Status, Actions
  - Sort by year (desc) and alias
- [ ] Add Create Range form/modal
  - Fields: alias, year, start, end
  - Validation: start < end, year is valid
- [ ] Add action buttons per row
  - Activate (for draft ranges)
  - Lock/Unlock (for active ranges)
  - Archive (for exhausted ranges)
- [ ] Implement role-based access (admin only)

**Deliverables:**
- Range Manager page
- Create Range form
- Action handlers

**Acceptance Criteria:**
- [ ] Admin can view all ranges
- [ ] Admin can create new range
- [ ] Admin can activate/lock/archive ranges
- [ ] Non-admin users see 403 error
- [ ] Table updates in real-time after actions

**Estimated Time:** 5-6 hours

---

## Phase 2: Receipt Issuance with Range Allocation

### Feature 2.1: Update Receipt Creation Backend

**Objective:** Modify receipt creation to use range-based numbering

**Backend Tasks:**
- [ ] Update `lambda/receipts/index.ts`
- [ ] Implement `allocateFromRange(rangeId: string)` function
  - Use TransactWrite for atomicity
  - Update: `Range.next += 1` with version check
  - Put: new Receipt with `receiptNumber = YYYY-NNNNN`
- [ ] Add preflight validation
  - Check `range.status === 'active'`
  - Check `range.next <= range.end`
  - Check year match (receipt.date.year === range.year)
- [ ] Remove old counter logic (`COUNTER#YYYY`)
- [ ] Add error responses
  - `NEED_NEW_RANGE` (409)
  - `YEAR_MISMATCH` (409)
  - `RANGE_LOCKED` (423)
- [ ] Update receipt schema to include:
  - `rangeId`
  - `year`
  - `num`
  - `receiptNumber` (formatted: `YYYY-NNNNN`)

**Deliverables:**
- Updated receipt creation Lambda
- Range allocation logic with TransactWrite
- Error handling

**Acceptance Criteria:**
- [ ] Receipt creation uses range numbers
- [ ] Receipt number format: `2025-05071` (5 digits)
- [ ] TransactWrite ensures atomicity
- [ ] Proper error codes returned
- [ ] Old receipts (YYYY-xxxxx) still readable

**Estimated Time:** 5-6 hours

---

### Feature 2.2: Update Receipt Form (UI)

**Objective:** Integrate range context into receipt issuance

**Frontend Tasks:**
- [ ] Update receipt form to read `activeRange` from context
- [ ] Display active range in form header
  - "Issuing from: DIGI-2025-A (Next: 2025-00154)"
- [ ] Send `X-Range-Id` header with POST request
- [ ] Handle error responses
  - `NEED_NEW_RANGE`: Show banner, redirect to `/home`
  - `YEAR_MISMATCH`: Show warning (for admins, show override option)
  - `RANGE_LOCKED`: Show error, suggest switching range
- [ ] Show success with receipt number

**Deliverables:**
- Updated receipt form
- Error handling UI
- Range context integration

**Acceptance Criteria:**
- [ ] Form shows active range
- [ ] Receipt created with range-based number
- [ ] Error banners display correctly
- [ ] User redirected to home on NEED_NEW_RANGE

**Estimated Time:** 3-4 hours

---

### Feature 2.3: Range Exhaustion Handling

**Objective:** Gracefully handle range exhaustion

**Backend Tasks:**
- [ ] Add auto-transition logic: `ACTIVE → EXHAUSTED`
  - Triggered when `next > end` after allocation
  - Update range status in TransactWrite
- [ ] Include suggested ranges in error response
  - Query active ranges for same year
  - Sort by remaining count (desc)
  - Return top 3 suggestions

**Frontend Tasks:**
- [ ] Create exhaustion banner component
- [ ] Show non-dismissible banner on `/issue` page
  - Message: "Current book exhausted. Select new range for 2025."
  - CTA: "Select New Range" → opens modal
- [ ] Auto-open range selection modal
- [ ] Show suggested ranges prominently

**Deliverables:**
- Auto-exhaustion logic
- Exhaustion banner UI
- Suggested ranges in error response

**Acceptance Criteria:**
- [ ] Range auto-marked as exhausted when full
- [ ] User sees banner immediately
- [ ] Suggested ranges shown in modal
- [ ] Can select new range and continue

**Estimated Time:** 3-4 hours

---

## Phase 3: Admin Features

### Feature 3.1: Void Receipt (Backend)

**Objective:** Allow admins to void receipts

**Backend Tasks:**
- [ ] Implement `POST /receipts/{receiptNumber}/void`
- [ ] Add validation
  - Receipt exists
  - Current status is `issued`
  - User has admin role
- [ ] Update receipt with void metadata
  - `status = 'voided'`
  - `voidedAt`, `voidedBy`, `voidReason`, `voidNotes`
- [ ] Do NOT decrement `range.next`
- [ ] Create audit log entry

**Deliverables:**
- Void receipt endpoint
- Admin authorization
- Audit logging

**Acceptance Criteria:**
- [ ] Admin can void receipt
- [ ] Receipt marked as voided
- [ ] Number not freed up
- [ ] Non-admin users get 403
- [ ] Audit trail created

**Estimated Time:** 3-4 hours

---

### Feature 3.2: Void Receipt (UI)

**Objective:** UI for voiding receipts

**Frontend Tasks:**
- [ ] Add "Void" button to receipt detail page (admin only)
- [ ] Create void confirmation modal
  - Reason dropdown (pre-defined options)
  - Notes textarea
  - Warning message
- [ ] Show voided receipt state
  - Status: ❌ VOIDED
  - Display void metadata
  - PDF link with "(VOIDED)" label
- [ ] Update receipt lists to show void badge
  - Strikethrough: ~~2025-00154~~
  - Filter: "Include voided" checkbox

**Deliverables:**
- Void button and modal
- Voided receipt display
- List view updates

**Acceptance Criteria:**
- [ ] Admin sees void button
- [ ] Confirmation modal works
- [ ] Voided receipts clearly marked
- [ ] Filter works in lists

**Estimated Time:** 4-5 hours

---

### Feature 3.3: Admin Override for Year Mismatch (Backend)

**Objective:** Allow admins to override year validation

**Backend Tasks:**
- [ ] Update receipt creation validation
  - Check for `X-Admin-Override: true` header
  - If present and user is admin, skip year check
  - Log override to audit trail
- [ ] Add override metadata to receipt
  - `overrideApplied: true`
  - `overrideReason`
  - `overrideNotes`
- [ ] Return override info in response

**Deliverables:**
- Override validation logic
- Audit logging for overrides

**Acceptance Criteria:**
- [ ] Admin can override year mismatch
- [ ] Non-admin cannot override
- [ ] Override logged in audit
- [ ] Receipt includes override metadata

**Estimated Time:** 2-3 hours

---

### Feature 3.4: Admin Override for Year Mismatch (UI)

**Objective:** UI flow for year mismatch override

**Frontend Tasks:**
- [ ] Add year validation to receipt form
  - Detect mismatch: `receiptYear !== activeRange.year`
- [ ] Create year mismatch warning modal
  - Show 3 options (change date, switch range, override)
  - Only show override for admins
- [ ] Create override confirmation modal
  - Reason dropdown
  - Notes field
  - Warning about audit trail
- [ ] Add `X-Admin-Override` header when confirmed
- [ ] Show override badge on receipt detail

**Deliverables:**
- Year mismatch detection
- Warning modal
- Override confirmation modal
- Override badge display

**Acceptance Criteria:**
- [ ] Non-admin sees error, cannot override
- [ ] Admin sees 3 options
- [ ] Override confirmation works
- [ ] Override badge visible on receipt

**Estimated Time:** 4-5 hours

---

## Phase 4: Migration & Deployment

### Feature 4.1: Migration Script

**Objective:** Bootstrap initial range from existing counter

**Backend Tasks:**
- [ ] Create migration script `scripts/migrate-to-ranges.ts`
- [ ] Read current `COUNTER#2025` value
- [ ] Create first Range:
  - Alias: "DIGI-2025-A"
  - Year: 2025
  - Start: 1
  - End: 9999
  - Next: currentSeq + 1
  - Status: active
- [ ] Optionally freeze old counter (for rollback)
- [ ] Add verification step

**Deliverables:**
- Migration script
- Verification report

**Acceptance Criteria:**
- [ ] Script creates Range successfully
- [ ] Next number matches old counter
- [ ] Can run script multiple times (idempotent)

**Estimated Time:** 2-3 hours

---

### Feature 4.2: Feature Flag & Deployment

**Objective:** Safe deployment with rollback capability

**Backend Tasks:**
- [ ] Add environment variable: `USE_RANGE_NUMBERING=true`
- [ ] Keep both code paths temporarily
  - If flag=true: use `allocateFromRange()`
  - If flag=false: use old `getNextReceiptNumber()`
- [ ] Deploy to staging first
- [ ] Test end-to-end
- [ ] Deploy to production with flag=false
- [ ] Enable flag after verification
- [ ] Remove old code path in follow-up

**Frontend Tasks:**
- [ ] Deploy new UI to staging
- [ ] Test with real backend
- [ ] Deploy to production
- [ ] Monitor for errors

**Deliverables:**
- Staged deployment
- Feature flag configuration
- Rollback procedure

**Acceptance Criteria:**
- [ ] Can toggle feature via environment variable
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] No downtime during deployment

**Estimated Time:** 3-4 hours

---

### Feature 4.3: Monitoring & Alerts

**Objective:** Set up operational monitoring

**Backend Tasks:**
- [ ] Add CloudWatch metrics
  - `RangeNextDistance` (remaining count)
  - `RangeExhausted` counter
  - `YearMismatchOverride` counter
  - `ReceiptVoided` counter
- [ ] Create CloudWatch alarms
  - Alert when remaining < 50
  - Alert on range exhaustion
- [ ] Set up SNS topic for admin alerts
- [ ] Add structured logging
  - Include: orgId, rangeId, receiptNumber, errorCode

**Frontend Tasks:**
- [ ] Add error tracking (Sentry/similar)
- [ ] Add analytics events
  - Range selection
  - Receipt creation
  - Void actions

**Deliverables:**
- CloudWatch dashboards
- SNS alerts configured
- Logging structured

**Acceptance Criteria:**
- [ ] Metrics visible in CloudWatch
- [ ] Alarms trigger correctly
- [ ] Admin receives email alerts
- [ ] Logs searchable and useful

**Estimated Time:** 3-4 hours

---

## Phase 5: Polish & Documentation

### Feature 5.1: PDF Generation Update

**Objective:** Update receipt PDFs with new number format

**Backend Tasks:**
- [ ] Update PDF generation in `lambda/receipts/`
- [ ] Change receipt number display to `YYYY-NNNNN`
- [ ] Add void watermark support
- [ ] Test PDF rendering

**Deliverables:**
- Updated PDF templates
- Void watermark

**Acceptance Criteria:**
- [ ] PDFs show new format correctly
- [ ] Voided PDFs have watermark
- [ ] Old PDFs still downloadable

**Estimated Time:** 2-3 hours

---

### Feature 5.2: User Documentation

**Objective:** Create user guides and admin documentation

**Tasks:**
- [ ] Write user guide: "How to Issue Receipts"
- [ ] Write admin guide: "Managing Receipt Ranges"
- [ ] Document void process
- [ ] Document year override process
- [ ] Create troubleshooting guide
- [ ] Record demo video (optional)

**Deliverables:**
- User documentation
- Admin documentation
- Troubleshooting guide

**Estimated Time:** 4-5 hours

---

### Feature 5.3: Code Cleanup & Optimization

**Objective:** Clean up and optimize codebase

**Tasks:**
- [ ] Remove old counter code (after successful migration)
- [ ] Remove feature flag code
- [ ] Optimize DynamoDB queries (add indexes if needed)
- [ ] Review and optimize Lambda memory/timeout settings
- [ ] Add code comments and JSDoc
- [ ] Run security audit
- [ ] Update README.md

**Deliverables:**
- Cleaned codebase
- Performance optimizations
- Updated documentation

**Estimated Time:** 3-4 hours

---

## Summary Timeline

| Phase | Features | Estimated Time | Priority |
|-------|----------|----------------|----------|
| **Phase 1** | Foundation & Admin Home | 24-31 hours | ⭐⭐⭐ Critical |
| **Phase 2** | Receipt Issuance | 11-14 hours | ⭐⭐⭐ Critical |
| **Phase 3** | Admin Features | 13-17 hours | ⭐⭐ High |
| **Phase 4** | Migration & Deployment | 8-11 hours | ⭐⭐ High |
| **Phase 5** | Polish & Documentation | 9-12 hours | ⭐ Medium |
| **Total** | | **65-85 hours** | |

**Estimated Calendar Time:** 2-3 weeks (with 1 developer, 30-40 hours/week)

---

## Risk Management

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| DynamoDB TransactWrite conflicts | High | Implement exponential backoff, optimistic locking |
| Range exhaustion during high load | Medium | Monitor remaining count, pre-activate next range |
| PDF generation breaks | Medium | Test thoroughly, maintain old format compatibility |
| Migration data loss | High | Backup data before migration, test script multiple times |

### Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users don't select range | High | Mandatory route guard, clear UX prompts |
| Admin forgets to activate new range | Medium | Automated alerts when remaining < 50 |
| Year rollover issues | Medium | Pre-create ranges for next year, test rollover scenario |

---

## Success Criteria

### Functional
- [ ] All receipts use range-based numbering
- [ ] Users can select and switch ranges
- [ ] Admins can create and manage ranges
- [ ] Range exhaustion handled gracefully
- [ ] Void receipts work correctly
- [ ] Year override works for admins

### Non-Functional
- [ ] Zero data loss during migration
- [ ] No receipt number collisions
- [ ] Receipt creation latency < 2 seconds
- [ ] System handles 100 concurrent issuers
- [ ] Audit trail complete and accurate

### User Experience
- [ ] Intuitive UI, minimal training needed
- [ ] Clear error messages and guidance
- [ ] Mobile-responsive design
- [ ] Accessible to non-technical users

---

## Next Steps

1. **Review and approve this plan**
2. **Set up development environment**
3. **Start with Feature 1.1** (Database Schema)
4. **Daily standups** to track progress
5. **Weekly demos** to stakeholders

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Author:** Claude Code (based on design by Pranav Nawathe)
