# Admin Home & Range Assignment — UI/UX Spec

**Scope:** Add a top‑level screen before “Issue Receipt” to (a) select/assign an active **Receipt Range (Book)** and (b) surface feature tiles (Donor Search, Exports for Tally, Settings).

---

## 1) Navigation IA (Minimal)
- **/home** (new landing after login)
  - Header: org/branch, user, role badge (Admin/Issuer)
  - Sections:
    1) **Active Range** (assign/lock/switch)
    2) **Quick Actions** (Issue Receipt, Donor Search, Exports)
    3) **Range Health** (remaining numbers, alerts)
- **/issue** (existing receipt form) — requires an **active range** in session
- **/donors** (search & upsert)
- **/exports** (create & history)
- **/settings/ranges** (manage ranges; admin‑only)

---

## 2) Top-Level Screen Layout (Wireframe)
```
┌──────────────────────────────────────────────────────────────────────┐
│  Header:  Datta Devasthan  | Branch: Main  | User: Pranav (Admin)   │
├──────────────────────────────────────────────────────────────────────┤
│ [ Active Range ]                                                     │
│  Alias: DIGI-2025-A   Year: 2025   Next: 2025-00154                 │
│  Remaining: 9,846 / 9,999                                            │
│  Status: 🟢 ACTIVE  |  [ Switch Range ] [ Lock for Audit ]          │
│  Note: Numbers are allocated atomically per range.                   │
├──────────────────────────────────────────────────────────────────────┤
│  Quick Actions                                                       │
│  [ Issue Receipt ]  [ Donor Search ]  [ Donation Export (Tally) ]   │
│  [ Range Manager ] (admin)  [ System Health ]                        │
├──────────────────────────────────────────────────────────────────────┤
│  Range Health                                                        │
│  • DIGI-2025-A: Remaining 9,846  | Exhaustion threshold: 50         │
│  • Alerts: None                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3) Range Selection & Session Model
- **SessionActiveRange** stored in client state (and echoed by server):
```json
{
  "rangeId": "uuid-5f3e",
  "alias": "DIGI-2025-A",
  "year": 2025,
  "start": 1,
  "end": 9999,
  "next": 154,
  "remaining": 9846,
  "status": "active",
  "leaseUntil": "2025-10-26T11:30:00Z" // optional advisory lease
}
```
**Note:** Receipt numbers use format `YYYY-NNNNN` (e.g., `2025-00154`). The year comes from the range's `year` field.
- **Guard:** `/issue` route redirects to `/home` if no active range is selected.
- **Sticky selection:** Persist in `localStorage` and refresh on page load via `/ranges/active` endpoint.

### Range Selection Modal (with Year Filter)
When user clicks "Switch Range":
```
┌────────────────────────────────────────────────────────┐
│ Select Active Range                                    │
├────────────────────────────────────────────────────────┤
│ Filter by Year: [ 2024 ] [ 2025 ✓ ] [ 2026 ]         │
├────────────────────────────────────────────────────────┤
│ Available Ranges for 2025:                             │
│                                                        │
│ ○ DIGI-2025-A                                         │
│   Next: 2025-00154  |  Remaining: 9,846  |  🟢 ACTIVE │
│                                                        │
│ ○ PHYS-2025-B                                         │
│   Next: 2025-00001  |  Remaining: 5,000  |  🟢 ACTIVE │
│                                                        │
│ ⚠️  Numbers are monotonic per book. Switching will    │
│     not renumber previously issued receipts.           │
│                                                        │
│ [ Cancel ]  [ Confirm Selection ]                     │
└────────────────────────────────────────────────────────┘
```

---

## 4) API Contracts (Frontend ↔ Backend)
- `GET /ranges?status=active&year=YYYY` → list active ranges filtered by year (alias, year, next, remaining, status)
- `POST /ranges/{id}/assign` → (optional) assign to user/device
- `POST /ranges/{id}/lock` → admin lock/unlock
- `GET /ranges/active` → server returns suggested active range for user/device
- `POST /session/activeRange` → set/confirm active range for this client session
- `POST /receipts` → server reads active range from header `X-Range-Id`

**Headers** (recommended):
- `X-Range-Id: <rangeId>` — explicit selection, server validates `status='active'`
- `X-Client-Id: <deviceId>` — improves leasing/telemetry

---

## 5) UX Rules (Numbering Integrity)
1. **Issue disabled** until a valid active range exists. Show inline reason and a CTA to “Select Range”.
2. **Range card** shows: alias, prefix, next, remaining, status, and a soft warning when remaining `< 50`.
3. **Switching range** requires confirm modal: “Numbers are monotonic per book; switching doesn’t renumber issued receipts.”
4. **Locked range** displays badge and disables Issue action; includes tooltip “Locked during audit”.
5. **Admin vs Issuer**
   - Issuer: can **select** active range from active list.
   - Admin: can **create/activate/lock** ranges (via Range Manager).

---

## 6) Quick Actions Panel (Modular)
Tiles:
- **Issue Receipt** → `/issue`
- **Donor Search** → `/donors`
- **Donation Export (Tally)** → `/exports`
- **Range Manager (Admin)** → `/settings/ranges`
- **System Health** → `/ops/health` (optional future)

Each tile has a short description and role-based enablement.

---

## 7) Range Manager (Admin-Only)
- Table of ranges: Alias | Year | Start | End | Next | Remaining | Status | Actions
- Actions: **Activate**, **Lock/Unlock**, **Assign**, **Archive**
- Create Range form: `{ alias, year, start, end }` with validations
- Example: Alias="DIGI-2025-A", Year=2025, Start=1, End=9999

---

## 8) Void Receipt (Admin Only)

### Purpose
Allow administrators to void/discard receipts issued in error while preserving audit trail.

### UI Location
Add "Void Receipt" action to receipt detail/view screen (accessible from donor search or receipt lookup).

### Void Button Placement
```
┌──────────────────────────────────────────────────────────────┐
│ Receipt Details: 2025-00154                                  │
├──────────────────────────────────────────────────────────────┤
│ Date: 2025-10-20                Amount: ₹600                 │
│ Donor: Ramesh Kumar             Phone: +91 98765 43210       │
│ Purpose: General Donation                                    │
│ Status: 🟢 ISSUED                                            │
│                                                              │
│ [ 📄 View PDF ]  [ 📧 Send Email ]  [ 🗑️ Void ] (Admin)    │
└──────────────────────────────────────────────────────────────┘
```

### Void Confirmation Modal
```
┌──────────────────────────────────────────────────────────────┐
│ Void Receipt 2025-00154?                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Reason: [ Duplicate entry          ▼ ]                      │
│         Options:                                             │
│         - Duplicate entry                                    │
│         - Data entry error                                   │
│         - Donor requested cancellation                       │
│         - Other (specify below)                              │
│                                                              │
│ Additional Notes (optional):                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Receipt was created twice for same donation...           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ⚠️  WARNING: This action is permanent                        │
│    • Receipt will be marked as VOIDED                        │
│    • Receipt number cannot be reused                         │
│    • Original data preserved for audit                       │
│    • PDF will be watermarked as "VOIDED"                     │
│                                                              │
│ [ Cancel ]  [ Confirm Void Receipt ]                         │
└──────────────────────────────────────────────────────────────┘
```

### API Call
```typescript
POST /receipts/2025-00154/void
Headers: {
  "X-Admin-Token": "<admin-jwt>",
  "X-User-Id": "admin-01"
}
Body: {
  "reason": "Duplicate entry",
  "notes": "Receipt was created twice for same donation"
}

Response 200 OK: {
  "receiptNumber": "2025-00154",
  "status": "voided",
  "voidedAt": "2025-10-26T14:30:00Z",
  "voidedBy": "admin-01",
  "reason": "Duplicate entry"
}
```

### Voided Receipt Display
After voiding, receipt detail screen shows:
```
┌──────────────────────────────────────────────────────────────┐
│ Receipt Details: 2025-00154                                  │
├──────────────────────────────────────────────────────────────┤
│ Date: 2025-10-20                Amount: ₹600                 │
│ Donor: Ramesh Kumar             Phone: +91 98765 43210       │
│ Purpose: General Donation                                    │
│ Status: ❌ VOIDED                                            │
│                                                              │
│ ⚠️  This receipt has been voided                             │
│     Voided by: admin-01                                      │
│     Voided at: 2025-10-26 14:30                              │
│     Reason: Duplicate entry                                  │
│     Notes: Receipt was created twice for same donation       │
│                                                              │
│ [ 📄 View PDF (with VOID watermark) ]                       │
└──────────────────────────────────────────────────────────────┘
```

### Voided Receipts in Lists/Reports
- Show with strikethrough: ~~2025-00154~~
- Badge: ❌ VOID
- Filter option: "Include voided receipts" (unchecked by default)
- Export includes void status column

### Permissions
- Only users with `admin` role can void receipts
- Button hidden for non-admin users
- API endpoint validates admin token

---

## 9) Admin Override for Year Mismatch

### Purpose
Allow administrators to issue receipts with dates that don't match the active range year (e.g., backdating, late entries).

### When It Triggers
When an admin enters a receipt date whose year doesn't match `activeRange.year`:
```javascript
const receiptYear = new Date(receiptDate).getFullYear();
if (receiptYear !== activeRange.year && userRole === 'admin') {
  showYearMismatchWarning();
}
```

### Year Mismatch Warning Modal
```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  Year Mismatch Warning                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Selected Range:  DIGI-2025-A (Year: 2025)                 │
│ Receipt Date:    2024-12-28 (Year: 2024)                  │
│                                                            │
│ The receipt date year does not match the active range     │
│ year. This may indicate a data entry error.               │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ What would you like to do?                             │ │
│ │                                                        │ │
│ │ ○ Change receipt date to 2025                         │ │
│ │ ○ Switch to a 2024 range (if available)               │ │
│ │ ○ Override and continue (Admin only)                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [ Cancel ]  [ Proceed ]                                    │
└────────────────────────────────────────────────────────────┘
```

### Override Confirmation (Admin Only)
If admin selects "Override and continue":
```
┌────────────────────────────────────────────────────────────┐
│ Admin Override Required                                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ You are about to issue a receipt with mismatched year:    │
│                                                            │
│ • Range Year: 2025                                         │
│ • Receipt Year: 2024                                       │
│ • Receipt Number: 2025-00154 (from active range)          │
│                                                            │
│ Override Reason: [ Late entry for previous year donation ▼]│
│                  Options:                                  │
│                  - Late entry for previous year donation   │
│                  - Correcting historical records           │
│                  - Backdating authorized by management     │
│                  - Other (specify below)                   │
│                                                            │
│ Additional Details:                                        │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Donor came late with December 2024 donation...       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ ⚠️  This action will be logged in the audit trail          │
│                                                            │
│ [ Cancel ]  [ Confirm Override ]                           │
└────────────────────────────────────────────────────────────┘
```

### API Request with Override
```typescript
POST /receipts
Headers: {
  "X-Range-Id": "uuid-5f3e",
  "X-Admin-Override": "true",
  "X-User-Id": "admin-01"
}
Body: {
  "date": "2024-12-28",
  "donorName": "Ramesh Kumar",
  "amount": 600,
  "overrideReason": "Late entry for previous year donation",
  "overrideNotes": "Donor came late with December 2024 donation..."
}
```

### Backend Response Handling
```typescript
// Success with override
Response 201 Created: {
  "receiptNumber": "2025-00154",
  "date": "2024-12-28",
  "overrideApplied": true,
  "overrideReason": "Late entry for previous year donation"
}

// Year mismatch without override (non-admin or missing header)
Response 409 Conflict: {
  "code": "YEAR_MISMATCH",
  "rangeYear": 2025,
  "receiptYear": 2024,
  "message": "Receipt year must match active range year"
}
```

### UI States
1. **For non-admin users**: Show error, disable submit
   ```
   ❌ Receipt date year (2024) doesn't match active range year (2025).
      Please correct the date or contact an administrator.
   ```

2. **For admin users**: Show warning modal with override option

3. **After override**: Receipt detail shows override badge
   ```
   Receipt: 2025-00154
   Date: 2024-12-28  ⚠️  OVERRIDE APPLIED
   Reason: Late entry for previous year donation
   ```

### Audit Trail
Overrides are logged with:
- Receipt number
- Admin user ID
- Timestamp
- Override reason and notes
- Original vs actual year values

---

## 10) Frontend Integration Notes
- Add `ActiveRangeContext` (React) providing `activeRange`, `setActiveRange`, and guard hooks.
- On login/app load:
  1. Fetch `GET /ranges/active`.
  2. If none, route to `/home` and prompt selection.
  3. Persist selection via `POST /session/activeRange` and local storage.
- `POST /receipts` attaches `X-Range-Id` header. Handle 409 with `NEED_NEW_RANGE` banner → take user back to `/home` to switch.

---

## 10) Telemetry & Alerts in UI
- Banner when remaining `< threshold` (default 50): “Range nearly exhausted. Ask admin to activate a new range.”
- Toast on `TransactWriteFailed` with guidance to retry (idempotent).
- Health widget polls `/ranges?status=active` every 60s when on `/home`.

---

## 11) Visual Details
- Range badge: `alias` with color chip; status pills (ACTIVE, LOCKED, EXHAUSTED)
- Monospace font for receipt numbers (`2025-00154`) to aid visual scanning.
- Receipt number format: `YYYY-NNNNN` (5-digit zero-padded)
- Mobile: two rows → (Active Range card) then (Quick Actions grid).

---

## 12) Acceptance Criteria
- Users cannot reach `/issue` without an active range.
- Switching range updates session and header and is reflected on next issued receipt.
- When backend returns `NEED_NEW_RANGE`, the UI shows a non‑dismissable banner with a “Select New Range” action.
- Admin can create and activate a new range from Range Manager without redeploying.

---

## 13) Out of Scope (for now)
- Donor search UI details, Export wizard screens, WhatsApp flows.
- Role management and audit UI; only controls needed for range selection.

---

**Ready for FE work.** Add this as `docs/in_progress/ui-spec-admin-home.md` and link from README.

