# Temple Receipt System - UI Implementation Plan

**Priority**: High (Demo Enablement)
**Estimated Effort**: 4-6 hours
**Target**: Simple, functional web UI for creating donations and viewing receipts

---

## Overview

Create a web-based UI for the Temple Receipt System that allows:
1. Entering donor details and donation amounts
2. Submitting donations to create receipts
3. Viewing generated receipts
4. Downloading receipt files from S3
5. Searching for existing receipts (basic)

---

## Technology Stack

### Option 1: React SPA with Vite (RECOMMENDED)
**Pros**:
- Fast development with Vite
- Modern React with hooks
- Easy to deploy to S3 + CloudFront
- TypeScript support

**Cons**:
- Need to handle CORS
- Client-side routing

### Option 2: Next.js
**Pros**:
- Built-in API routes (proxy to avoid CORS)
- SSR/SSG capabilities
- File-based routing

**Cons**:
- Heavier stack
- Need separate hosting (Vercel/AWS Amplify)

### Option 3: Simple HTML/JS (No Framework)
**Pros**:
- Simplest deployment
- No build step
- Single HTML file

**Cons**:
- Less maintainable
- Manual DOM manipulation

**DECISION**: Use **React + Vite** for balance of speed and maintainability

---

## Project Structure

```
ui/
├── public/
│   └── datta-logo.png (optional)
├── src/
│   ├── components/
│   │   ├── DonationForm.tsx          # Main donation entry form
│   │   ├── ReceiptDisplay.tsx        # Receipt preview/download
│   │   ├── ReceiptSearch.tsx         # Search existing receipts
│   │   └── Header.tsx                # App header with org info
│   ├── services/
│   │   └── api.ts                    # API client for backend
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   ├── utils/
│   │   └── formatters.ts             # Date, currency formatting
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Features Breakdown

### 1. Donation Entry Form (Priority 1)

**Fields**:
- Donor Name (required, Marathi/English support)
- Mobile Number (10 digits, auto-format to +91)
- PAN Card (optional, 10 chars, uppercase)
- Email (optional)
- Donation Date (default: today, IST)
- Donation Breakup:
  - Temple General
  - Education
  - Annadaan
  - Gaushala
  - Other (custom categories)
- Payment Mode: Cash/Cheque/Online/Card
- Cheque/Transaction Details (conditional)
- 80G Eligible (checkbox, default: true)

**Validation**:
- Name: minimum 2 characters
- Mobile: exactly 10 digits
- PAN: 5 letters + 4 digits + 1 letter (if provided)
- Email: valid format (if provided)
- At least one donation category with amount > 0
- Total > 0

**UX**:
- Real-time validation with error messages
- Auto-calculation of total
- Clear/Reset button
- Submit button (disabled until valid)
- Loading state during submission
- Success/Error alerts

### 2. Receipt Display (Priority 1)

**After successful submission**:
- Show receipt number prominently
- Display donor ID (for tracking)
- Show total amount
- Show success message
- Download receipt button (opens S3 link)
- Print button (future: PDF generation)
- Create Another Receipt button

**Receipt Preview** (optional enhancement):
- Display bilingual receipt content inline
- Formatted text from S3

### 3. Receipt Search (Priority 2)

**Search Options**:
- By Receipt Number (exact match)
- By Donor Phone Number
- By Date Range

**Results Display**:
- Table with: Receipt No, Date, Donor Name, Total, Actions
- Actions: View Details, Download Receipt
- Pagination (10 per page)

### 4. Header & Branding (Priority 3)

**Header Elements**:
- Temple logo (optional)
- Organization name: "श्री दत्त देवस्थान, साखरपा"
- Current date/time (IST)
- Language toggle (Marathi/English) - future

---

## UI Design

### Color Scheme (Temple Theme)
```css
:root {
  --primary: #FF6B35;      /* Saffron */
  --secondary: #004E89;    /* Deep blue */
  --accent: #F7B801;       /* Gold */
  --success: #06A77D;      /* Green */
  --error: #D62828;        /* Red */
  --text: #2B2D42;         /* Dark gray */
  --bg: #F8F9FA;           /* Light gray */
  --white: #FFFFFF;
}
```

### Layout
- Centered card-based design
- Maximum width: 800px
- Responsive (mobile-friendly)
- Clean, form-focused interface

### Typography
- Headings: Support Devanagari (Marathi)
- Form labels: Bilingual (Marathi + English)
- Monospace for receipt numbers

---

## API Integration

### API Client (`src/services/api.ts`)

```typescript
const API_BASE_URL = 'https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com';

export interface CreateReceiptRequest {
  donor: {
    name: string;
    mobile?: string;
    pan?: string;
    email?: string;
  };
  breakup: Record<string, number>;
  payment: {
    mode: 'CASH' | 'CHEQUE' | 'ONLINE' | 'CARD';
    reference?: string;
  };
  date?: string;
  eligible80G?: boolean;
}

export interface CreateReceiptResponse {
  success: boolean;
  receiptNo: string;
  donorId: string;
  total: number;
  pdfKey: string;
  createdAt: number;
  message: string;
}

export async function createReceipt(
  data: CreateReceiptRequest
): Promise<CreateReceiptResponse> {
  const response = await fetch(`${API_BASE_URL}/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function getReceiptDownloadUrl(pdfKey: string): Promise<string> {
  // Future: Generate presigned S3 URL
  // For now: Direct S3 URL (if bucket public) or manual download
  return `${API_BASE_URL}/receipts/download?key=${pdfKey}`;
}
```

### Error Handling
- Network errors: "Unable to connect to server"
- Validation errors: Display field-specific messages
- Server errors: Display error message from API
- Timeout handling (10 second timeout)

---

## Deployment Options

### Option 1: S3 + CloudFront (RECOMMENDED)
**Steps**:
1. Build React app: `npm run build`
2. Create S3 bucket: `temple-ui-bucket`
3. Upload `dist/` contents to S3
4. Enable static website hosting
5. Create CloudFront distribution (optional, for HTTPS)
6. Configure CORS on API Gateway

**Pros**: Serverless, cheap (~$1/month), scalable
**Cons**: Need to configure CORS, no server-side logic

### Option 2: AWS Amplify Hosting
**Steps**:
1. Connect GitHub repo
2. Configure build settings
3. Auto-deploy on push

**Pros**: CI/CD built-in, HTTPS, easy setup
**Cons**: Slightly more expensive (~$5/month)

### Option 3: Local Development Only
**Steps**:
1. Run `npm run dev`
2. Open localhost:5173

**Pros**: Fastest for demo
**Cons**: Not accessible externally

**DECISION**: Start with local dev, deploy to S3 later

---

## Implementation Steps

### Phase 1: Setup (30 min)
1. Create React app with Vite + TypeScript
   ```bash
   npm create vite@latest ui -- --template react-ts
   cd ui
   npm install
   ```

2. Install dependencies:
   ```bash
   npm install @headlessui/react @heroicons/react
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. Configure Tailwind CSS

4. Create project structure (components/, services/, types/)

### Phase 2: Donation Form (1.5 hours)
1. Create `DonationForm.tsx` component
2. Add form fields with validation
3. Implement auto-calculation for total
4. Add submit handler
5. Integrate with API client
6. Add loading and error states
7. Test with backend API

### Phase 3: Receipt Display (1 hour)
1. Create `ReceiptDisplay.tsx` component
2. Show receipt details after submission
3. Add download button (S3 link)
4. Add "Create Another" button
5. Test receipt download flow

### Phase 4: Search Functionality (1.5 hours)
1. Create `ReceiptSearch.tsx` component
2. Add search by receipt number (mock for now)
3. Add search by phone number (mock for now)
4. Display results in table
5. Add download action for each result
6. **Note**: Requires Phase 3 backend (GET endpoints)

### Phase 5: Styling & Polish (1 hour)
1. Add header with temple branding
2. Apply color scheme
3. Add bilingual labels
4. Mobile responsive design
5. Add loading spinners
6. Improve error messages

### Phase 6: CORS & Deployment (30 min)
1. Update API Gateway CORS settings
2. Build production bundle
3. Test locally with production API
4. Deploy to S3 (optional)
5. Update documentation

---

## CORS Configuration

### Update API Gateway in `lib/api-stack.ts`

```typescript
const api = new apigateway.HttpApi(this, 'TempleApi', {
  corsPreflight: {
    allowOrigins: [
      'http://localhost:5173',           // Vite dev server
      'https://temple-ui.example.com',   // Production domain
    ],
    allowMethods: [
      apigateway.CorsHttpMethod.GET,
      apigateway.CorsHttpMethod.POST,
      apigateway.CorsHttpMethod.OPTIONS,
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: cdk.Duration.days(1),
  },
});
```

**Redeploy**:
```bash
npm run deploy
```

---

## Testing Plan

### Manual Testing
1. **Happy Path**:
   - Fill all donor details
   - Enter multiple donation categories
   - Submit and verify receipt created
   - Download receipt from S3
   - Verify data in DynamoDB

2. **Validation**:
   - Submit empty form (should show errors)
   - Invalid phone (9 digits, letters)
   - Invalid PAN format
   - Zero donation amount
   - Missing required fields

3. **Edge Cases**:
   - Very long donor name (50+ chars)
   - Multiple donations for same donor
   - Special characters in name (Marathi)
   - Network error simulation

4. **Browser Testing**:
   - Chrome, Firefox, Safari
   - Mobile browsers (iOS, Android)

---

## Future Enhancements

### Phase 2 Features (Post-Demo)
- [ ] Receipt search by phone/date (needs backend Phase 3)
- [ ] Donor history view
- [ ] Receipt editing/cancellation
- [ ] Bulk receipt creation (CSV upload)
- [ ] Print-optimized receipt view

### Phase 3 Features
- [ ] PDF generation instead of text
- [ ] Email receipt directly from UI
- [ ] WhatsApp share integration
- [ ] Multi-language support (full Marathi)
- [ ] Dark mode

### Phase 4 Features
- [ ] User authentication (login/logout)
- [ ] Role-based access (admin vs operator)
- [ ] Dashboard with statistics
- [ ] Reports and analytics
- [ ] Export to Excel

---

## File Checklist

### Must Create
- [ ] `ui/package.json`
- [ ] `ui/vite.config.ts`
- [ ] `ui/tsconfig.json`
- [ ] `ui/tailwind.config.js`
- [ ] `ui/index.html`
- [ ] `ui/src/main.tsx`
- [ ] `ui/src/App.tsx`
- [ ] `ui/src/components/DonationForm.tsx`
- [ ] `ui/src/components/ReceiptDisplay.tsx`
- [ ] `ui/src/services/api.ts`
- [ ] `ui/src/types/index.ts`
- [ ] `ui/README.md`

### Optional
- [ ] `ui/src/components/ReceiptSearch.tsx` (Phase 2)
- [ ] `ui/src/components/Header.tsx`
- [ ] `ui/public/datta-logo.png`

---

## Success Criteria

✅ **Demo-Ready Definition**:
1. User can enter donor details and donation amounts
2. Form validates input and shows clear errors
3. Submit creates receipt in backend (verified in DynamoDB)
4. Success screen shows receipt number
5. User can download receipt from S3
6. UI works on desktop and mobile browsers
7. Clean, professional appearance
8. Bilingual labels (Marathi + English)

**Target**: Complete in 1 day (6-8 hours)

---

## Estimated Costs

**Development**: $0 (local)
**Hosting** (S3 + CloudFront): ~$1/month
**Domain** (optional): ~$12/year

**Total**: ~$1/month or free (local dev only)

---

## Next Steps

1. Confirm UI technology choice (React + Vite)
2. Create UI project structure
3. Implement donation form
4. Integrate with backend API
5. Test end-to-end flow
6. Add receipt display
7. Polish and style
8. Update CORS and deploy

**Ready to start implementation?**
