# Export Feature Documentation

## Overview

The Export feature allows committee members to export donation receipt data in CSV format for integration with Tally accounting software and Excel analysis.

**Status**: ✅ Implemented (Version 1.3)

## Features

### CSV Export for Tally Integration
- Export receipts for a date range (up to 1 year)
- Optional filtering by range ID
- Option to include/exclude voided receipts
- Tally-compatible CSV format with proper date formatting (DD-MM-YYYY)
- Automatic file download with descriptive filename

### Data Included in Export
1. **Date** - Receipt date (DD-MM-YYYY format for Tally)
2. **Receipt No** - Receipt number (e.g., 2025-00001)
3. **Donor Name** - Full donor name
4. **Mobile** - Donor mobile number
5. **PAN** - Donor PAN (if available)
6. **Amount** - Total donation amount
7. **Payment Mode** - CASH, UPI, CHEQUE, etc.
8. **Payment Ref** - UPI ID, Cheque Number, etc.
9. **Purpose Breakup** - JSON string of purpose → amount mapping
10. **Eligible 80G** - Yes/No flag
11. **Narration** - Auto-generated description for Tally

## API Specification

### Export Endpoint

**POST** `/receipts/export`

**Request Body**:
```json
{
  "format": "csv",           // Currently only "csv" supported
  "startDate": "2025-01-01", // yyyy-mm-dd format
  "endDate": "2025-01-31",   // yyyy-mm-dd format
  "rangeId": "2025-A",       // Optional: filter by range
  "includeVoided": false     // Optional: include voided receipts
}
```

**Response**:
```json
{
  "success": true,
  "format": "csv",
  "fileName": "receipts_export_2025-01-01_to_2025-01-31.csv",
  "content": "Date,Receipt No,Donor Name,...\n01-01-2025,2025-00001,John Doe,...",
  "recordCount": 150,
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing required fields or invalid date format
- `400 Bad Request` - Date range exceeds 1 year
- `400 Bad Request` - Start date after end date
- `500 Internal Server Error` - Server error

## Frontend UI

### Export Page (`/ui/src/pages/ExportData.tsx`)

**Route**: `#export`

**Features**:
- **Format Selection**: CSV (Tally/Excel) - Excel coming soon
- **Quick Date Presets**:
  - Today
  - This Month
  - Last Month
  - This Year
- **Date Range Picker**: Custom start and end dates
- **Range Filter**: Optional filter by range ID
- **Include Voided**: Checkbox to include voided receipts
- **Bilingual UI**: Marathi + English labels throughout

**User Flow**:
1. User clicks "निर्यात करा / Export" from Admin Home
2. Selects export format (CSV)
3. Choose date range using presets or custom dates
4. Optionally specify range ID to filter
5. Optionally include voided receipts
6. Click "निर्यात करा / Export" button
7. CSV file downloads automatically

**File Naming Convention**:
- Single date: `receipts_export_2025-01-15.csv`
- Date range: `receipts_export_2025-01-01_to_2025-01-31.csv`
- With range filter: `receipts_export_2025-01-01_to_2025-01-31_2025-A.csv`

## Backend Implementation

### Files Modified/Created

**New Files**:
- `lambda/common/services/export-service.ts` - Export logic and CSV generation

**Modified Files**:
- `lambda/common/types.ts` - Added `ExportRequest` and `ExportResponse` types
- `lambda/receipts/index.ts` - Added POST `/receipts/export` route
- `lib/api-stack.ts` - Added export route to API Gateway

### Export Service (`export-service.ts`)

**Key Functions**:

1. **`generateExport()`** - Main export function
   - Validates date range (max 1 year)
   - Fetches all receipts in date range (with pagination)
   - Filters by range ID if specified
   - Generates CSV content
   - Returns export result

2. **`generateCSV()`** - CSV generation
   - Creates Tally-compatible CSV with headers
   - Escapes special characters (commas, quotes, newlines)
   - Formats dates as DD-MM-YYYY for Tally
   - Generates narration field automatically

3. **`validateDateRange()`** - Date validation
   - Validates date format (yyyy-mm-dd)
   - Ensures start date ≤ end date
   - Limits range to 1 year maximum

### CSV Column Mapping

The CSV is designed for direct import into Tally:

| Column | Description | Example |
|--------|-------------|---------|
| Date | Receipt date (DD-MM-YYYY) | 15-01-2025 |
| Receipt No | Receipt number | 2025-00123 |
| Donor Name | Full name | श्री रमेश पाटील |
| Mobile | Phone number | +919876543210 |
| PAN | PAN number (optional) | ABCDE**** |
| Amount | Total amount (2 decimal) | 5000.00 |
| Payment Mode | Payment method | UPI |
| Payment Ref | UPI ID/Cheque no | user@ybl |
| Purpose Breakup | JSON of purposes | {"GENERAL":5000} |
| Eligible 80G | Tax eligibility | Yes |
| Narration | Auto-generated | Receipt 2025-00123 - श्री रमेश पाटील - GENERAL |

## Deployment

### CDK Changes

**API Gateway Route Added**:
```typescript
httpApi.addRoutes({
  path: '/receipts/export',
  methods: [apigwv2.HttpMethod.POST],
  integration: receiptsIntegration
});
```

**Permissions**: No new permissions required (uses existing DynamoDB read access)

### Environment Variables

No new environment variables required.

## Testing

### Manual Testing

1. **Export Today's Receipts**:
```bash
curl -X POST https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com/receipts/export \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "startDate": "2025-10-30",
    "endDate": "2025-10-30"
  }'
```

2. **Export Month with Range Filter**:
```bash
curl -X POST https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com/receipts/export \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "startDate": "2025-10-01",
    "endDate": "2025-10-31",
    "rangeId": "2025-H"
  }'
```

3. **Export with Voided Receipts**:
```bash
curl -X POST https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com/receipts/export \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "includeVoided": true
  }'
```

### Expected Behavior

✅ **Success Case**:
- Returns CSV content with all receipts
- Proper CSV escaping (quotes, commas)
- Dates in DD-MM-YYYY format
- Record count matches data
- File downloads automatically in UI

❌ **Error Cases**:
- Missing startDate/endDate → 400 error
- Invalid date format → 400 error
- Start date > end date → 400 error
- Date range > 1 year → 400 error

## Performance Considerations

### Pagination
- Backend fetches receipts in batches of 100
- Continues until all receipts are fetched
- Suitable for exports up to ~10,000 receipts

### Chunking for Large Date Ranges
- For date ranges > 31 days, the system automatically breaks into 30-day chunks
- Each chunk is queried separately and results are combined
- This works around the receipt-listing service's 31-day limit
- Transparent to the user - single CSV file is returned

### Limits
- **Date Range**: Maximum 1 year (365 days)
- **Record Count**: No hard limit, but recommended < 50,000 records
- **Timeout**: Lambda timeout 10 seconds (sufficient for most cases)
- **Chunk Size**: 30 days per chunk for ranges > 31 days

### Optimization Opportunities (Future)
- Stream CSV generation for large exports
- Save exports to S3 and provide download link
- Background job for exports > 10,000 records

## Future Enhancements

### Phase 2 (Planned)
- ✅ CSV export (implemented)
- ⏳ Excel (.xlsx) export with formatting
- ⏳ Save exports to S3 with expiring links
- ⏳ Schedule recurring exports (e.g., monthly)
- ⏳ Email export file to admin
- ⏳ Custom column selection
- ⏳ Export templates (Tally, QuickBooks, etc.)

## Security Considerations

1. **Access Control**: Currently no auth (to be added in Phase 3)
2. **Data Sensitivity**: PAN is already masked in database
3. **Download Security**: Files downloaded client-side (not stored)
4. **CORS**: Enabled for all origins (restrict in production)

## Troubleshooting

### Common Issues

**Issue**: "Export range cannot exceed 1 year"
- **Solution**: Reduce date range to maximum 365 days or split into multiple exports

**Issue**: No data returned (empty CSV)
- **Solution**: Check if receipts exist for selected date range and range ID

**Issue**: "Date range too large (max 31 days)" (FIXED in v1.3.1)
- **Old Issue**: Exports failed for ranges > 31 days
- **Fix**: System now automatically chunks large ranges into 30-day segments
- **Status**: ✅ Fixed - exports now support up to 1 year

**Issue**: CSV has garbled characters
- **Solution**: Open in Excel with UTF-8 encoding or use Google Sheets

**Issue**: Download not starting
- **Solution**: Check browser popup blocker settings

## Related Documentation

- [Backend API Documentation](BACKEND.md)
- [Frontend UI Documentation](ADMIN_HOME.md)
- [Data Model](../DATA_MODEL.md)
- [Tally Integration Guide](../guides/TALLY_INTEGRATION.md) (to be created)

---

**Last Updated**: October 30, 2025
**Version**: 1.3
