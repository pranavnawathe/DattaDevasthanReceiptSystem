# System Architecture

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [AWS Infrastructure](#aws-infrastructure)
3. [Component Interaction](#component-interaction)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Scalability & Performance](#scalability--performance)
7. [Disaster Recovery](#disaster-recovery)

## Architecture Overview

The Datta Devasthan Receipt System follows a **serverless microservices architecture** on AWS, with a clear separation between frontend, API layer, business logic, and data storage.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Web Browser (Committee Member)                         │  │
│  │   - Chrome/Firefox/Safari/Edge                           │  │
│  │   - Desktop or Mobile                                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS (TLS 1.2+)
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                   Presentation Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Amazon S3 Static Website Hosting                       │   │
│  │   Bucket: datta-devasthan-receipts                       │   │
│  │   ┌────────────────────────────────────────────────┐     │   │
│  │   │  React SPA (Single Page Application)          │     │   │
│  │   │  - index.html                                  │     │   │
│  │   │  - JavaScript bundles (Vite build)            │     │   │
│  │   │  - CSS (Tailwind compiled)                    │     │   │
│  │   │  - Assets (images, fonts)                     │     │   │
│  │   └────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        │ REST API (HTTPS)
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                      API Layer                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Amazon API Gateway (HTTP API)                          │   │
│  │   URL: lfg5incxn1.execute-api.ap-south-1.amazonaws.com  │   │
│  │   ┌────────────────────────────────────────────────┐     │   │
│  │   │  Routes:                                       │     │   │
│  │   │  - GET  /health                                │     │   │
│  │   │  - POST /receipts                              │     │   │
│  │   │  - GET  /receipts/{receiptNo}/download        │     │   │
│  │   │                                                 │     │   │
│  │   │  CORS: Enabled for S3 origin                  │     │   │
│  │   │  Throttling: Default AWS limits               │     │   │
│  │   └────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        │ Lambda Integration
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                   Business Logic Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   AWS Lambda Function                                    │   │
│  │   Name: TempleApiStack-ReceiptsFn                        │   │
│  │   Runtime: Node.js 20.x (ARM64 - Graviton2)             │   │
│  │   Memory: 512 MB                                          │   │
│  │   Timeout: 10 seconds                                     │   │
│  │   ┌────────────────────────────────────────────────┐     │   │
│  │   │  Handlers:                                     │     │   │
│  │   │  - Health Check Handler                        │     │   │
│  │   │  - Create Receipt Handler                      │     │   │
│  │   │  - Get Download URL Handler                    │     │   │
│  │   │                                                 │     │   │
│  │   │  Services:                                      │     │   │
│  │   │  - DonationService (receipt creation)         │     │   │
│  │   │  - DonorResolver (deduplication)              │     │   │
│  │   │  - ReceiptArtifact (PDF generation)           │     │   │
│  │   │                                                 │     │   │
│  │   │  Utilities:                                     │     │   │
│  │   │  - ID Generator                                │     │   │
│  │   │  - Crypto (hashing)                            │     │   │
│  │   │  - Normalizers                                 │     │   │
│  │   └────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────┬────────────────────────┬─────────────────────────┘
                │                        │
                │                        │
┌───────────────▼─────────────┐  ┌───────▼──────────────────────────┐
│      Data Layer              │  │     Storage Layer                │
│  ┌─────────────────────┐    │  │  ┌──────────────────────────┐   │
│  │  Amazon DynamoDB    │    │  │  │  Amazon S3               │   │
│  │  FoundationStack-   │    │  │  │  Bucket: foundationstack-│   │
│  │  DonationsTable     │    │  │  │  receiptsbucket...       │   │
│  │                     │    │  │  │                          │   │
│  │  ┌───────────────┐ │    │  │  │  ┌────────────────────┐  │   │
│  │  │ Main Table    │ │    │  │  │  │  PDF Files         │  │   │
│  │  │  PK: ORG#...  │ │    │  │  │  │  receipts/         │  │   │
│  │  │  SK: RCPT#... │ │    │  │  │  │   2025-00001.pdf   │  │   │
│  │  │  SK: DONOR#...│ │    │  │  │  │   2025-00002.pdf   │  │   │
│  │  └───────────────┘ │    │  │  │  │   ...              │  │   │
│  │                     │    │  │  │  └────────────────────┘  │   │
│  │  ┌───────────────┐ │    │  │  │                          │   │
│  │  │ GSI1          │ │    │  │  │  Encryption: SSE-S3      │   │
│  │  │  Donor→Rcpts  │ │    │  │  │  Versioning: Disabled    │   │
│  │  └───────────────┘ │    │  │  │  Public Access: Blocked  │   │
│  │                     │    │  │  └──────────────────────────┘   │
│  │  ┌───────────────┐ │    │  └──────────────────────────────────┘
│  │  │ GSI2          │ │    │
│  │  │  Date→Rcpts   │ │    │
│  │  └───────────────┘ │    │
│  │                     │    │
│  │  PITR: Enabled      │    │
│  │  Encryption: AWS    │    │
│  │  Billing: On-Demand │    │
│  └─────────────────────┘    │
└──────────────────────────────┘
```

## AWS Infrastructure

### Infrastructure as Code (CDK)

The entire infrastructure is defined using **AWS CDK v2** with TypeScript, organized into three stacks:

#### 1. FoundationStack
**Purpose**: Core data and storage resources

**Resources**:
- **DynamoDB Table** (`DonationsTable`)
  - Partition Key: `PK` (String)
  - Sort Key: `SK` (String)
  - GSI1: `GSI1PK` + `GSI1SK` (donor lookups)
  - GSI2: `GSI2PK` + `GSI2SK` (date range queries)
  - Point-in-time recovery: Enabled
  - Billing: On-demand
  - Encryption: AWS managed

- **S3 Bucket** (`ReceiptsBucket`)
  - Purpose: Store generated PDF receipts
  - Encryption: SSE-S3
  - Public access: Blocked
  - Lifecycle: None (retain all receipts)

- **S3 Bucket** (`ExportsBucket`)
  - Purpose: Future CSV/Excel exports
  - Encryption: SSE-S3
  - Public access: Blocked

**Exports**:
- Table name and ARN
- Bucket names and ARNs

#### 2. ApiStack
**Purpose**: API Gateway and Lambda function

**Resources**:
- **HTTP API** (API Gateway)
  - CORS enabled for S3 origin
  - Default stage with auto-deploy
  - Throttling: AWS defaults

- **Lambda Function** (`ReceiptsFn`)
  - Runtime: Node.js 20.x
  - Architecture: ARM64 (Graviton2 - cost optimized)
  - Memory: 512 MB
  - Timeout: 10 seconds
  - Handler: `index.handler`
  - Code: Bundled from `lambda/receipts/`
  - Environment Variables:
    - `DONATIONS_TABLE_NAME`
    - `RECEIPTS_BUCKET_NAME`
    - `AWS_REGION`

- **IAM Role** (Lambda execution role)
  - DynamoDB: Read/Write on DonationsTable
  - S3: Read/Write on ReceiptsBucket
  - CloudWatch Logs: Write logs

**Routes**:
- `GET /health` → Lambda (health check)
- `POST /receipts` → Lambda (create receipt)
- `GET /receipts/{receiptNo}/download` → Lambda (get presigned URL)

#### 3. UiStack
**Purpose**: Frontend hosting

**Resources**:
- **S3 Bucket** (`datta-devasthan-receipts`)
  - Website hosting enabled
  - Index document: `index.html`
  - Error document: `index.html` (SPA routing)
  - Public read access (for website hosting)
  - No encryption (public website)

**Outputs**:
- Website URL
- Bucket name

### Deployment Process

```bash
# 1. Install dependencies
npm install

# 2. Synthesize CloudFormation
cdk synth

# 3. Deploy all stacks
cdk deploy --all --require-approval never --profile temple-admin

# Deployment order (handled automatically by CDK):
# 1. FoundationStack (creates DynamoDB + S3)
# 2. ApiStack (depends on Foundation exports)
# 3. UiStack (independent)
```

## Component Interaction

### Receipt Creation Sequence

```
User → UI → API Gateway → Lambda → DynamoDB
                                  → PDFKit → S3
                                  ← Response
      ← Success ← 200 OK ← Return
```

**Detailed Steps**:

1. **User Input**
   - User fills form: donor info, donation breakup, payment details
   - Frontend validates input (required fields, format)

2. **API Request**
   ```json
   POST /receipts
   {
     "donor": {
       "name": "प्रणव नवाथे",
       "mobile": "9196016390"
     },
     "breakup": {
       "TEMPLE_GENERAL": 500,
       "ANNADAAN": 250
     },
     "payment": {
       "mode": "UPI",
       "ref": "UPI123456"
     },
     "date": "2025-10-26",
     "eligible80G": false
   }
   ```

3. **Lambda Processing**
   - Extract request body and validate
   - Call `DonationService.createDonation()`

4. **Donor Resolution**
   - `DonorResolver.resolveOrCreateDonor()`
   - Check for existing donor by mobile/PAN/email
   - If found: Update stats (lifetime total, last donation)
   - If new: Create donor profile with generated ID
   - Return `donorId`

5. **Receipt Number Generation**
   - `CounterService.getNextReceiptNumber(year)`
   - Atomic increment of counter for current year
   - Format: `YYYY-NNNNN` (e.g., 2025-00001)

6. **Donation Record Creation**
   - Build `DonationItem` with all keys (PK, SK, GSI1, GSI2)
   - Save to DynamoDB
   - Calculate total from breakup

7. **PDF Generation**
   - `ReceiptArtifact.createPDFReceipt(donation)`
   - Initialize PDFKit document
   - Register Noto Sans Devanagari font
   - Render receipt layout (header, donor, table, signature)
   - Convert amount to words (Marathi + English)
   - Return PDF as Buffer

8. **S3 Upload**
   - `ReceiptArtifact.uploadReceiptToS3(receiptNo, pdfBuffer)`
   - Upload to `s3://receipts-bucket/receipts/{receiptNo}.pdf`
   - Set content type: `application/pdf`

9. **Response**
   ```json
   {
     "success": true,
     "receiptNo": "2025-00001",
     "donorId": "D_abc123def",
     "total": 750,
     "pdfKey": "receipts/2025-00001.pdf",
     "createdAt": 1729951234567
   }
   ```

10. **UI Display**
    - Show success message with receipt number
    - Display download button
    - Reset form for next entry

### Download Flow

```
User → UI → API Gateway → Lambda → S3 (generate presigned URL)
                                  ← URL (expires in 1 hour)
      → S3 (direct download) ← Redirect
```

**Steps**:

1. User clicks "Download Receipt"
2. Frontend calls `GET /receipts/{receiptNo}/download`
3. Lambda generates presigned URL:
   ```javascript
   const url = await getSignedUrl(s3Client, getObjectCommand, {
     expiresIn: 3600 // 1 hour
   });
   ```
4. Response:
   ```json
   {
     "success": true,
     "receiptNo": "2025-00001",
     "downloadUrl": "https://s3.ap-south-1.amazonaws.com/...",
     "expiresIn": 3600
   }
   ```
5. Frontend opens URL in new tab → PDF downloads/displays

## Data Flow

### Write Path (Create Receipt)
```
UI Form Data
  ↓ Validation
API Request (JSON)
  ↓ HTTP POST
Lambda Handler
  ↓ Parse & Validate
Donation Service
  ↓ Business Logic
┌─────────┴──────────┐
│                    │
Donor Resolver    Counter Service
  ↓                  ↓
DynamoDB          DynamoDB
(Donor Profile)   (Receipt Counter)
  ↓                  ↓
  └────────┬─────────┘
           ↓
    Create Donation Record
           ↓
    Generate PDF (PDFKit)
           ↓
    Upload to S3
           ↓
    Return Response
```

### Read Path (Download Receipt)
```
UI Download Request
  ↓
API Gateway
  ↓
Lambda Handler
  ↓
S3 GetObjectCommand
  ↓
Generate Presigned URL
  ↓
Return URL to UI
  ↓
Browser → S3 (Direct Download)
```

## Security Architecture

### Authentication & Authorization
**Current**: No authentication (internal committee use)
**Future**: AWS Cognito or custom auth

### Network Security
- **TLS/HTTPS**: All API communication encrypted
- **CORS**: Configured to allow S3 origin only
- **S3**: Receipts bucket blocks all public access (presigned URLs only)

### Data Security
- **Encryption at Rest**:
  - DynamoDB: AWS managed encryption
  - S3: SSE-S3 encryption
- **Encryption in Transit**: TLS 1.2+
- **PII Protection**:
  - PAN stored masked: `ABCDE****F`
  - Phone/email hashed for deduplication
  - No logs contain sensitive data

### IAM Permissions
```
Lambda Execution Role:
  - dynamodb:GetItem, PutItem, UpdateItem, Query (DonationsTable)
  - s3:PutObject, GetObject (ReceiptsBucket)
  - logs:CreateLogGroup, CreateLogStream, PutLogEvents

S3 Website Bucket:
  - Public read for website hosting only
```

### Presigned URL Security
- Expiry: 1 hour (3600 seconds)
- Generated per request (not cached)
- Cannot be used to list other files

## Scalability & Performance

### Auto-Scaling
- **API Gateway**: Unlimited concurrent requests (soft limits apply)
- **Lambda**: Up to 1000 concurrent executions (can request increase)
- **DynamoDB**: On-demand scaling (unlimited throughput)
- **S3**: Unlimited storage and requests

### Performance Characteristics
| Operation | Latency | Throughput |
|-----------|---------|------------|
| Create Receipt | 800-1500ms | 100+ req/sec |
| Download URL | 100-300ms | 500+ req/sec |
| PDF Generation | 500-800ms | - |
| S3 Upload | 200-400ms | - |

### Optimization Strategies
- **Lambda**: ARM64 Graviton2 (20% cheaper, comparable performance)
- **DynamoDB**: On-demand billing (no over-provisioning)
- **S3**: Standard storage class (no frequent access expected)
- **Frontend**: Vite bundling, code splitting, lazy loading

### Bottlenecks & Limits
- **Lambda timeout**: 10 seconds (adequate for PDF generation)
- **Lambda memory**: 512 MB (sufficient for PDFKit)
- **DynamoDB item size**: 400 KB limit (receipts are ~2-5 KB)
- **S3 object size**: No practical limit (PDFs are ~10 KB)

## Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery (PITR) enabled
  - Restore to any point in last 35 days
  - RPO: Seconds
  - RTO: Minutes to hours (manual process)

- **S3 Receipts**: No versioning (single version retained)
  - Objects are immutable (not updated after creation)
  - No lifecycle rules (retain forever)

### Recovery Procedures

#### Scenario 1: Accidental Receipt Deletion
- DynamoDB: Restore table to point before deletion
- S3: Enable versioning (future enhancement) or recover from DynamoDB data and regenerate PDF

#### Scenario 2: Complete Stack Deletion
1. Redeploy infrastructure: `cdk deploy --all`
2. Restore DynamoDB from PITR backup
3. S3 receipts lost (regenerate from DynamoDB if needed)

#### Scenario 3: Data Corruption
1. Identify corruption timestamp
2. Restore DynamoDB to point before corruption
3. Audit and fix data issues

### Monitoring & Alerts
**Current**: CloudWatch Logs (manual monitoring)
**Future**: CloudWatch Alarms for:
- Lambda errors
- API Gateway 5xx errors
- DynamoDB throttling
- S3 upload failures

---

**Last Updated**: October 26, 2025
**Version**: 1.0
