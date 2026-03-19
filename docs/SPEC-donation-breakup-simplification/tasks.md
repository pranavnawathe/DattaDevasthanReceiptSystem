# Tasks: Donation Breakup Simplification

## Frontend

- [x] 1. Update frontend types
  - Replace `DONATION_CATEGORIES` with the 3-category model (`GENERAL`, `ANNADAN`)
  - Add `DHARMIK_KARYAS` constant with predefined amounts (Ekadashani ₹201, Laghurudra ₹501, Abhishek ₹101)
  - Add `DharmikKarya` type
  - Add `gotra?: string` and `postalAddress?: string` to `DonorInfo`
  - Add `gotra` and `postalAddress` to `FormErrors`
  - File: `ui/src/types/index.ts`

- [x] 2. Update DonationForm with Dharmik section
  - Add `dharmikEnabled`, `dharmikKarya`, `gotra`, `postalAddress` state
  - Replace old breakup inputs with: General amount, Annadan amount, Dharmik checkbox
  - When Dharmik checked: show karya dropdown, read-only amount, gotra input, postal address textarea
  - Update breakup object on karya switch; remove `DHARMIK_*` key on uncheck
  - Update `resetForm` to clear all Dharmik fields
  - File: `ui/src/components/DonationForm.tsx`

- [x] 3. Update validators for Dharmik fields
  - Require `gotra` (non-empty) when Dharmik is enabled
  - Require `postalAddress` (non-empty) when Dharmik is enabled
  - File: `ui/src/utils/validators.ts`

- [x] 4. Add sankalpa fields to frontend types and form
  - Add `sankalp?: string`, `visheshSankalp?: string`, `yajmanUpasthit?: string` to `CreateReceiptRequest` in `ui/src/types/index.ts`
  - Add `sankalp`, `visheshSankalp`, `yajmanUpasthit` state to `DonationForm`
  - Render three optional text inputs inside the Dharmik section (visible when Dharmik checked)
  - Include fields in form submit payload
  - Clear fields on `resetForm`
  - Files: `ui/src/types/index.ts`, `ui/src/components/DonationForm.tsx`

## Backend — TypeScript Source

- [x] 5. Update backend types — donor fields
  - Add `gotra?: string` and `postalAddress?: string` to `DonorInfo` interface
  - Add `gotra?: string` and `postalAddress?: string` to `DonorItem` interface
  - File: `lambda/common/types.ts`

- [x] 6. Update backend types — sankalpa fields on donation
  - Add `sankalp?: string`, `visheshSankalp?: string`, `yajmanUpasthit?: string` to `DonationItem` interface
  - Add same three fields to `CreateReceiptRequest` interface
  - File: `lambda/common/types.ts`

- [x] 7. Update donation-service — Dharmik validation and donor fields
  - Validate `donor.gotra` and `donor.postalAddress` are non-empty when any `DHARMIK_*` key in breakup
  - Pass `gotra` and `postalAddress` through to donor resolver
  - File: `lambda/common/services/donation-service.ts`

- [x] 8. Update donation-service — persist sankalpa fields
  - Save `sankalp`, `visheshSankalp`, `yajmanUpasthit` from request onto the `DonationItem` before writing to DynamoDB
  - File: `lambda/common/services/donation-service.ts`

- [x] 9. Update donor-resolver — save gotra and postalAddress
  - When `gotra` or `postalAddress` provided on `DonorInfo`, write them to the donor item in DynamoDB
  - File: `lambda/common/services/donor-resolver.ts`

- [x] 10. Update receipt-artifact PDF — donor block and breakup table
  - Print `गोत्र:` and `पत्ता:` lines in donor block when present on donation
  - Replace hardcoded 5-row table with 3-row dynamic table (सामान्य, अन्नदान, धार्मिक)
  - Dynamic Dharmik row label from whichever `DHARMIK_*` key is present
  - Add legacy key fallback map for old receipts
  - File: `lambda/common/services/receipt-artifact.ts`

- [x] 11. Update receipt-artifact PDF — sankalpa block
  - When any `DHARMIK_*` key present, print sankalpa section between donor block and breakup table:
    `आपणाकडून या दिनी`, `सन्कल्प`, `विशेष सन्कल्प`, `यजमान उपस्थित`
  - Omit section entirely for non-Dharmik receipts
  - File: `lambda/common/services/receipt-artifact.ts`

## Backend — Compiled JS (must mirror TS changes)

- [x] 12. Sync compiled JS — types, donation-service, donor-resolver, receipt-artifact
  - Files: `lambda/common/types.js`, `lambda/common/services/donation-service.js`,
    `lambda/common/services/donor-resolver.js`, `lambda/common/services/receipt-artifact.js`
  - Also sync duplicates under `lambda/receipts/common/` if present

- [x] 13. Compile sankalpa changes to JS
  - After completing tasks 6, 8, 11 — compile or manually sync changes to `.js` counterparts
  - Files: `lambda/common/types.js`, `lambda/common/services/donation-service.js`,
    `lambda/common/services/receipt-artifact.js`
