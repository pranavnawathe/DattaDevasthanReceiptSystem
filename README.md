# Datta Devasthan Receipt System

A bilingual (Marathi + English) donation receipt management system for Shri Datta Devasthan temple, built with AWS serverless architecture and React.

## Overview

This system enables committee members to enter donation details and generate professional bilingual e-receipts as PDFs that can be printed, emailed, or shared via WhatsApp.

## Repository Structure

```
DattaDevasthanReceiptSystem/
├── TempleReceiptSystem/          # Backend (AWS CDK Infrastructure)
│   └── TempleReceiptSystemCDK/
│       ├── bin/                   # CDK app entry point
│       ├── lib/                   # CDK stacks (Foundation, API, UI)
│       └── lambda/                # Lambda function code
│           ├── receipts/          # Receipt API handlers
│           └── common/            # Shared utilities and services
├── ui/                            # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── services/             # API client
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Validators and formatters
├── test-files/                   # Local test PDFs (not committed)
├── CLAUDE.md                     # AI assistant instructions
└── UI_DEMO_GUIDE.md             # User guide for the application
```

## Features

### Receipt Generation
- **Bilingual PDFs**: Marathi (देवनागरी) and English on same receipt
- **Traditional Format**: Matches existing temple receipt design
- **Auto-numbering**: Year-based sequential receipt numbers (2025-00001, etc.)
- **Amount in Words**: Supports Indian numbering (Lakh, Crore) in both languages
- **Multiple Payment Modes**: Cash, UPI, Cheque, NEFT, RTGS, Card
- **Pre-defined Categories**: Temple General, Festival, Religious Activities, Annadaan, Other

### Technical Features
- **Secure Downloads**: S3 presigned URLs (1-hour expiry)
- **Donor Management**: Automatic deduplication by phone/PAN/email
- **Type Safety**: Full TypeScript throughout
- **Serverless**: AWS Lambda + DynamoDB + S3
- **Responsive UI**: Works on desktop and mobile

## Technology Stack

### Backend
- **AWS CDK v2** - Infrastructure as Code
- **Node.js 20.x** - Lambda runtime (ARM64/Graviton2)
- **DynamoDB** - NoSQL database with GSI indexes
- **S3** - Receipt PDF storage
- **API Gateway HTTP API** - RESTful endpoints
- **PDFKit** - PDF generation with Noto Sans Devanagari font

### Frontend
- **React 18** - UI framework
- **Vite 7** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first styling
- **TypeScript 5.9** - Type safety

## Getting Started

### Prerequisites
- Node.js 20.x or later
- AWS CLI configured with credentials
- AWS CDK CLI: `npm install -g aws-cdk`
- An AWS account (deployed to ap-south-1 Mumbai region)

### Quick Start - Deploy Everything

```bash
# One command to build UI and deploy all stacks
./deploy.sh

# This script will:
# 1. Build the UI (npm run build in ui/)
# 2. Deploy all CDK stacks (Foundation, API, UI)
# 3. Automatically upload UI files to S3 via CDK
```

### Manual Backend Setup

```bash
cd TempleReceiptSystem/TempleReceiptSystemCDK

# Install dependencies
npm install

# Install Lambda function dependencies
cd lambda/receipts && npm install
cd ../common && npm install
cd ../..

# Build TypeScript
npm run build

# Deploy to AWS (requires AWS credentials)
# Note: This also deploys the UI from ui/dist
npx cdk deploy --all --profile temple-admin
```

### Frontend Development

```bash
cd ui

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

### Current Deployment
- **Backend API**: https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com
- **Frontend UI**: http://datta-devasthan-receipts.s3-website.ap-south-1.amazonaws.com
- **AWS Region**: ap-south-1 (Mumbai)
- **AWS Account**: 671924214635

### Deploy Backend
```bash
cd TempleReceiptSystem/TempleReceiptSystemCDK
npx cdk deploy --all --require-approval never --profile temple-admin
```

### Deploy Frontend
```bash
cd ui
npm run build
aws s3 sync dist/ s3://datta-devasthan-receipts/ --delete --profile temple-admin
```

## API Endpoints

- `GET /health` - Health check
- `POST /receipts` - Create new receipt
- `GET /receipts/{receiptNo}/download` - Get presigned download URL

## Development

### Running Tests
```bash
cd TempleReceiptSystem/TempleReceiptSystemCDK/lambda/common
npm test
```

### Local Development
```bash
# Terminal 1: Run UI dev server
cd ui
npm run dev

# Terminal 2: Make backend changes and deploy
cd TempleReceiptSystem/TempleReceiptSystemCDK
npm run build
npx cdk deploy TempleApiStack
```

## Data Model

### DynamoDB Single-Table Design
- **PK**: `ORG#<orgId>` - Organization partition
- **SK**: `RCPT#<receiptNo>` | `DONOR#<donorId>` - Sort key
- **GSI1**: Donor lookups (donorId → receipts)
- **GSI2**: Date range queries (date → receipts)

### Receipt Number Format
- Pattern: `YYYY-NNNNN` (e.g., 2025-00001)
- Auto-incrementing counter per year
- Resets to 1 on January 1st each year

## Project History

This project consolidates two previously separate repositories:
- [TempleReceiptSystemCDK](https://github.com/pranavnawathe/TempleReceiptSystemCDK) - Backend infrastructure
- [TempleReceiptSystemUI](https://github.com/pranavnawathe/TempleReceiptSystemUI) - Frontend application

Both have been merged into this monorepo for easier management and development.

## Documentation

### 📚 Complete Documentation
See **[docs/README.md](docs/README.md)** for the full documentation index.

### Quick Links
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Comprehensive project summary
- **[Project Status & Roadmap](docs/PROJECT_STATUS.md)** - Current status and future plans
- **[System Architecture](docs/architecture/ARCHITECTURE.md)** - Technical architecture deep-dive
- **[Backend Documentation](docs/components/BACKEND.md)** - Backend technical reference
- **[Frontend Documentation](docs/components/FRONTEND.md)** - Frontend technical reference
- **[User Guide](UI_DEMO_GUIDE.md)** - User manual with screenshots
- **[AI Assistant Guide](CLAUDE.md)** - Claude Code project instructions

## Future Enhancements

- CSV/Excel export for Tally accounting integration
- Email notifications to donors
- WhatsApp integration for sharing receipts
- Advanced donor search and analytics
- Multi-organization support
- Audit trail and logging

## License

Private project for Shri Datta Devasthan, Kondgaon (Sakharpa), Maharashtra, India.

## Contributors

Built with assistance from [Claude Code](https://claude.com/claude-code)

---

**Registration Details**: रजि. क्र. अे/१२६/रत्नागिरी
**Temple**: श्री दत्त देवस्थान कोंडगांव (साखरपा)
