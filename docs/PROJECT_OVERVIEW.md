# Datta Devasthan Receipt System - Project Overview

## Executive Summary

The Datta Devasthan Receipt System is a complete donation management solution for **श्री दत्त देवस्थान कोंडगांव (साखरपा)**, a temple in Maharashtra, India. The system enables committee members to digitally record donations and generate professional bilingual (Marathi + English) e-receipts.

**Registration**: रजि. क्र. अे/१२६/रत्नागिरी

## Business Context

### Problem Statement
The temple previously used manual paper-based receipt books, leading to:
- Inefficient record-keeping and tracking
- Difficulty in generating annual donation reports for Tally accounting
- No digital copies for donors
- Manual effort in writing bilingual receipts
- Challenge in maintaining donor history

### Solution
A serverless web application that:
- Digitizes the entire receipt generation process
- Automatically generates bilingual PDF receipts
- Maintains donor database with deduplication
- Provides instant receipt downloads
- Enables future analytics and reporting
- Integrates with existing temple workflows

## Key Features

### Current (Phase 1 - Completed)
- ✅ Bilingual receipt generation (Marathi देवनागरी + English)
- ✅ Traditional temple receipt format
- ✅ Auto-incrementing receipt numbers (year-based)
- ✅ Multiple payment modes (Cash, UPI, Cheque, NEFT, etc.)
- ✅ Donor information capture and management
- ✅ PDF download via secure presigned URLs
- ✅ Amount in words (supports Lakh, Crore in both languages)
- ✅ Pre-defined donation categories
- ✅ Responsive web interface
- ✅ Real-time receipt preview

### Planned (Future Phases)
- 📋 CSV/Excel export for Tally integration
- 📋 Email receipts to donors
- 📋 WhatsApp sharing integration
- 📋 Donor search and history lookup
- 📋 Analytics dashboard (monthly/yearly reports)
- 📋 Bulk import of donations
- 📋 Multi-user support with roles
- 📋 Audit trail and logging
- 📋 Receipt cancellation/amendment workflow
- 📋 SMS notifications

## Technology Overview

### Architecture Pattern
**Serverless Microservices** on AWS with:
- Infrastructure as Code (AWS CDK)
- Event-driven processing
- Pay-per-use pricing model
- Auto-scaling capabilities
- High availability (Multi-AZ)

### Tech Stack Summary
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite + Tailwind CSS | User interface |
| **API** | AWS API Gateway HTTP API | RESTful endpoints |
| **Compute** | AWS Lambda (Node.js 20, ARM64) | Business logic |
| **Database** | DynamoDB with GSI | NoSQL data storage |
| **Storage** | Amazon S3 | PDF receipt storage |
| **Infrastructure** | AWS CDK v2 (TypeScript) | IaC deployment |
| **PDF Generation** | PDFKit + Noto Sans Devanagari | Bilingual receipts |

### Deployment
- **Region**: ap-south-1 (Mumbai, India)
- **Environment**: Production
- **Hosting**:
  - Backend: AWS Lambda + API Gateway
  - Frontend: S3 Static Website Hosting

## System Architecture

```
┌─────────────────┐
│   Web Browser   │ (Committee Member)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│   S3 Static Website (UI)            │
│   - React SPA                       │
│   - Tailwind CSS                    │
└────────┬────────────────────────────┘
         │ API Calls (HTTPS)
         ▼
┌─────────────────────────────────────┐
│   API Gateway (HTTP API)            │
│   - /health (GET)                   │
│   - /receipts (POST)                │
│   - /receipts/{id}/download (GET)  │
└────────┬────────────────────────────┘
         │ Invoke
         ▼
┌─────────────────────────────────────┐
│   Lambda Function (Node.js 20)      │
│   - Receipt creation                │
│   - PDF generation                  │
│   - Donor management                │
└────┬──────────────────┬─────────────┘
     │                  │
     ▼                  ▼
┌─────────────┐  ┌──────────────┐
│  DynamoDB   │  │   S3 Bucket  │
│  - Receipts │  │  - PDFs      │
│  - Donors   │  │              │
└─────────────┘  └──────────────┘
```

## Data Flow

### Receipt Creation Flow
1. User fills donation form (donor info + breakup + payment)
2. Frontend validates input and calls `POST /receipts`
3. Lambda function:
   - Resolves/creates donor profile
   - Generates receipt number (year-based counter)
   - Creates donation record in DynamoDB
   - Generates bilingual PDF with PDFKit
   - Uploads PDF to S3
   - Returns receipt details with download URL
4. Frontend displays success with download button
5. User clicks download → presigned S3 URL (valid 1 hour)
6. PDF opens in new tab or downloads

## Core Entities

### Receipt (Donation)
- **Receipt Number**: `YYYY-NNNNN` (e.g., 2025-00001)
- **Donor**: Name, mobile, PAN, email (optional)
- **Date**: Date of donation
- **Breakup**: Category-wise amounts
  - कार्यम निधी (Temple General)
  - उत्सव देणगी (Festival)
  - धार्मिक कार्य (Religious Activities)
  - अन्नदान (Annadaan)
  - इतर (Other)
- **Payment**: Mode (Cash/UPI/Cheque/etc.) + reference
- **Total**: Calculated sum
- **80G Eligibility**: Currently hardcoded to `false`

### Donor
- **Donor ID**: Auto-generated (e.g., `D_abc123def`)
- **Primary Info**: Name, mobile, email, PAN
- **Stats**: Lifetime total, donation count, last donation date
- **Deduplication**: By phone/PAN/email hash

## Security & Compliance

### Current Security Measures
- ✅ S3 buckets with BlockPublicAccess enabled
- ✅ Presigned URLs with 1-hour expiry
- ✅ DynamoDB encryption at rest
- ✅ HTTPS-only API endpoints
- ✅ No credentials in code (IAM roles)
- ✅ Input validation on frontend and backend

### Data Privacy
- PAN numbers stored as masked (ABCDE****F)
- Hashed identifiers for deduplication
- No sensitive data in logs
- Point-in-time recovery enabled

## Costs & Scalability

### Current Monthly Costs (Estimated)
- **DynamoDB**: ~₹50-100 (on-demand pricing)
- **Lambda**: ~₹0-50 (free tier covers most usage)
- **S3**: ~₹10-50 (storage + requests)
- **API Gateway**: ~₹0-100
- **Total**: ~₹110-300/month for low-medium usage

### Scalability
- Handles 10,000+ receipts/month without code changes
- Auto-scales based on demand
- No server maintenance required

## Development Workflow

### Current Process
1. Make code changes locally
2. Test locally (UI dev server + manual testing)
3. Build TypeScript → JavaScript
4. Deploy backend: `cdk deploy --all`
5. Build UI: `npm run build`
6. Deploy UI: `aws s3 sync dist/ s3://...`
7. Test on production URL
8. Commit to git and push

### Repository Structure
```
DattaDevasthanReceiptSystem/
├── docs/                      # 📚 All documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── architecture/
│   └── components/
├── TempleReceiptSystem/       # ⚙️ Backend
│   └── TempleReceiptSystemCDK/
├── ui/                        # 🎨 Frontend
└── test-files/               # 🧪 Test PDFs (local only)
```

## Documentation Index

### High-Level Documentation
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) (this file) - Project summary
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current status and roadmap
- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) - System architecture deep-dive

### Component Documentation
- [BACKEND.md](components/BACKEND.md) - Backend technical design
- [FRONTEND.md](components/FRONTEND.md) - Frontend technical design
- [DATA_MODEL.md](components/DATA_MODEL.md) - Database schema and design
- [PDF_GENERATION.md](components/PDF_GENERATION.md) - PDF receipt generation

### User Documentation
- [README.md](../README.md) - Quick start guide
- [UI_DEMO_GUIDE.md](../UI_DEMO_GUIDE.md) - User manual with screenshots

## Key Decisions & Trade-offs

### Why Serverless?
- ✅ Low operational overhead (no server management)
- ✅ Cost-efficient for variable workload
- ✅ Auto-scaling built-in
- ✅ High availability by default
- ❌ Cold start latency (mitigated with warm-up)
- ❌ AWS vendor lock-in

### Why DynamoDB over RDS?
- ✅ Better fit for serverless (no connection pooling)
- ✅ Pay-per-request pricing
- ✅ Millisecond latency at any scale
- ✅ No capacity planning required
- ❌ Limited query flexibility (use GSIs)
- ❌ Learning curve for NoSQL patterns

### Why Monorepo?
- ✅ Easier to manage related changes (UI + Backend)
- ✅ Shared types and constants
- ✅ Single version control
- ✅ Atomic commits across stack
- ❌ Larger repository size
- ❌ Need clear folder organization

## Success Metrics

### Current Metrics (To Be Tracked)
- Number of receipts generated per month
- Average time to generate receipt
- Donor database growth
- PDF download success rate
- System uptime

### Future KPIs
- User satisfaction score
- Reduction in manual effort (hours saved)
- Accuracy improvement (fewer manual errors)
- Cost per receipt generated

## Team & Responsibilities

### Current
- **Development**: Pranav Nawathe (with Claude Code assistance)
- **Deployment**: Manual via AWS CLI/CDK
- **Support**: Ad-hoc

### Future Considerations
- Dedicated admin user training
- Documentation for temple committee
- Backup/recovery procedures
- Change management process

## Links & Resources

### Live System
- **UI**: http://datta-devasthan-receipts.s3-website.ap-south-1.amazonaws.com
- **API**: https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com

### Repositories
- **GitHub**: https://github.com/pranavnawathe/DattaDevasthanReceiptSystem
- **Previous (Deprecated)**:
  - Backend: https://github.com/pranavnawathe/TempleReceiptSystemCDK
  - Frontend: https://github.com/pranavnawathe/TempleReceiptSystemUI

### External Resources
- AWS CDK Documentation: https://docs.aws.amazon.com/cdk/
- React Documentation: https://react.dev/
- PDFKit: https://pdfkit.org/
- Noto Sans Devanagari Font: https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari

---

**Last Updated**: October 26, 2025
**Version**: 1.0
**Status**: Production (Phase 1 Complete)
