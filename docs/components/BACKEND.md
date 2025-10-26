# Backend Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [CDK Stacks](#cdk-stacks)
4. [Lambda Function](#lambda-function)
5. [Services Layer](#services-layer)
6. [Data Access Layer](#data-access-layer)
7. [Utilities](#utilities)
8. [API Contracts](#api-contracts)
9. [Error Handling](#error-handling)
10. [Testing](#testing)
11. [Deployment](#deployment)

## Overview

The backend is built using **AWS CDK v2** (Infrastructure as Code) and **Node.js 20.x Lambda functions**. It follows a layered architecture with clear separation of concerns.

**Location**: `TempleReceiptSystem/TempleReceiptSystemCDK/`

**Key Technologies**:
- AWS CDK 2.x (TypeScript)
- Node.js 20.x (Lambda runtime)
- AWS SDK v3 (modular imports)
- TypeScript 5.9 (strict mode)
- PDFKit (PDF generation)
- Jest (testing)

## Project Structure

```
TempleReceiptSystemCDK/
├── bin/
│   └── temple-backend.ts          # CDK app entry point
├── lib/
│   ├── foundation-stack.ts        # DynamoDB + S3 resources
│   ├── api-stack.ts               # API Gateway + Lambda
│   └── ui-stack.ts                # S3 website hosting
├── lambda/
│   ├── receipts/                  # Lambda function code
│   │   ├── index.ts               # Main handler
│   │   ├── package.json           # Runtime dependencies
│   │   └── common/                # Symlinked to ../common
│   └── common/                    # Shared code
│       ├── types.ts               # Type definitions
│       ├── db/                    # Data access layer
│       │   ├── dynamo-client.ts   # DynamoDB client setup
│       │   ├── counter.ts         # Receipt counter logic
│       │   └── queries.ts         # Query builders
│       ├── services/              # Business logic
│       │   ├── donation-service.ts
│       │   ├── donor-resolver.ts
│       │   └── receipt-artifact.ts
│       ├── utils/                 # Utilities
│       │   ├── id-generator.ts
│       │   ├── crypto.ts
│       │   └── normalizers.ts
│       ├── fonts/                 # Font files
│       │   └── NotoSansDevanagari.ttf
│       └── __tests__/             # Unit tests
├── cdk.json                       # CDK configuration
├── package.json                   # CDK dependencies
└── tsconfig.json                  # TypeScript config
```

## CDK Stacks

### 1. FoundationStack

**Purpose**: Core infrastructure resources (database and storage)

**File**: `lib/foundation-stack.ts`

#### Resources Created

**DynamoDB Table**:
```typescript
const donationsTable = new dynamodb.Table(this, 'DonationsTable', {
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.ON_DEMAND,
  pointInTimeRecovery: true,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  removalPolicy: cdk.RemovalPolicy.RETAIN, // Don't delete on stack destroy
});

// GSI1: Donor lookups (donorId → receipts by date)
donationsTable.addGlobalSecondaryIndex({
  indexName: 'GSI1',
  partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

// GSI2: Date range queries (date → receipts)
donationsTable.addGlobalSecondaryIndex({
  indexName: 'GSI2',
  partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});
```

**S3 Buckets**:
```typescript
// Receipt PDFs
const receiptsBucket = new s3.Bucket(this, 'ReceiptsBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// Future exports (CSV/Excel)
const exportsBucket = new s3.Bucket(this, 'ExportsBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
```

**Exports**:
- Table name and ARN
- Bucket names and ARNs

### 2. ApiStack

**Purpose**: API Gateway and Lambda function

**File**: `lib/api-stack.ts`

**Dependencies**: Imports from FoundationStack

#### Lambda Function

```typescript
const receiptsFn = new lambda.Function(this, 'ReceiptsFn', {
  runtime: lambda.Runtime.NODEJS_20_X,
  architecture: lambda.Architecture.ARM_64, // Graviton2
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/receipts')),
  timeout: cdk.Duration.seconds(10),
  memorySize: 512,
  environment: {
    DONATIONS_TABLE_NAME: donationsTable.tableName,
    RECEIPTS_BUCKET_NAME: receiptsBucket.bucketName,
    AWS_REGION: this.region,
  },
  bundling: {
    externalModules: [], // Bundle everything
    nodeModules: ['pdfkit', '@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  },
});

// Grant permissions
donationsTable.grantReadWriteData(receiptsFn);
receiptsBucket.grantReadWrite(receiptsFn);
```

#### HTTP API

```typescript
const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
  corsPreflight: {
    allowOrigins: ['*'], // Restrict in production
    allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.POST],
    allowHeaders: ['Content-Type'],
  },
});

const integration = new integrations.HttpLambdaIntegration('LambdaIntegration', receiptsFn);

httpApi.addRoutes({
  path: '/health',
  methods: [apigwv2.HttpMethod.GET],
  integration,
});

httpApi.addRoutes({
  path: '/receipts',
  methods: [apigwv2.HttpMethod.POST],
  integration,
});

httpApi.addRoutes({
  path: '/receipts/{receiptNo}/download',
  methods: [apigwv2.HttpMethod.GET],
  integration,
});
```

### 3. UiStack

**Purpose**: Frontend hosting (S3 static website)

**File**: `lib/ui-stack.ts`

```typescript
const uiBucket = new s3.Bucket(this, 'UiBucket', {
  bucketName: 'datta-devasthan-receipts',
  websiteIndexDocument: 'index.html',
  websiteErrorDocument: 'index.html', // SPA routing
  publicReadAccess: true,
  blockPublicAccess: new s3.BlockPublicAccess({
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }),
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

## Lambda Function

### Handler Structure

**File**: `lambda/receipts/index.ts`

```typescript
export const handler = async (event: any): Promise<any> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    // Health check
    if (method === 'GET' && path === '/health') {
      return json(200, {
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0',
      });
    }

    // Create receipt
    if (method === 'POST' && path === '/receipts') {
      const body = JSON.parse(event.body || '{}');
      const result = await DonationService.createDonation(body);
      return json(201, result);
    }

    // Get download URL
    if (method === 'GET' && path.startsWith('/receipts/') && path.endsWith('/download')) {
      const receiptNo = path.split('/')[2];
      const downloadUrl = await getReceiptDownloadUrl(receiptNo);
      return json(200, {
        success: true,
        receiptNo,
        downloadUrl,
        expiresIn: 3600,
      });
    }

    // 404 Not Found
    return json(404, { success: false, error: 'Not found' });
  } catch (error) {
    console.error('Handler error:', error);
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

// Helper for JSON responses
function json(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}
```

### Runtime Dependencies

**File**: `lambda/receipts/package.json`

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.x",
    "@aws-sdk/lib-dynamodb": "^3.x",
    "@aws-sdk/client-s3": "^3.x",
    "@aws-sdk/s3-request-presigner": "^3.x",
    "pdfkit": "^0.15.0"
  }
}
```

## Services Layer

### DonationService

**File**: `lambda/common/services/donation-service.ts`

**Purpose**: Orchestrates receipt creation workflow

**Key Methods**:

```typescript
export class DonationService {
  /**
   * Create a new donation receipt
   *
   * Steps:
   * 1. Validate input
   * 2. Resolve or create donor
   * 3. Generate receipt number
   * 4. Create donation record
   * 5. Generate PDF
   * 6. Upload to S3
   * 7. Return receipt details
   */
  static async createDonation(request: CreateReceiptRequest): Promise<CreateReceiptResponse> {
    const orgId = process.env.ORG_ID || 'DEFAULT';
    const now = Date.now();

    // Step 1: Resolve donor (deduplicate)
    const donorResolution = await DonorResolver.resolveOrCreateDonor(orgId, request.donor);

    // Step 2: Get next receipt number
    const year = new Date(request.date || new Date()).getFullYear();
    const receiptNo = await getNextReceiptNumber(orgId, year);

    // Step 3: Calculate total
    const total = Object.values(request.breakup).reduce((sum, val) => sum + val, 0);

    // Step 4: Build donation item
    const donation: DonationItem = {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.receipt(receiptNo),
      GSI1PK: Keys.GSI1.donor(donorResolution.donorId),
      GSI1SK: Keys.GSI1.donorReceipt(request.date || getTodayISO(), receiptNo),
      GSI2PK: Keys.GSI2.date(request.date || getTodayISO()),
      GSI2SK: Keys.GSI2.receipt(receiptNo),
      orgId,
      receiptNo,
      date: request.date || getTodayISO(),
      donorId: donorResolution.donorId,
      donor: request.donor,
      breakup: request.breakup,
      payment: request.payment,
      eligible80G: request.eligible80G ?? false,
      total,
      createdAt: now,
    };

    // Step 5: Save to DynamoDB
    await saveDonation(donation);

    // Step 6: Generate and upload PDF
    const pdfKey = await createAndUploadReceipt(donation);
    donation.pdfKey = pdfKey;

    // Step 7: Update donor stats
    if (donorResolution.isNew === false) {
      await updateDonorStats(orgId, donorResolution.donorId, total, donation.date);
    }

    return {
      success: true,
      receiptNo,
      donorId: donorResolution.donorId,
      total,
      pdfKey,
      createdAt: now,
    };
  }
}
```

### DonorResolver

**File**: `lambda/common/services/donor-resolver.ts`

**Purpose**: Deduplicates donors and manages donor profiles

**Deduplication Logic**:
1. If mobile provided → check for existing donor by phone hash
2. If PAN provided → check by PAN hash
3. If email provided → check by email hash
4. If found → return existing `donorId`
5. If not found → create new donor profile with generated ID

```typescript
export class DonorResolver {
  static async resolveOrCreateDonor(
    orgId: string,
    donorInfo: DonorInfo
  ): Promise<DonorResolution> {
    // Try to find existing donor
    const existingDonor = await findDonorByIdentifiers(orgId, donorInfo);

    if (existingDonor) {
      return {
        donorId: existingDonor.donorId,
        isNew: false,
        existingProfile: existingDonor,
      };
    }

    // Create new donor
    const donorId = generateDonorId();
    const donor: DonorItem = {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.donor(donorId),
      donorId,
      primary: {
        name: donorInfo.name,
        mobile: normalizePhone(donorInfo.mobile),
        email: donorInfo.email,
        pan: donorInfo.pan ? maskPAN(donorInfo.pan) : undefined,
      },
      ids: {
        phoneE164: donorInfo.mobile ? normalizePhone(donorInfo.mobile) : undefined,
        panHash: donorInfo.pan ? hashPAN(donorInfo.pan) : undefined,
        emailHash: donorInfo.email ? hashEmail(donorInfo.email) : undefined,
      },
      stats: {
        lifetimeTotal: 0,
        lastDonationDate: '',
        count: 0,
      },
      meta: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    await saveDonor(donor);
    await createAliases(orgId, donorId, donor.ids);

    return {
      donorId,
      isNew: true,
    };
  }
}
```

### ReceiptArtifact (PDF Generation)

**File**: `lambda/common/services/receipt-artifact.ts`

**Purpose**: Generate bilingual PDFs and manage S3 uploads

**Key Methods**:

```typescript
/**
 * Generate PDF receipt buffer
 */
export async function createPDFReceipt(donation: DonationItem): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  // Register Devanagari font
  const fontPath = path.join(__dirname, '../fonts/NotoSansDevanagari.ttf');
  doc.registerFont('Devanagari', fontPath);

  // Render receipt
  renderHeader(doc, donation);
  renderDonorInfo(doc, donation);
  renderDonationTable(doc, donation);
  renderAmountInWords(doc, donation.total);
  renderSignature(doc);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/**
 * Upload PDF to S3
 */
export async function uploadReceiptToS3(
  receiptNo: string,
  pdfBuffer: Buffer
): Promise<string> {
  const key = `receipts/${receiptNo}.pdf`;
  const bucketName = getReceiptsBucketName();

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
  }));

  return key;
}

/**
 * Get presigned download URL
 */
export async function getReceiptDownloadUrl(receiptNo: string): Promise<string> {
  const key = `receipts/${receiptNo}.pdf`;
  const bucketName = getReceiptsBucketName();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

## Data Access Layer

### DynamoDB Client

**File**: `lambda/common/db/dynamo-client.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export function getTableName(): string {
  return process.env.DONATIONS_TABLE_NAME || '';
}

export function getReceiptsBucketName(): string {
  return process.env.RECEIPTS_BUCKET_NAME || '';
}
```

### Counter Service

**File**: `lambda/common/db/counter.ts`

**Purpose**: Atomic receipt number generation

```typescript
export async function getNextReceiptNumber(orgId: string, year: number): Promise<string> {
  const counterKey = {
    PK: Keys.PK.org(orgId),
    SK: Keys.SK.counter(year),
  };

  const result = await docClient.send(new UpdateCommand({
    TableName: getTableName(),
    Key: counterKey,
    UpdateExpression: 'SET currentSeq = if_not_exists(currentSeq, :zero) + :inc, updatedAt = :now',
    ExpressionAttributeValues: {
      ':zero': 0,
      ':inc': 1,
      ':now': Date.now(),
    },
    ReturnValues: 'ALL_NEW',
  }));

  const seq = result.Attributes?.currentSeq || 1;
  return formatReceiptNumber(year, seq);
}

function formatReceiptNumber(year: number, seq: number): string {
  return `${year}-${seq.toString().padStart(5, '0')}`;
}
```

## Utilities

### ID Generator

**File**: `lambda/common/utils/id-generator.ts`

```typescript
export function generateDonorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `D_${timestamp}${random}`;
}
```

### Crypto Utilities

**File**: `lambda/common/utils/crypto.ts`

```typescript
import { createHash } from 'crypto';

export function hashPAN(pan: string): string {
  return createHash('sha256').update(pan.toUpperCase()).digest('hex');
}

export function maskPAN(pan: string): string {
  if (pan.length !== 10) return pan;
  return `${pan.substring(0, 5)}****${pan.charAt(9)}`;
}

export function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}
```

### Normalizers

**File**: `lambda/common/utils/normalizers.ts`

```typescript
export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Convert to E.164 format (assuming India +91)
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return digits.startsWith('+') ? digits : `+${digits}`;
}
```

## API Contracts

### Type Definitions

**File**: `lambda/common/types.ts`

See [DATA_MODEL.md](DATA_MODEL.md) for complete type definitions.

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

### Common Error Codes

| HTTP Code | Meaning | Example |
|-----------|---------|---------|
| 400 | Bad Request | Missing required field |
| 404 | Not Found | Receipt doesn't exist |
| 500 | Internal Server Error | DynamoDB failure |

### Error Logging

```typescript
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  // Log to CloudWatch
  return json(500, {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}
```

## Testing

### Unit Tests

**Framework**: Jest

**Location**: `lambda/common/__tests__/`

**Run Tests**:
```bash
cd lambda/common
npm test
```

**Example Test**:
```typescript
describe('ID Generator', () => {
  it('should generate unique donor IDs', () => {
    const id1 = generateDonorId();
    const id2 = generateDonorId();

    expect(id1).toMatch(/^D_[a-z0-9]+$/);
    expect(id2).toMatch(/^D_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });
});
```

### Integration Tests

**TODO**: End-to-end tests with LocalStack or AWS

## Deployment

### Prerequisites

```bash
# Install AWS CDK CLI
npm install -g aws-cdk

# Configure AWS credentials
aws configure --profile temple-admin

# Verify credentials
aws sts get-caller-identity --profile temple-admin
```

### Build & Deploy

```bash
cd TempleReceiptSystem/TempleReceiptSystemCDK

# Install dependencies
npm install

# Install Lambda dependencies
cd lambda/receipts && npm install
cd ../common && npm install
cd ../..

# Build TypeScript
npm run build

# Synthesize CloudFormation
npm run synth

# Deploy all stacks
npm run deploy

# Or deploy specific stack
cdk deploy FoundationStack --profile temple-admin
cdk deploy ApiStack --profile temple-admin
```

### Deployment Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript |
| `npm run watch` | Watch mode (auto-compile) |
| `npm run synth` | Generate CloudFormation |
| `npm run diff` | Show changes |
| `npm run deploy` | Deploy all stacks |
| `cdk destroy` | Delete stacks |

### Environment Variables

Set in `lib/api-stack.ts` when creating Lambda:

- `DONATIONS_TABLE_NAME`: DynamoDB table name
- `RECEIPTS_BUCKET_NAME`: S3 bucket for PDFs
- `AWS_REGION`: AWS region (ap-south-1)

---

**Last Updated**: October 26, 2025
**Version**: 1.0
