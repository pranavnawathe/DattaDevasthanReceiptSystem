# Year-Prefixed Range Numbering & Exhaustion Handling — Backend Design

**Objective:** Extend the range-based receipt numbering design to include **year prefixes** and robust **exhaustion handling** at the API and UX levels.

---

## 1) Motivation

* Physical receipt books are printed with **predefined sequential numbers**. The digital system will adopt the same numbering from one reserved book (mirror mode).
* Each book corresponds to a **Range** that covers a specific year’s numbers.
* When all numbers are used, the system must block further issuance until a **new range** is assigned.

---

## 2) Numbering Format

| Component         | Example       | Description                                             |
| ----------------- | ------------- | ------------------------------------------------------- |
| **Year prefix**   | `2025-`       | Derived from `receipt.date` (or system date if omitted) |
| **Numeric part**  | `05071`       | From `range.next` field (zero-padded to 5 digits)       |
| **ReceiptNumber** | `2025-05071`  | Stored and displayed value                              |

### Key structure

* **PK:** `ORG#<orgId>`
* **SK:** `RCPT#<receiptNumber>`  → e.g. `RCPT#2025-05071`

This preserves human‑friendly keys while keeping DynamoDB's sort order chronological. The 5-digit zero-padding ensures proper lexicographic sorting (e.g., `2025-00001` comes before `2025-10000`).

---

## 3) Range Item Schema

```json
{
  "PK": "ORG#DATTA-SAKHARAPA",
  "SK": "RANGE#2025-A",
  "type": "range",
  "alias": "PHYS-BOOK-2025-07",
  "year": 2025,
  "start": 5071,
  "end": 6000,
  "next": 5071,
  "status": "active",       // draft|active|locked|exhausted|archived
  "version": 1,
  "createdBy": "admin-01",
  "createdAt": "2025-10-20T09:00:00Z"
}
```

**Note:** The `prefix` field has been removed. Receipt numbers always use the format `YYYY-NNNNN` where `YYYY` is the year from the range and `NNNNN` is a 5-digit zero-padded number.

**Derived field:** `remaining = end - next + 1`

### Range Status State Machine

| From | To | Trigger | Who | Reversible? | Notes |
|------|-----|---------|-----|-------------|-------|
| DRAFT | ACTIVE | Manual activate | Admin | No | Range becomes available for selection |
| ACTIVE | LOCKED | Manual lock | Admin | Yes | Pauses issuance (e.g., for audit) |
| LOCKED | ACTIVE | Manual unlock | Admin | Yes | Resumes issuance after audit |
| ACTIVE | EXHAUSTED | Auto (next > end) | System | No | Triggered when last number allocated |
| ACTIVE | ARCHIVED | End of year | Admin/Cron | No | Manual retirement of unused ranges |
| EXHAUSTED | ARCHIVED | Manual archive | Admin | No | Cleanup of completed ranges |

---

## 4) Issuance Flow

### 4.1 Preflight Validation (Server)

When `POST /receipts` is invoked:

1. Determine `year` from request body (`date`) or system clock.
2. Resolve the **active range** (from header `X-Range-Id` or session context).
3. **Check year match:**
   - **Strict mode** (default for issuers): if `range.year != year` → return `409 YEAR_MISMATCH`
   - **Flexible mode** (admin only): Can override year check via `X-Admin-Override: true` header
   - Admin overrides are logged to audit trail with reason
4. **Check exhaustion:** if `range.next > range.end` or `status != 'active'` → return `409 NEED_NEW_RANGE`.
5. Proceed with allocation transact write if valid.

#### Year Mismatch Scenarios

| Scenario | Default Behavior | Admin Override Available? |
|----------|------------------|--------------------------|
| Same year, earlier date (e.g., 2025-09-15 when today is 2025-10-26) | ✅ Allowed | N/A |
| Different year (e.g., 2024 receipt with 2025 range) | ❌ YEAR_MISMATCH | ✅ Yes (with audit log) |
| Backdating to previous year | ❌ YEAR_MISMATCH | ✅ Yes (select archived range) |
| Year rollover edge case (submit spans midnight) | Uses receipt.date year | ✅ Yes (if mismatch occurs) |

### 4.2 TransactWrite Allocation

* **Update Range**: increment `next`, optimistic lock on `version`.
* **Put Receipt**: set `receiptNumber = <year>-<next>`, conditionally ensure it doesn't exist.
* **Optional AuditEvent**: record allocation delta.

---

## 5) Error Codes & Responses

| Code             | HTTP | Condition                              | Example Payload                                                                                                                                                     |
| ---------------- | ---- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEED_NEW_RANGE` | 409  | Range exhausted or not active          | `{ "code":"NEED_NEW_RANGE", "year":2025, "rangeId":"RANGE#2025-A", "remaining":0, "suggested":[{"rangeId":"RANGE#2025-B","alias":"DIGI-2025-B","remaining":845}] }` |
| `YEAR_MISMATCH`  | 409  | Active range belongs to different year | `{ "code":"YEAR_MISMATCH", "rangeYear":2025, "receiptYear":2024 }`                                                                                                  |
| `RANGE_LOCKED`   | 423  | Range status = locked                  | `{ "code":"RANGE_LOCKED", "alias":"DIGI-2025-A" }`                                                                                                                  |

---

## 6) Client & UX Behavior

### When `NEED_NEW_RANGE`

* API response triggers banner: “Current book is exhausted. Please select a new range for **2025**.”
* Redirect user to `/home` with filter `year=2025`.
* Disable `/issue` route until new range selected.

### When `YEAR_MISMATCH`

* Prompt: “Selected range belongs to **2025**, but receipt date is **2024**.”
* Options: change date or (admin) select an older range.

### Range Selection Screen

* Filter visible ranges by `status=active` and `year=currentYear()`.
* Display `remaining` numbers, warn when `< threshold (50)`.
* Preselect range assigned to user/device if present.

---

## 7) DynamoDB Item Shapes (Receipts)

```json
{
  "PK": "ORG#DATTA-SAKHARAPA",
  "SK": "RCPT#2025-05071",
  "type": "receipt",
  "rangeId": "RANGE#2025-A",
  "year": 2025,
  "num": 5071,
  "receiptNumber": "2025-05071",
  "date": "2025-10-20",
  "issuedAt": "2025-10-20T09:30:00Z",
  "issuedBy": "issuer-17",
  "status": "issued",
  "total": 600,
  "GSI1PK": "DONOR#D_9060a3eb27cb",
  "GSI1SK": "DATE#2025-10-20#RCPT#2025-05071",
  "GSI2PK": "DATE#2025-10-20",
  "GSI2SK": "RCPT#2025-05071"
}
```

### Receipt Status Values

| Status | Description | Number Consumed? | Visible in Reports? |
|--------|-------------|------------------|---------------------|
| `issued` | Normal receipt | ✅ Yes | ✅ Yes |
| `voided` | Admin cancelled/discarded | ✅ Yes (audit trail) | ⚠️ Yes (marked as void) |

**Note:** Voided receipts preserve the number allocation for audit purposes. The receipt number is never reused.

---

## 8) Receipt Void/Discard (Admin Only)

### Purpose
Allow administrators to cancel/void receipts that were issued in error, while preserving audit trail and number allocation.

### API Endpoint

**`POST /receipts/{receiptNumber}/void`**

**Request Headers:**
- `X-Admin-Token: <admin-jwt>`
- `X-User-Id: <admin-user-id>`

**Request Body:**
```json
{
  "reason": "Duplicate entry",
  "notes": "Receipt was created twice for same donation"
}
```

**Response (200 OK):**
```json
{
  "receiptNumber": "2025-05071",
  "status": "voided",
  "voidedAt": "2025-10-26T14:30:00Z",
  "voidedBy": "admin-01",
  "reason": "Duplicate entry"
}
```

### Implementation Logic

1. **Validate**: Ensure receipt exists and status is `issued`
2. **Update Receipt**: Set `status='voided'`, add void metadata
3. **Audit Log**: Record void action with timestamp, admin ID, reason
4. **PDF Annotation**: Mark PDF as "VOIDED" (watermark or stamp)
5. **Range Counter**: Do NOT decrement `range.next` (number stays consumed)

### Receipt Schema After Void

```json
{
  "PK": "ORG#DATTA-SAKHARAPA",
  "SK": "RCPT#2025-05071",
  "status": "voided",
  "voidedAt": "2025-10-26T14:30:00Z",
  "voidedBy": "admin-01",
  "voidReason": "Duplicate entry",
  "voidNotes": "Receipt was created twice for same donation"
}
```

### UI/UX Behavior

- **Reports**: Voided receipts shown with strikethrough or "VOID" badge
- **PDFs**: Original PDF retained with "VOIDED" watermark overlay
- **Search**: Voided receipts still searchable but visually distinct
- **Permissions**: Only admins can void receipts
- **Confirmation**: Requires explicit confirmation before voiding

### Constraints

- ❌ Cannot void a receipt that is already voided
- ❌ Cannot "un-void" a receipt (permanent action)
- ❌ Voiding does NOT free up the receipt number for reuse
- ✅ Original receipt data preserved for audit compliance

---

## 9) Range Exhaustion Detection Logic

* Range declared exhausted when `next > end`.
* Server sets `status='exhausted'` automatically after failed transaction.
* Background cleanup job (or admin API) can periodically scan for `status='active' AND remaining < 10` to alert admin.

---

## 10) API Additions

| Endpoint                            | Method | Description                                            |
| ----------------------------------- | ------ | ------------------------------------------------------ |
| `/ranges?status=active&year=YYYY`   | GET    | List active ranges for a year                          |
| `/ranges/{id}/status`               | GET    | Return {remaining, status, year}                       |
| `/session/activeRange`              | POST   | Set active range for session                           |
| `/receipts`                         | POST   | Issue new receipt; checks exhaustion before allocation |
| `/receipts/{receiptNumber}/void`    | POST   | Void a receipt (admin only)                            |

---

## 11) Monitoring & Alerts

* Metric: `RangeNextDistance = end - next + 1`
* Alarm: when `< 50`, trigger SNS/email “Range nearly exhausted.”
* Metric: `RangeExhausted` counter increments when status transitions to exhausted.
* CloudWatch logs include `orgId, rangeId, receiptNumber, code` for each failure path.

---

## 12) Migration & Cutover (Summary)

1. For each year, create one or more Range items (`year`, `start`, `end`, `next`, `status='active'`).
2. Assign one to the digital system; retire that physical book.
3. Deploy updated `/receipts` handler with preflight logic.
4. Monitor `RangeNextDistance` and switch ranges as needed.

---

**Result:** The system enforces per‑year numbering discipline, mirrors physical books safely, and gracefully handles range exhaustion through user prompts and API feedback.
