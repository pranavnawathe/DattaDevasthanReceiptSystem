# Temple Receipt System - Web UI

A React-based web interface for the Temple Donation & E-Receipt Management System.

## Features

- ✅ Bilingual form (Marathi देवनागरी + English)
- ✅ Donation entry with multiple categories
- ✅ Real-time form validation
- ✅ Payment mode selection (Cash/Cheque/Online/Card)
- ✅ Receipt generation and display
- ✅ Integration with AWS backend API
- ✅ Responsive design (mobile-friendly)

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **AWS API Gateway** - Backend API

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment

The app connects to the production API:
```
https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com
```

To change the API endpoint, edit `src/services/api.ts`:
```typescript
const API_BASE_URL = 'your-api-url-here';
```

## Project Structure

```
ui/
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Temple header with branding
│   │   ├── DonationForm.tsx      # Main donation entry form
│   │   └── ReceiptDisplay.tsx    # Receipt success screen
│   ├── services/
│   │   └── api.ts                # API client
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── utils/
│   │   ├── formatters.ts         # Date, currency, phone formatting
│   │   └── validators.ts         # Form validation logic
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles + Tailwind
├── public/                       # Static assets
├── index.html                    # HTML template
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── tsconfig.json                # TypeScript configuration
```

## Usage

### Creating a Donation Receipt

1. **Enter Donor Information**:
   - Name (required)
   - Mobile number (10 digits)
   - PAN Card (optional, 10 characters)
   - Email (optional)
   - At least one identifier (mobile/PAN/email) required

2. **Enter Donation Details**:
   - Select date (defaults to today)
   - Enter amounts for donation categories
   - Total is calculated automatically
   - Check/uncheck 80G tax exemption

3. **Enter Payment Information**:
   - Select payment mode (Cash/Cheque/Online/Card)
   - Enter reference number (for Cheque/Online)

4. **Submit**:
   - Click "पावती तयार करा / Create Receipt"
   - View receipt details on success screen

## API Integration

### POST /receipts
Creates a new donation receipt.

**Request**:
```json
{
  "donor": {
    "name": "राम शिंदे",
    "mobile": "9876543210",
    "pan": "ABCDE1234F",
    "email": "ram@example.com"
  },
  "breakup": {
    "TEMPLE_GENERAL": 500,
    "EDUCATION": 100
  },
  "payment": {
    "mode": "CASH"
  }
}
```

**Response**:
```json
{
  "success": true,
  "receiptNo": "2025-00001",
  "donorId": "D_9060a3eb27cb",
  "total": 600,
  "pdfKey": "receipts/2025/2025-00001.txt",
  "createdAt": 1729332000000
}
```

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Verify API Gateway CORS settings
2. Ensure `allowOrigins: ['*']` includes `http://localhost:5173`
3. Redeploy API stack

### API Connection Failed

1. Check API URL in `src/services/api.ts`
2. Test API: `curl https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com/health`

---

**Live Demo**: http://localhost:5173 (development)
**API Endpoint**: https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com
