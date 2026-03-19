# Specification: Donation Breakup Simplification

## Overview

Reduce the donation breakup categories from 7 loosely-defined options to 3 well-defined categories that match how the temple actually records donations: **General**, **Annadan**, and **Dharmik**. When Dharmik is selected, the user picks a specific religious activity (Dharmik Karya) whose donation amount is **fixed**. Dharmik donations also require the donor's **gotra** and **postal address** (for prasad dispatch) — both are saved to the donor profile and printed on the PDF.

## Category Design

### New Categories

| Key | Marathi Label | English Label |
|-----|--------------|---------------|
| `GENERAL` | सामान्य | General |
| `ANNADAN` | अन्नदान | Annadan |
| `DHARMIK_EKADASHANI` | धार्मिक - एकादशनी | Dharmik - Ekadashani |
| `DHARMIK_LAGHURUDRA` | धार्मिक - लघुरुद्र | Dharmik - Laghurudra |
| `DHARMIK_ABHISHEK` | धार्मिक - अभिषेक | Dharmik - Abhishek |

### Dharmik Karya Predefined Amounts

Fixed minimum amounts — changing them requires a code update.

| Karya Key | Amount (₹) |
|-----------|-----------|
| `EKADASHANI` | 201 |
| `LAGHURUDRA` | 501 |
| `ABHISHEK` | 101 |

### Removed Categories (Previously)
`TEMPLE_GENERAL`, `EDUCATION`, `GAUSHALA`, `CONSTRUCTION`, `FESTIVAL`, `OTHER`

### Storage Format

Breakup is stored as `Record<string, number>` in DynamoDB — no schema migration needed. New receipts use the new keys. Old receipts with old keys are unaffected (viewed read-only, PDF regeneration uses a fallback).

## UI Behavior

### Breakup Form

The breakup section renders:

1. **General** — amount input, always visible
2. **Annadan** — amount input, always visible
3. **Dharmik** — opt-in via checkbox; details shown only when checked

### Dharmik Section Detail

- A **checkbox** labelled `धार्मिक / Dharmik` controls whether a Dharmik donation is included
- **Unchecked (default)**: everything below is hidden; no `DHARMIK_*` key in breakup
- **Checked**: the following appear:
  - Karya dropdown: `Ekadashani | Laghurudra | Abhishek` (default: `Ekadashani`)
  - Amount: read-only display (e.g., `₹ 201`) — not user-editable
  - **Gotra** — required text input (`गोत्र / Gotra`)
  - **Postal Address** — required textarea (`पत्ता / Postal Address`)
  - **Sankalp** — optional text input (`सन्कल्प / Sankalp`, e.g., "गुरुसेवा")
  - **Vishesh Sankalp** — optional text input (`विशेष सन्कल्प / Vishesh Sankalp`)
  - **Yajman Upasthit** — optional text input (`यजमान उपस्थित / Yajman Upasthit`)
- Breakup updated immediately on check: `DHARMIK_EKADASHANI: 201`
- Switching karya: removes old `DHARMIK_*` key, adds new key with new predefined amount
- Unchecking Dharmik: removes `DHARMIK_*` key from breakup; all Dharmik fields hidden (values retained in state in case user re-checks)

> **Note**: If a donor wants to give more than the karya's fixed amount, they add the extra to the General field.

### Validation

When Dharmik is **checked**, the following are required:
- Karya selection (always has a default — no validation needed)
- Gotra (non-empty string)
- Postal address (non-empty string)

When Dharmik is **unchecked**, gotra and address are not validated.

Existing rule unchanged: at least one breakup category must have a positive amount.

### Reset

On form reset: Dharmik checkbox unchecked, karya resets to `EKADASHANI`, gotra/address/sankalp/visheshSankalp/yajmanUpasthit cleared, all `DHARMIK_*` keys removed from breakup.

## Data Model Changes

### Donor Profile — New Fields

Two new optional fields added to the donor record in DynamoDB:

| Field | Type | Description |
|-------|------|-------------|
| `gotra` | `string` (optional) | Donor's gotra (Hindu lineage) |
| `address` | `string` (optional) | Postal address for prasad dispatch |

These fields are populated/updated whenever a Dharmik receipt is created for that donor.

### Donation Item — New Fields

Three new optional fields added to the donation/receipt record in DynamoDB (not on the donor profile — these are per-donation):

| Field | Type | Description |
|-------|------|-------------|
| `sankalp` | `string` (optional) | Purpose/intention of the donation (e.g., "गुरुसेवा") |
| `visheshSankalp` | `string` (optional) | Additional/special purpose |
| `yajmanUpasthit` | `string` (optional) | Whether/who the donor-performer is present |

These are captured when Dharmik is checked and printed on the PDF. They are not stored on the donor profile.

### API Request — `POST /receipts`

`gotra` and `address` are added as optional fields on the `donor` object. They are **required** when the `breakup` contains any `DHARMIK_*` key. `sankalp`, `visheshSankalp`, and `yajmanUpasthit` are optional top-level fields on the request.

```diff
 {
   "donor": {
     "name": "राम शिंदे",
     "mobile": "9876543210",
+    "gotra": "कश्यप",
+    "address": "123, मेन रोड, कोंडगांव, रत्नागिरी - 415640"
   },
   "breakup": { "DHARMIK_EKADASHANI": 201, "GENERAL": 500 },
   "payment": { "mode": "CASH" },
   "date": "2026-03-16",
+  "sankalp": "गुरुसेवा",
+  "visheshSankalp": "",
+  "yajmanUpasthit": ""
 }
```

### Backend Validation

In `donation-service.ts`, when any `DHARMIK_*` key is present in `breakup`:
- `request.donor.gotra` must be a non-empty string
- `request.donor.address` must be a non-empty string

`sankalp`, `visheshSankalp`, and `yajmanUpasthit` are always optional — no validation needed.

### Donor Profile Update

The donation service already resolves/creates a donor on each receipt creation. Extend this to also save `gotra` and `address` to the donor item when provided.

## PDF Receipt Changes

### Donor Block

When the receipt has a Dharmik breakup key, print gotra and address below the donor name:

```
श्री. / सौ. / श्रीमती
<Donor Name>
गोत्र: <gotra>
पत्ता: <address>
```

When no Dharmik key present, gotra and address lines are omitted.

### Sankalpa Block

When the receipt has a Dharmik breakup key, print a sankalpa section between the donor block and the breakup table:

```
आपणाकडून या दिनी - <date>
सन्कल्प        : <sankalp or blank>
विशेष सन्कल्प  : <visheshSankalp or blank>
यजमान उपस्थित : <yajmanUpasthit or blank>
```

When no Dharmik key present, the sankalpa section is omitted entirely.

### Breakup Table

Replace hardcoded 5-row table with 3 dynamic rows:

| Row | Label (Marathi) | Maps to breakup key |
|-----|----------------|---------------------|
| 1 | सामान्य | `GENERAL` |
| 2 | अन्नदान | `ANNADAN` |
| 3 | धार्मिक - \<karya\> | `DHARMIK_EKADASHANI` / `DHARMIK_LAGHURUDRA` / `DHARMIK_ABHISHEK` |

The Dharmik row label is dynamic — derived from whichever `DHARMIK_*` key is present. If none, shows `धार्मिक कार्य` with dots.

### Backward Compatibility (Old Receipts)

Old receipts may have old breakup keys. Legacy fallback map for PDF rendering:

| Old key | Maps to row |
|---------|-------------|
| `TEMPLE_GENERAL` | सामान्य |
| `ANNADAAN` | अन्नदान |
| `POOJA` | धार्मिक कार्य |
| `FESTIVAL` | सामान्य |
| `OTHER` | सामान्य |

Old receipts have no gotra/address — the donor block renders as before (name only).

## Files to Change

### Frontend

| File | Change |
|------|--------|
| `ui/src/types/index.ts` | Replace `DONATION_CATEGORIES`; add `DHARMIK_KARYAS` with amounts; add `DharmikKarya` type; add `gotra` and `address` optional fields to `DonorInfo` |
| `ui/src/components/DonationForm.tsx` | Add `dharmikEnabled`, `dharmikKarya`, `gotra`, `address`, `sankalp`, `visheshSankalp`, `yajmanUpasthit` state; update breakup section with checkbox, karya dropdown, read-only amount, gotra/address/sankalp/visheshSankalp/yajmanUpasthit inputs; update validation and `resetForm` |
| `ui/src/utils/validators.ts` | Add gotra and address validation (required when Dharmik enabled) to `validateDonorInfo` or a new `validateDharmikInfo` |

### Backend (TypeScript source + compiled JS)

| File | Change |
|------|--------|
| `lambda/common/types.ts` | Add `gotra?: string` and `address?: string` to `DonorInfo` and `DonorItem`; add `sankalp?: string`, `visheshSankalp?: string`, `yajmanUpasthit?: string` to `DonationItem` and request type |
| `lambda/common/types.js` | Same (compiled output) |
| `lambda/common/services/donation-service.ts` | Add validation: if any `DHARMIK_*` key in breakup, require `donor.gotra` and `donor.address`; pass them to donor resolver for saving; save `sankalp`/`visheshSankalp`/`yajmanUpasthit` on the donation item |
| `lambda/common/services/donation-service.js` | Same (compiled output) |
| `lambda/common/services/donor-resolver.ts` | Save `gotra` and `address` to donor item when provided |
| `lambda/common/services/donor-resolver.js` | Same (compiled output) |
| `lambda/common/services/receipt-artifact.ts` | Update PDF: print gotra + address in donor block when present; add sankalpa block (आपणाकडून या दिनी / सन्कल्प / विशेष सन्कल्प / यजमान उपस्थित) for Dharmik receipts; replace 5-row table with 3-row dynamic table; update category mapping; add legacy key fallback |
| `lambda/common/services/receipt-artifact.js` | Same (compiled output) |

### No Changes Needed

- `lambda/common/db/queries.ts` — donor put/update is handled by donor-resolver
- `ui/src/services/api.ts` — `DonorInfo` change flows through transparently

## Testing Plan

1. **UI build**: `cd ui && npm run build` — no TypeScript errors
2. **UI lint**: `cd ui && npm run lint` — no lint errors
3. **Lambda tests**: `cd lambda/common && npm test` — existing tests pass
4. **Manual: form load** — Dharmik unchecked, gotra/address/karya hidden, total ₹0
5. **Manual: check Dharmik** — Ekadashani default, ₹201 read-only, gotra + address fields appear, total ₹201
6. **Manual: submit with Dharmik checked, gotra empty** — validation error on gotra field
7. **Manual: submit with Dharmik checked, address empty** — validation error on address field
8. **Manual: switch karya to Laghurudra** — amount changes to ₹501, total updates
9. **Manual: switch karya to Abhishek** — amount changes to ₹101, total updates
10. **Manual: uncheck Dharmik** — gotra/address/karya hidden, Dharmik removed from breakup, total updates; no gotra/address validation on submit
11. **Manual: create receipt (General only, Dharmik unchecked)** — succeeds; PDF has no gotra/address line
12. **Manual: create receipt (Dharmik Ekadashani + gotra + address)** — succeeds; PDF shows gotra and address in donor block; धार्मिक - एकादशनी row with ₹201
13. **Manual: look up same donor again** — donor record in DB has gotra and address saved
14. **Manual: reset form** — Dharmik unchecked, gotra/address/sankalp/visheshSankalp/yajmanUpasthit cleared, karya resets to Ekadashani
15. **Manual: view old receipt (no gotra/address)** — PDF renders correctly, no blank gotra/address or sankalpa section
16. **Manual: check Dharmik, fill sankalp "गुरुसेवा", leave visheshSankalp + yajmanUpasthit empty** — succeeds; PDF shows sankalpa block with "गुरुसेवा" and blank lines for the other two fields
17. **Manual: create receipt (Dharmik, all sankalpa fields filled)** — PDF shows all three sankalpa fields populated; sankalpa section absent for General-only receipts
