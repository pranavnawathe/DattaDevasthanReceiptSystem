# Datta Devasthan Receipt System - Project Overview

## Executive Summary

The Datta Devasthan Receipt System is a full-stack donation management solution for **श्री दत्त देवस्थान कोंडगांव (साखरपा)**, a temple in Maharashtra, India. The system enables committee members to digitally record donations and generate professional bilingual (Marathi + English) e-receipts.

**Registration**: रजि. क्र. अे/१२६/रत्नागिरी

## Business Context

### Problem Statement
The temple previously used manual paper-based receipt books, leading to:
- Inefficient record-keeping and tracking
- Difficulty generating annual donation reports for Tally accounting
- No digital copies for donors
- Manual effort in writing bilingual receipts
- Challenge maintaining donor history

### Solution
A serverless web application that:
- Digitizes the entire receipt generation process
- Automatically generates bilingual PDF receipts
- Maintains a donor database with deduplication
- Provides instant receipt downloads
- Enables CSV export for Tally integration
- Integrates with existing temple workflows

## Key Features

### Implemented
- ✅ Bilingual receipt generation (Marathi देवनागरी + English)
- ✅ Traditional temple receipt format
- ✅ Sequential receipt numbers per financial year (`NNNNN/YYYY-YY`, resets each April)
- ✅ Multiple payment modes (Cash, UPI, Cheque, NEFT, etc.)
- ✅ Donor information capture and deduplication (phone / PAN / email)
- ✅ Donor search
- ✅ PDF download via secure presigned URLs (1-hour expiry)
- ✅ Amount in words (supports Lakh, Crore in both languages)
- ✅ Pre-defined donation categories
- ✅ Responsive web interface
- ✅ CSV export for Tally integration (date chunking for large date ranges)
- ✅ CI/CD pipeline: auto-deploy to test, manual approval for prod

### Planned
- 📋 Authentication / access control (currently open to anyone with URL)
- 📋 Email receipts to donors
- 📋 WhatsApp sharing integration
- 📋 Analytics dashboard (monthly/yearly reports)
- 📋 Receipt void/amendment workflow (designed, not fully implemented)
- 📋 Multi-user support with roles
- 📋 Bulk import of donations
- 📋 SMS notifications

## Technology Overview

### Architecture Pattern
**Serverless** on AWS with:
- Infrastructure as Code (AWS CDK v2)
- Pay-per-use pricing model
- Auto-scaling capabilities
- CI/CD via AWS CodePipeline (test + prod stages with manual approval gate)

### Tech Stack Summary
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite + Tailwind CSS | User interface |
| **API** | AWS API Gateway HTTP API | RESTful endpoints |
| **Compute** | AWS Lambda (Node.js 20, ARM64) | Business logic |
| **Database** | DynamoDB with GSIs (single-table) | NoSQL data storage |
| **Storage** | Amazon S3 | PDF receipt and CSV export storage |
| **Infrastructure** | AWS CDK v2 (TypeScript) | IaC deployment |
| **PDF Generation** | PDFKit + Noto Sans Devanagari | Bilingual receipts |
| **CI/CD** | AWS CodePipeline | Automated test→prod pipeline |

### Deployment
- **Region**: ap-south-1 (Mumbai, India)
- **Test UI**: http://datta-devasthan-receipts-test.s3-website.ap-south-1.amazonaws.com
- **Prod UI**: http://datta-devasthan-receipts.s3-website.ap-south-1.amazonaws.com
- **Prod API**: https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com

## System Architecture

```
┌─────────────────┐
│   Web Browser   │ (Committee Member)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│   S3 Static Website (UI)            │
│   - React 19 SPA                    │
│   - Tailwind CSS                    │
└────────┬────────────────────────────┘
         │ API Calls (HTTPS)
         ▼
┌─────────────────────────────────────┐
│   API Gateway (HTTP API)            │
│   - GET  /health                    │
│   - GET/POST /receipts              │
│   - GET  /receipts/search           │
│   - GET  /receipts/donor/{donorId}  │
│   - GET  /receipts/{id}/download    │
│   - POST /receipts/export           │
└────────┬────────────────────────────┘
         │ Invoke
         ▼
┌─────────────────────────────────────┐
│   Lambda Function (Node.js 20)      │
│   - Receipt creation + numbering    │
│   - PDF generation (PDFKit)         │
│   - Donor management                │
│   - CSV export                      │
└────┬──────────────────┬─────────────┘
     │                  │
     ▼                  ▼
┌─────────────┐  ┌──────────────┐
│  DynamoDB   │  │   S3 Bucket  │
│  (single    │  │  - PDFs      │
│   table)    │  │  - CSV files │
└─────────────┘  └──────────────┘
```

### CDK Stacks (4 total, deployed via CodePipeline)

| Stack | Resources |
|-------|-----------|
| **FoundationStack** | DynamoDB table, receipts S3 bucket, exports S3 bucket |
| **ApiStack** | Lambda function, HTTP API Gateway |
| **UiStack** | S3 static website bucket, BucketDeployment |
| **PipelineStack** | CodePipeline with test stage + prod stage (manual approval) |

## Data Flow

### Receipt Creation Flow
1. User fills donation form (donor info + breakup + payment)
2. Frontend validates input and calls `POST /receipts`
3. Lambda function:
   - Resolves/creates donor profile (deduplication by phone/PAN/email)
   - Allocates next receipt number atomically via DynamoDB counter
   - Creates donation record in DynamoDB
   - Generates bilingual PDF with PDFKit
   - Uploads PDF to S3
   - Returns receipt details with presigned download URL
4. Frontend displays success with download button
5. User clicks download → presigned S3 URL (valid 1 hour)

## Core Entities

### Receipt (Donation)
- **Receipt Number**: `NNNNN/YYYY-YY` display (e.g., `00071/2025-26`); stored as `NNNNN-YYYY-YY`
- **Financial Year**: Indian FY (Apr–Mar); counter resets each April
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

### Donor
- **Donor ID**: Auto-generated
- **Primary Info**: Name, mobile, email, PAN
- **Deduplication**: Via ALIAS items keyed by phone/PAN/email hash
- **Stats**: Lifetime total, donation count, last donation date

## DynamoDB Key Design

Single table with `ORG#<orgId>` partition key:

| Entity | SK pattern | Example |
|--------|-----------|---------|
| Receipt | `RCPT#<receiptNo>` | `RCPT#00071-2025-26` |
| Donor | `DONOR#<donorId>` | `DONOR#D_abc123` |
| Alias | `ALIAS#<type>#<value>` | `ALIAS#PHONE#9876543210` |
| Counter | `COUNTER#RECEIPT#<FY>` | `COUNTER#RECEIPT#2025-26` |

## Security & Compliance

### Current Security Measures
- ✅ Receipts/exports S3 buckets with `BlockPublicAccess.BLOCK_ALL`
- ✅ Presigned URLs with 1-hour expiry
- ✅ DynamoDB encryption at rest (AWS managed)
- ✅ HTTPS-only API endpoints
- ✅ No credentials in code (IAM roles)
- ✅ Input validation on frontend and backend

### Known Gap
- ⚠️ No authentication — anyone with the URL can access the system

### Data Privacy
- PAN numbers stored masked
- Hashed identifiers for deduplication
- No sensitive data in logs
- Point-in-time recovery enabled on prod

## Costs & Scalability

### Estimated Monthly Costs
- **DynamoDB**: ~₹50–100 (on-demand pricing)
- **Lambda**: ~₹0–50 (free tier covers most usage)
- **S3**: ~₹10–50 (storage + requests)
- **API Gateway**: ~₹0–100
- **Total**: ~₹110–300/month for low-medium usage

### Scalability
- Handles 10,000+ receipts/month without code changes
- Auto-scales based on demand
- No server maintenance required

## Development Workflow

### CI/CD Pipeline
1. Push to configured GitHub branch
2. CodePipeline triggers automatically
3. Lambda unit tests run in CodeBuild
4. Test stage deploys automatically
5. Manual approval step gates production deployment
6. Prod deploys on approval

### Local Development
- Backend: compile with `npm run build` from CDK root
- Frontend: `cd ui && npm run dev` (Vite dev server, hits prod API)
- Lambda tests: `cd lambda/common && npm test`

### Repository Structure
```
DattaDevasthanReceiptSystem/
├── docs/                          # Project documentation
├── TempleReceiptSystem/
│   └── TempleReceiptSystemCDK/    # CDK infrastructure + Lambda
└── ui/                            # React frontend (Vite)
```

## Documentation Index

- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) (this file)
- [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) — system architecture deep-dive
- [components/BACKEND.md](components/BACKEND.md) — backend technical design
- [components/FRONTEND.md](components/FRONTEND.md) — frontend technical design

## Key Decisions & Trade-offs

### Why Serverless?
- ✅ Low operational overhead
- ✅ Cost-efficient for variable workload
- ✅ Auto-scaling built-in
- ❌ Cold start latency
- ❌ AWS vendor lock-in

### Why DynamoDB over RDS?
- ✅ Better fit for serverless (no connection pooling)
- ✅ Pay-per-request pricing
- ✅ Millisecond latency at scale
- ❌ Limited query flexibility (use GSIs)

## Team

- **Development**: Pranav Nawathe
- **GitHub**: https://github.com/pranavnawathe/DattaDevasthanReceiptSystem

---

**Last Updated**: March 2026
**Status**: Production
