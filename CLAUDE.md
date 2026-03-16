# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Datta Devasthan Receipt System** is a full-stack donation management and e-receipt system for **श्री दत्त देवस्थान कोंडगांव (साखरपा)**, a temple in Maharashtra, India. Committee members use it to record donations and generate bilingual (Marathi + English) PDF receipts.

## Technology Stack

- **AWS CDK v2** with TypeScript for infrastructure as code
- **Node.js 20** for Lambda functions
- **AWS SDK v3** for AWS service interactions
- **DynamoDB** for data storage (single-table design)
- **S3** for storing receipt PDFs and exports
- **API Gateway (HTTP API)** with Lambda integration
- **React 19 + Vite + Tailwind CSS** for the frontend
- **PDFKit + Noto Sans Devanagari** for bilingual PDF generation
- **AWS CodePipeline** for CI/CD (test → prod with manual approval gate)

## Project Structure

The main codebase is in `TempleReceiptSystem/TempleReceiptSystemCDK/` (CDK + Lambda) and `ui/` (frontend):

```
repo root/
├── TempleReceiptSystem/TempleReceiptSystemCDK/
│   ├── bin/
│   │   ├── pipeline.ts          # CDK pipeline entry point (used in CI)
│   │   └── temple-backend.ts    # Direct CDK app entry point (manual deploys)
│   ├── lib/
│   │   ├── pipeline-stack.ts    # CodePipeline (test + prod stages)
│   │   ├── temple-app-stage.ts  # Stage grouping Foundation + API + UI stacks
│   │   ├── foundation-stack.ts  # DynamoDB table and S3 buckets
│   │   ├── api-stack.ts         # API Gateway and Lambda function
│   │   └── ui-stack.ts          # S3 static website hosting for React app
│   └── lambda/
│       ├── receipts/            # Receipt creation/retrieval handlers
│       └── common/              # Shared types, services, and utilities
├── ui/                          # React frontend (Vite)
└── docs/                        # Project documentation
```

## Architecture

The system uses a **four-stack architecture** deployed via CodePipeline through test and prod stages:

1. **FoundationStack**: Data layer
   - DynamoDB single-table design (`ORG#<orgId>` PK)
   - GSI1: donor lookups; GSI2: date-range queries
   - Private S3 buckets for receipts and exports
   - PITR enabled on prod; auto-delete on test

2. **ApiStack**: Compute layer
   - HTTP API Gateway with CORS enabled
   - Single Lambda function (Node.js 20, ARM64)
   - Routes: `GET /health`, `GET/POST /receipts`, `GET /receipts/search`, `GET /receipts/donor/{donorId}`, `GET /receipts/{receiptNo}/download`, `POST /receipts/export`

3. **UiStack**: Frontend hosting
   - S3 static website (`datta-devasthan-receipts` prod / `datta-devasthan-receipts-test` test)

4. **PipelineStack**: CI/CD
   - CodePipeline: test stage auto-deploys on push; prod requires manual approval

## Common Development Commands

### Backend (from `TempleReceiptSystem/TempleReceiptSystemCDK/`)

```bash
# Install CDK dependencies
npm install

# Install Lambda function dependencies
npm run install:lambda

# Compile TypeScript
npm run build

# Synthesize CloudFormation (via pipeline entry point)
npx cdk synth --app "npx ts-node --prefer-ts-exts bin/pipeline.ts"

# Deploy pipeline stack (only needed once)
npx cdk deploy PipelineStack --app "npx ts-node --prefer-ts-exts bin/pipeline.ts"
```

### Frontend (from `ui/`)

```bash
npm install
npm run dev      # Vite dev server at localhost:5173
npm run build    # Production build → dist/
```

### Lambda Tests (from `lambda/common/`)

```bash
npm test
```

## Development Guidelines

### TypeScript Configuration

- Strict mode enabled
- Target: ES2020
- Module: commonjs
- Output directory: `dist/`
- Root includes: `bin/`, `lib/`

### Lambda Functions

- Runtime: Node.js 20.x
- Architecture: ARM64 (Graviton2)
- Memory: 512 MB
- Timeout: 10 seconds
- Handler pattern: `index.handler`

### DynamoDB Data Model

Single-table design with `ORG#<orgId>` as the partition key:

- **PK**: `ORG#<orgId>`
- **SK** by entity type:
  - Receipts: `RCPT#<receiptNo>` (e.g., `RCPT#00071-2025-26`)
  - Donors: `DONOR#<donorId>`
  - Aliases (phone/PAN/email lookups): `ALIAS#<type>#<value>`
  - Counters: `COUNTER#RECEIPT#<financialYear>` (e.g., `COUNTER#RECEIPT#2025-26`)
- **GSI1**: Donor → donations (`DONOR#<donorId>` → `DATE#<date>#RCPT#<receiptNo>`)
- **GSI2**: Date range queries (`DATE#<date>` → `RCPT#<receiptNo>`)

### Receipt Numbering

- **Display format** (PDF): `NNNNN/YYYY-YY` (e.g., `00071/2025-26`)
- **Storage format** (DB, URLs, S3 keys): `NNNNN-YYYY-YY` (e.g., `00071-2025-26`)
- Counter resets to 1 each April (Indian financial year: Apr–Mar)
- Allocated atomically via DynamoDB `UpdateExpression` with `ADD` on counter item

### Security Best Practices

- Receipts/exports S3 buckets have `BlockPublicAccess.BLOCK_ALL`
- UI S3 bucket uses `BlockPublicAccess.BLOCK_ACLS` (public website hosting)
- DynamoDB PITR enabled on prod, disabled on test
- Lambda functions follow least-privilege IAM
- No hardcoded credentials (use AWS SDK default credential chain)

### AWS Configuration

- **Region**: ap-south-1 (Mumbai)
- **Account ID**: 671924214635

## Implemented Features

- Bilingual PDF receipt generation (Marathi देवनागरी + English)
- Receipt numbering with financial-year sequential counter
- Donor creation and deduplication (by phone/PAN/email)
- Donor search
- CSV export for Tally integration (with date chunking)
- Presigned S3 URLs for PDF download (1hr expiry)
- CI/CD pipeline: test stage auto-deploys; prod requires manual approval

## Known Gaps / Future Work

- No authentication (anyone with URL can access)
- No receipt editing (void flow designed but not fully implemented)
- Void watermark on PDF not implemented
- No email/WhatsApp sharing

## Code Organization

- CDK infrastructure code in `/bin` and `/lib`
- Lambda handlers in `/lambda/<function-name>/`
- Shared code (types, utilities, helpers) in `/lambda/common/`
- Keep Lambda functions focused and single-purpose
- Use TypeScript interfaces for API contracts and DynamoDB item shapes
