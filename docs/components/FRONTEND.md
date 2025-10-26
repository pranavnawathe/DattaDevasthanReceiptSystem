# Frontend Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Styling & Theming](#styling--theming)
8. [Form Validation](#form-validation)
9. [Build & Deployment](#build--deployment)
10. [Future Enhancements](#future-enhancements)

## Overview

The frontend is a modern **React Single Page Application (SPA)** built with Vite and styled with Tailwind CSS. It provides a bilingual (Marathi + English) interface for temple committee members to create donation receipts.

**Location**: `ui/`

**Live URL**: http://datta-devasthan-receipts.s3-website.ap-south-1.amazonaws.com

## Project Structure

```
ui/
├── src/
│   ├── components/              # React components
│   │   ├── Header.tsx           # Page header with title
│   │   ├── DonationForm.tsx     # Main receipt creation form
│   │   └── ReceiptDisplay.tsx   # Success screen with download
│   ├── services/
│   │   └── api.ts               # API client for backend
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   ├── validators.ts        # Form validation logic
│   │   └── formatters.ts        # Date and currency formatters
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles + Tailwind
├── public/
│   └── vite.svg                 # Favicon
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## Technology Stack

### Core Framework
- **React 18.3** - UI library with hooks
- **TypeScript 5.6** - Type safety
- **Vite 7.1** - Build tool and dev server
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - ESM-first approach

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
  - Custom temple theme colors
  - Responsive design utilities
  - JIT (Just-In-Time) compilation

### Additional Libraries
- **React Hooks** - useState for state management
- **Fetch API** - HTTP client (native browser API)

## Component Architecture

### Component Hierarchy

```
App
├── Header
└── (Conditional Rendering)
    ├── DonationForm (if !receipt)
    └── ReceiptDisplay (if receipt)
```

### 1. App Component

**File**: `src/App.tsx`

**Purpose**: Root component, manages receipt state and routing

```typescript
function App() {
  const [receipt, setReceipt] = useState<CreateReceiptResponse | null>(null);

  const handleSuccess = (newReceipt: CreateReceiptResponse) => {
    setReceipt(newReceipt);
  };

  const handleNewReceipt = () => {
    setReceipt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 to-primary/5">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!receipt ? (
          <DonationForm onSuccess={handleSuccess} />
        ) : (
          <ReceiptDisplay receipt={receipt} onNewReceipt={handleNewReceipt} />
        )}
      </main>
    </div>
  );
}
```

**State**:
- `receipt`: Holds the created receipt data (null initially)

**Flow**:
1. Initially shows `DonationForm`
2. On successful submission → shows `ReceiptDisplay`
3. User clicks "New Receipt" → returns to `DonationForm`

### 2. Header Component

**File**: `src/components/Header.tsx`

**Purpose**: Page header with temple name and title

```typescript
export function Header() {
  return (
    <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center marathi">
          श्री दत्त देवस्थान कोंडगांव
        </h1>
        <p className="text-center text-white/90 mt-2 text-lg">
          Shri Datta Devasthan, Kondgaon
        </p>
        <p className="text-center text-white/80 mt-1 text-sm">
          <span className="marathi">देणगी पावती व्यवस्थापन</span> / Donation Receipt Management
        </p>
      </div>
    </header>
  );
}
```

### 3. DonationForm Component

**File**: `src/components/DonationForm.tsx`

**Purpose**: Main form for creating receipts

**State Variables**:
```typescript
// Donor information
const [name, setName] = useState('');
const [mobile, setMobile] = useState('');
const [pan, setPan] = useState('');
const [email, setEmail] = useState('');

// Donation details
const [date, setDate] = useState(getTodayIST());
const [breakup, setBreakup] = useState<Record<string, number>>({});

// Payment information
const [paymentMode, setPaymentMode] = useState<'CASH' | 'CHEQUE' | 'ONLINE' | 'CARD'>('CASH');
const [paymentRef, setPaymentRef] = useState('');

// UI state
const [errors, setErrors] = useState<FormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitError, setSubmitError] = useState<string | null>(null);
```

**Key Functions**:

```typescript
// Handle donation breakup changes (fixed bug with amount parsing)
const handleBreakupChange = (category: string, value: string) => {
  if (value === '' || value === null || value === undefined) {
    setBreakup(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    return;
  }

  const amount = parseFloat(value);
  if (isNaN(amount) || amount <= 0) {
    setBreakup(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    return;
  }

  setBreakup(prev => ({ ...prev, [category]: amount }));
};

// Calculate total from breakup
const calculateTotal = (): number => {
  return Object.values(breakup).reduce((sum, val) => sum + val, 0);
};

// Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitError(null);

  // Validate
  const donorErrors = validateDonorInfo({ name, mobile, pan, email });
  const breakupError = validateBreakup(breakup);
  const paymentError = validatePayment({ mode: paymentMode, reference: paymentRef });

  if (Object.keys(allErrors).length > 0) {
    setErrors(allErrors);
    return;
  }

  setIsSubmitting(true);

  try {
    const request: CreateReceiptRequest = {
      donor: {
        name: name.trim(),
        ...(mobile && { mobile }),
        ...(pan && { pan: pan.toUpperCase() }),
        ...(email && { email }),
      },
      breakup,
      payment: {
        mode: paymentMode,
        ...(paymentRef && { reference: paymentRef }),
      },
      date,
      eligible80G: false, // Hardcoded (org not eligible)
    };

    const response = await api.createReceipt(request);
    onSuccess(response);
    resetForm();
  } catch (error) {
    setSubmitError(error instanceof Error ? error.message : 'Failed to create receipt');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Form Sections**:

1. **Donor Information**:
   - Name (required)
   - Mobile (optional, 10 digits)
   - PAN (optional, 10 chars)
   - Email (optional)

2. **Donation Details**:
   - Date (defaults to today)
   - Breakup by category:
     - कार्यम निधी / Temple General
     - उत्सव देणगी / Festival
     - धार्मिक कार्य / Religious Activities
     - अन्नदान / Annadaan
     - इतर / Other
   - Total (auto-calculated)

3. **Payment Information**:
   - Mode (Cash/UPI/Cheque/Online/Card)
   - Reference number (conditional on mode)

### 4. ReceiptDisplay Component

**File**: `src/components/ReceiptDisplay.tsx`

**Purpose**: Success screen with download button

```typescript
export function ReceiptDisplay({ receipt, onNewReceipt }: ReceiptDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const downloadUrl = await api.getReceiptDownloadUrl(receipt.receiptNo);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download receipt';
      setDownloadError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-secondary marathi">
        पावती यशस्वीरित्या तयार झाली!
      </h2>
      <p className="text-gray-600">Receipt Created Successfully</p>

      {/* Receipt Number */}
      <div className="bg-accent/10 rounded-lg p-6">
        <p className="text-sm text-gray-600 marathi">पावती क्रमांक / Receipt Number</p>
        <p className="text-3xl font-bold text-secondary mt-2">{receipt.receiptNo}</p>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-md"
      >
        {isDownloading ? 'Downloading...' : 'Download PDF / पीडीएफ डाउनलोड करा'}
      </button>

      {/* Download Error */}
      {downloadError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700 text-sm">{downloadError}</p>
        </div>
      )}

      {/* New Receipt Button */}
      <button
        onClick={onNewReceipt}
        className="text-primary hover:underline font-semibold"
      >
        <span className="marathi">नवीन पावती</span> / Create New Receipt
      </button>
    </div>
  );
}
```

## State Management

### Approach: Local Component State

**Why not Redux/Zustand?**
- Simple application with minimal shared state
- Only two screens with linear flow
- Parent-child communication sufficient
- No complex async state synchronization

**Current Pattern**:
```
App (receipt state)
 ├─ DonationForm (form state)
 └─ ReceiptDisplay (download state)
```

**Future Consideration**:
- If adding donor search, history, analytics → consider Context API or Zustand

## API Integration

### API Client

**File**: `src/services/api.ts`

```typescript
const API_BASE_URL = 'https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createReceipt(data: CreateReceiptRequest): Promise<CreateReceiptResponse> {
    const response = await fetch(`${this.baseUrl}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        error: `HTTP ${response.status}`,
      }));
      throw new Error(errorData.error || 'Failed to create receipt');
    }

    return response.json();
  }

  async getReceiptDownloadUrl(receiptNo: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/receipts/${receiptNo}/download`);

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.downloadUrl) {
      throw new Error('Invalid response from server');
    }

    return data.downloadUrl;
  }

  async checkHealth(): Promise<{ status: string; timestamp: number }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);
```

**Error Handling**:
- Network errors caught and displayed to user
- HTTP errors parsed from response JSON
- Fallback error messages for unknown errors

## Styling & Theming

### Tailwind Configuration

**File**: `tailwind.config.js`

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',    // Orange (temple theme)
        secondary: '#004E89',  // Dark blue
        accent: '#F7931E',     // Gold
        error: '#DC2626',      // Red
      },
      fontFamily: {
        marathi: ['Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Global Styles

**File**: `src/index.css`

```css
@import 'tailwindcss';

/* Marathi text styling */
.marathi {
  font-family: 'Noto Sans Devanagari', sans-serif;
  font-weight: 500;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

### Responsive Design

```jsx
{/* Mobile-first approach with Tailwind */}
<div className="
  container mx-auto
  px-4           {/* Padding for mobile */}
  max-w-4xl      {/* Max width for desktop */}
  py-8           {/* Vertical padding */}
">
  {/* Content */}
</div>
```

## Form Validation

### Validators

**File**: `src/utils/validators.ts`

```typescript
export function validateDonorInfo(donor: {
  name: string;
  mobile?: string;
  pan?: string;
  email?: string;
}): FormErrors {
  const errors: FormErrors = {};

  // Name validation (required, min 2 chars)
  if (!donor.name || donor.name.trim().length < 2) {
    errors.name = 'कृपया वैध नाव प्रविष्ट करा / Please enter a valid name (min 2 chars)';
  }

  // Mobile validation (optional, 10 digits if provided)
  if (donor.mobile && !/^\d{10}$/.test(donor.mobile)) {
    errors.mobile = 'कृपया वैध मोबाईल नंबर प्रविष्ट करा / Please enter a valid 10-digit mobile number';
  }

  // PAN validation (optional, format if provided)
  if (donor.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(donor.pan.toUpperCase())) {
    errors.pan = 'कृपया वैध PAN नंबर प्रविष्ट करा / Please enter a valid PAN (e.g., ABCDE1234F)';
  }

  // Email validation (optional, format if provided)
  if (donor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email)) {
    errors.email = 'कृपया वैध ईमेल प्रविष्ट करा / Please enter a valid email address';
  }

  return errors;
}

export function validateBreakup(breakup: Record<string, number>): string | null {
  const total = Object.values(breakup).reduce((sum, val) => sum + val, 0);

  if (total <= 0) {
    return 'कृपया किमान एक देणगी रक्कम प्रविष्ट करा / Please enter at least one donation amount';
  }

  return null;
}

export function validatePayment(payment: {
  mode: string;
  reference?: string;
}): string | null {
  // Reference required for CHEQUE and ONLINE
  if ((payment.mode === 'CHEQUE' || payment.mode === 'ONLINE') && !payment.reference) {
    return 'कृपया संदर्भ क्रमांक प्रविष्ट करा / Please enter a reference number';
  }

  return null;
}
```

### Validation UX

```jsx
{/* Field with error */}
<input
  className={`
    w-full px-3 py-2 border rounded-md
    focus:ring-2 focus:ring-primary focus:border-primary
    ${errors.name ? 'border-error' : 'border-gray-300'}
  `}
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
{errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
```

## Build & Deployment

### Development

```bash
cd ui

# Install dependencies
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Type check
npm run type-check
```

### Production Build

```bash
# Build for production
npm run build

# Output: dist/
# - index.html
# - assets/
#   - index-[hash].js
#   - index-[hash].css
```

### Deployment to S3

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://datta-devasthan-receipts/ --delete --profile temple-admin

# Verify
open http://datta-devasthan-receipts.s3-website.ap-south-1.amazonaws.com
```

### Build Configuration

**File**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

## Future Enhancements

### Planned Features

1. **Donor Search**
   - Search by name, mobile, PAN
   - Auto-fill donor info from history
   - Display past donations

2. **Receipt History**
   - List all receipts
   - Filter by date range
   - Search by receipt number

3. **Analytics Dashboard**
   - Monthly/yearly donation summary
   - Category-wise breakdown
   - Top donors

4. **Multi-language Support**
   - i18n library integration
   - Language switcher
   - Persistent language preference

5. **PWA Features**
   - Offline support
   - Install as app
   - Push notifications

6. **Print Preview**
   - In-browser PDF preview
   - Print directly without download
   - Batch printing

### Technical Improvements

- **State Management**: Add Zustand for global state
- **Testing**: Add Jest + React Testing Library
- **E2E Testing**: Playwright or Cypress
- **Error Boundary**: React error boundaries for graceful failures
- **Loading States**: Skeleton screens for better UX
- **Caching**: Service worker for offline support
- **Analytics**: Google Analytics or Plausible

---

**Last Updated**: October 26, 2025
**Version**: 1.0
