# Specification: Sequential Receipt IDs

## Overview

Replace the range-based receipt numbering system with a simple sequential counter per financial year. Remove all range management code, UI, and API.

## Receipt Number Format

| Aspect | Value | Example |
|--------|-------|---------|
| **Display format** (PDF) | `NNNNN/YYYY-YY` | `00071/2025-26` |
| **Storage format** (DB, URLs, S3) | `NNNNN-YYYY-YY` | `00071-2025-26` |
| **Digits** | 5-digit zero-padded | `00001` to `99999` |
| **Year** | Indian financial year (Apr–Mar) | `2025-26` = Apr 2025 – Mar 2026 |
| **Counter reset** | Resets to 1 each April | FY 2026-27 starts at `00001` |

### Financial Year Logic

```
if month >= April (4):
  FY = currentYear → currentYear+1
else:
  FY = currentYear-1 → currentYear

Examples:
  Feb 2026  → FY 2025-26
  Apr 2025  → FY 2025-26
  Mar 2025  → FY 2024-25
```

### Why Hyphen in Storage

The `/` character in `NNNNN/YYYY-YY` conflicts with URL path segments. Receipt numbers appear in:
- API paths: `GET /receipts/{receiptNo}/download`
- DynamoDB sort keys: `RCPT#00071-2025-26`
- S3 keys: `receipts/2025-26/00071-2025-26.pdf`

Using `-` in storage avoids encoding issues. A `displayReceiptNo()` function converts `-` → `/` for PDF rendering.

## Allocation Mechanism

### Current (Being Removed)
- Range-based: admin creates receipt ranges (e.g., 1–500), activates one at a time
- `allocateFromRange()` atomically increments `next` pointer with optimistic locking
- Requires range management UI and separate Lambda

### New (Simple Counter)
- Single DynamoDB counter per org per financial year
- `getNextReceiptNumber(orgId, financialYear)` uses atomic `UpdateExpression`:
  ```
  SET currentSeq = if_not_exists(currentSeq, :zero) + :inc
  ```
- No range management, no activation, no manual intervention
- Counter lives at: `PK: ORG#<orgId>`, `SK: COUNTER#RECEIPT#<year>`

### Concurrency Safety
The existing counter uses DynamoDB atomic updates (`if_not_exists + increment`), which guarantees unique sequence numbers even under concurrent writes. No optimistic locking or retries needed.

## DynamoDB Impact

### No Migration Required
- Existing receipts retain their `YYYY-NNNNN` format sort keys
- New receipts use `NNNNN-YYYY-YY` format sort keys
- Both coexist in the same table; no schema enforcement in DynamoDB
- Existing `RANGE#` items remain in the table (orphaned, harmless)
- `rangeId` field on old donation items is ignored

### Counter Seeding (One-Time)
Before first deployment, set the counter for the current financial year to the max existing sequence number to avoid collisions:
```
COUNTER#RECEIPT#2025 → currentSeq = <max sequence issued so far>
```

## S3 Key Structure

| Format | S3 Key |
|--------|--------|
| Old | `receipts/2025/2025-00071.pdf` |
| New | `receipts/2025-26/00071-2025-26.pdf` |

The download handler must resolve both formats for backward compatibility.

## API Changes

### Removed Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/ranges` | List ranges |
| GET | `/ranges/{rangeId}` | Get range |
| POST | `/ranges` | Create range |
| PUT | `/ranges/{rangeId}/status` | Update range status |

### Modified Endpoints
| Method | Path | Change |
|--------|------|--------|
| GET | `/receipts` | Remove `rangeId` query parameter |
| GET | `/receipts/{receiptNo}/download` | Accept both `YYYY-NNNNN` and `NNNNN-YYYY-YY` formats |
| POST | `/receipts` | Remove `flexibleMode` from request body |
| POST | `/receipts/export` | Remove `rangeId` from request body |

### Unchanged Endpoints
- `GET /health`
- `GET /receipts/search`
- `GET /receipts/donor/{donorId}`

## Request/Response Changes

### POST /receipts — Request
```diff
{
  "donor": { "name": "...", "mobile": "...", "pan": "..." },
  "breakup": { "TEMPLE_GENERAL": 500 },
  "payment": { "mode": "CASH" },
  "date": "2026-02-25",
- "flexibleMode": true
}
```

### POST /receipts — Response
```diff
{
  "success": true,
- "receiptNo": "2025-00071",
+ "receiptNo": "00071-2025-26",
  "donorId": "D_abc123",
  "total": 500,
  "pdfKey": "receipts/2025-26/00071-2025-26.pdf"
}
```

### POST /receipts/export — Request
```diff
{
  "format": "csv",
  "startDate": "2025-04-01",
  "endDate": "2026-03-31",
- "rangeId": "2025-A",
  "includeVoided": false
}
```

## PDF Changes

Receipt number display on PDF:
- Old: `पावती क्रमांक: 2025-00071`
- New: `पावती क्रमांक: 00071/2025-26` (uses `/` separator via `displayReceiptNo()`)

No other PDF layout changes.

## UI Changes

### Removed Pages/Components
- Range Management page (`#ranges` route)
- RangeCard, CreateRangeDialog, RangeSelectionModal components
- ActiveRangeContext (global range state)

### Modified Pages
| Page | Change |
|------|--------|
| **AdminHome** | Remove active range card, progress bar, range health widget, range warnings, "Range Manager" quick action. "Issue Receipt" always enabled (no range gate). |
| **App** | Remove `ranges` route, remove route guard requiring active range, remove active range banner on receipts page |
| **ExportData** | Remove "Range Filter" input field |

### Removed Infrastructure
- `RangesFn` Lambda function (api-stack.ts)
- `lambda/ranges/` directory
- Range npm ci in pipeline synth commands

## Files Changed

### Backend — Modified
- `lambda/common/utils/id-generator.ts` — new format + financial year helper
- `lambda/common/db/counter.ts` — JSDoc update only
- `lambda/common/services/donation-service.ts` — use counter instead of range allocator
- `lambda/common/services/receipt-artifact.ts` — PDF display + S3 key
- `lambda/common/services/receipt-listing.ts` — remove `listReceiptsByRange`
- `lambda/common/services/export-service.ts` — remove rangeId filter
- `lambda/common/types.ts` — remove range types
- `lambda/receipts/index.ts` — remove range query param + fix regex
- `lib/api-stack.ts` — remove ranges Lambda + routes
- `lib/pipeline-stack.ts` — remove ranges npm ci command

### Backend — Deleted
- `lambda/common/services/range-allocator.ts`
- `lambda/common/range-utils.ts`
- `lambda/ranges/` (entire directory)

### Frontend — Modified
- `ui/src/main.tsx` — remove ActiveRangeProvider
- `ui/src/App.tsx` — remove range route, range guard, range banner
- `ui/src/pages/AdminHome.tsx` — remove range card, health widget, range gate
- `ui/src/pages/ExportData.tsx` — remove range filter field
- `ui/src/types/index.ts` — remove range types
- `ui/src/services/api.ts` — remove range API methods

### Frontend — Deleted
- `ui/src/components/RangeManagement.tsx`
- `ui/src/components/RangeCard.tsx`
- `ui/src/components/CreateRangeDialog.tsx`
- `ui/src/components/RangeSelectionModal.tsx`
- `ui/src/contexts/ActiveRangeContext.tsx`

## Backward Compatibility Matrix

| Scenario | Handled? | How |
|----------|----------|-----|
| View old receipt (2025-00071) in DB | Yes | DynamoDB items unchanged |
| Download old receipt PDF | Yes | Download handler tries both S3 key formats |
| New receipt number format | Yes | `NNNNN-YYYY-YY` stored, `NNNNN/YYYY-YY` on PDF |
| Export includes old + new receipts | Yes | Export queries by date, format-agnostic |
| Old `rangeId` field on donations | Yes | Field ignored, not queried |

## Testing Plan

1. **Build**: `npm run build` (CDK root) — TypeScript compiles
2. **Unit tests**: `cd lambda/common && npm test` — tests pass
3. **Frontend build**: `cd ui && npm run build` — no errors
4. **CDK synth**: `npx cdk synth` — no range Lambda in template
5. **E2E**: Create receipt → verify `NNNNN-YYYY-YY` format
6. **E2E**: Download old-format receipt → still works
7. **E2E**: Download new-format receipt → PDF shows `NNNNN/YYYY-YY`
8. **E2E**: Export CSV → no range filter, includes both formats