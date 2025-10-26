# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TempleReceiptSystem Backend** is a donation management and e-receipt system for a temple organization in Maharashtra, India. The system enables committee members to enter donation details and generate bilingual (Marathi + English) e-receipts as PDFs that can be printed, emailed, or shared via WhatsApp.

## Technology Stack

- **AWS CDK v2** with TypeScript for infrastructure as code
- **Node.js 20** for Lambda functions
- **AWS SDK v3** for AWS service interactions
- **DynamoDB** for data storage with point-in-time recovery
- **S3** for storing receipt PDFs and exports
- **API Gateway (HTTP API)** with Lambda integration

## Project Structure

The main codebase is located in `TempleReceiptSystem/TempleReceiptSystemCDK/`:

```
TempleReceiptSystemCDK/
├── bin/temple-backend.ts        # CDK app entry point
├── lib/
│   ├── foundation-stack.ts      # DynamoDB tables and S3 buckets
│   └── api-stack.ts             # API Gateway and Lambda functions
├── lambda/
│   ├── receipts/                # Receipt creation/retrieval handlers
│   └── common/                  # Shared types and utilities
├── package.json
└── tsconfig.json
```

## Architecture

The system uses a two-stack architecture:

1. **FoundationStack**: Creates foundational resources
   - DynamoDB table with PK/SK design pattern
   - GSI1: donor lookups (donorId, date)
   - GSI2: date range queries (date, receiptNo)
   - Private S3 buckets for receipts and exports

2. **ApiStack**: API layer
   - HTTP API Gateway with CORS enabled
   - Lambda function (Node.js 20, ARM64)
   - Routes: `/health` (GET), `/receipts` (POST)

## Common Development Commands

### Build and Deploy

```bash
cd TempleReceiptSystem/TempleReceiptSystemCDK

# Install dependencies
npm install

# Install Lambda function dependencies
npm run install:lambda

# Compile TypeScript
npm run build

# Watch mode for development
npm run watch

# Synthesize CloudFormation templates
npm run synth

# Show stack differences
npm run diff

# Deploy stacks to AWS
npm run deploy
```

### CDK Commands

```bash
# Deploy specific stack
cdk deploy FoundationStack
cdk deploy TempleApiStack

# Destroy stacks
cdk destroy FoundationStack
cdk destroy TempleApiStack

# List all stacks
cdk list

# Show CloudFormation template
cdk synth FoundationStack
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

The donations table uses a single-table design:

- **Partition Key (PK)**: `DONATION#<donationId>` or `DONOR#<donorId>`
- **Sort Key (SK)**: `METADATA` or `DONATION#<timestamp>`
- **GSI1**: Donor lookups via `donorId` and `date`
- **GSI2**: Date range queries via `date` and `receiptNo`

### Security Best Practices

- All S3 buckets have `BlockPublicAccess.BLOCK_ALL`
- DynamoDB has point-in-time recovery enabled
- Lambda functions follow least-privilege IAM
- No hardcoded credentials (use AWS SDK default credential chain)

### AWS Configuration

- **Region**: ap-south-1 (Mumbai)
- **Account ID**: 671924214635 (configured in `bin/temple-backend.ts`)

## Future Development Phases

- CSV/Excel export functionality for Tally integration
- Audit trail and logging
- PDF generation for bilingual receipts (Marathi + English)
- Donor management features
- Email/WhatsApp integration

## Code Organization

- CDK infrastructure code in `/bin` and `/lib`
- Lambda handlers in `/lambda/<function-name>/`
- Shared code (types, utilities, helpers) in `/lambda/common/`
- Keep Lambda functions focused and single-purpose
- Use TypeScript interfaces for API contracts and DynamoDB item shapes
