# Testing Guide - Temple Receipt System

This guide covers all testing approaches for Phase 1 (and future phases) of the Temple Receipt System.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Unit Testing (Jest)](#unit-testing-jest)
3. [Manual Testing](#manual-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Testing Checklist](#testing-checklist)

---

## Quick Start

### Prerequisites

```bash
# Navigate to lambda/common directory
cd TempleReceiptSystem/TempleReceiptSystemCDK/lambda/common

# Install dependencies
npm install
```

### Run All Tests

```bash
# Run unit tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

---

## Unit Testing (Jest)

### Test Structure

All unit tests are located in `lambda/common/__tests__/`:

```
lambda/common/
├── __tests__/
│   ├── normalizers.test.ts    # Tests for normalizers
│   ├── crypto.test.ts          # Tests for crypto utilities
│   └── id-generator.test.ts    # Tests for ID generation
├── utils/
│   ├── normalizers.ts
│   ├── crypto.ts
│   └── id-generator.ts
└── package.json
```

### Running Specific Test Files

```bash
# Test normalizers only
npm test -- normalizers.test.ts

# Test crypto only
npm test -- crypto.test.ts

# Test with verbose output
npm test -- --verbose
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

**Coverage Thresholds** (configured in `jest.config.js`):
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Writing New Tests

Example test structure:

```typescript
import { functionToTest } from '../utils/module';

describe('functionToTest', () => {
  it('should handle valid input', () => {
    expect(functionToTest('input')).toBe('expected-output');
  });

  it('should handle invalid input', () => {
    expect(functionToTest(null)).toBeNull();
  });
});
```

---

## Manual Testing

### Quick Validation Script

We've created a manual testing script that you can run locally to validate all utilities:

```bash
cd TempleReceiptSystem/TempleReceiptSystemCDK/lambda/common

# Install ts-node if not already installed
npm install -D ts-node

# Run manual tests
npx ts-node test-manual.ts
```

**What it tests:**
- ✅ Phone normalization (10-digit, +91, spaces, dashes)
- ✅ Email normalization (lowercase, trim)
- ✅ PAN normalization (uppercase, validation)
- ✅ Date handling (IST timezone)
- ✅ PAN/Email hashing and masking
- ✅ Phone masking
- ✅ Donor ID generation (consistency, priority)
- ✅ Receipt number generation and parsing
- ✅ DynamoDB key builders
- ✅ Log sanitization (PII protection)

**Expected Output:**

```
================================================================================
TEMPLE RECEIPT SYSTEM - MANUAL TEST SCRIPT
================================================================================

📱 Test 1: Phone Normalization
Input: "9876543210" → +919876543210
Input: "+91 98765 43210" → +919876543210
...

✅ All manual tests completed!
```

---

## Integration Testing

### Testing with Local DynamoDB

For testing DynamoDB operations without deploying to AWS:

#### 1. Install DynamoDB Local

```bash
# Using Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Or download from AWS
# https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
```

#### 2. Create Test Script

Create `lambda/common/__tests__/integration/dynamo.integration.test.ts`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'local',
  endpoint: 'http://localhost:8000',
});

const docClient = DynamoDBDocumentClient.from(client);

describe('DynamoDB Integration Tests', () => {
  it('should write and read an item', async () => {
    // Test your database operations here
  });
});
```

#### 3. Run Integration Tests

```bash
# Start DynamoDB Local first
docker run -p 8000:8000 amazon/dynamodb-local

# Run integration tests
npm test -- integration
```

---

## End-to-End Testing

### Testing After Deployment

Once you deploy the CDK stack, you can test the actual API:

#### 1. Deploy to AWS

```bash
cd TempleReceiptSystem/TempleReceiptSystemCDK

# Build
npm run build

# Deploy
npm run deploy
```

After deployment, note the API Gateway URL from the output:
```
Outputs:
TempleApiStack.HttpApiUrl = https://abc123.execute-api.ap-south-1.amazonaws.com
```

#### 2. Test Health Endpoint

```bash
# Test health endpoint
curl https://YOUR_API_URL/health

# Expected response:
# {"ok":true,"service":"temple-backend","ts":1734567890000}
```

#### 3. Test POST /receipts (Current Stub)

```bash
curl -X POST https://YOUR_API_URL/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "donor": {
      "name": "राम शिंदे",
      "mobile": "9876543210",
      "pan": "ABCDE1234F",
      "email": "donor@example.com"
    },
    "breakup": {
      "UTSAV_DANAGI": 500
    },
    "payment": {
      "mode": "UPI",
      "ref": "UPI-123"
    },
    "eligible80G": true
  }'

# Expected response (stub):
# {"message":"Stub: receipt created (no DB yet)","receiptNo":"TEST-...","input":{...}}
```

#### 4. Check DynamoDB Table

```bash
# List items in DynamoDB (replace TABLE_NAME)
aws dynamodb scan \
  --table-name FoundationStack-DonationsTableXXXXXXXX \
  --region ap-south-1
```

#### 5. Check S3 Buckets

```bash
# List S3 buckets
aws s3 ls

# List receipts bucket contents
aws s3 ls s3://foundationstack-receiptsbucketxxxxx/
```

---

## Testing Checklist

### Phase 1 - Foundation (Current)

- [x] **Unit Tests**
  - [x] Phone normalization (E.164)
  - [x] Email normalization (lowercase, trim)
  - [x] PAN normalization (uppercase, validation)
  - [x] PAN hashing and masking
  - [x] Email hashing and masking
  - [x] Phone masking
  - [x] Donor ID generation (consistency)
  - [x] Receipt number generation
  - [x] Receipt number parsing
  - [x] Log sanitization

- [ ] **Integration Tests** (TODO after Phase 2)
  - [ ] DynamoDB counter operations
  - [ ] Alias lookups
  - [ ] Donor profile queries
  - [ ] Donation queries

- [ ] **Manual Testing**
  - [ ] Run manual test script
  - [ ] Verify all outputs match expected values
  - [ ] Test edge cases manually

### Phase 2 - Donation Creation (Next)

- [ ] **Unit Tests**
  - [ ] Donor resolution logic
  - [ ] Donation service orchestration
  - [ ] S3 artifact creation

- [ ] **Integration Tests**
  - [ ] Full donation creation flow
  - [ ] Concurrent receipt creation (race conditions)
  - [ ] Duplicate donor handling

- [ ] **E2E Tests**
  - [ ] POST /receipts creates donation in DynamoDB
  - [ ] Donor profile is created/updated
  - [ ] Alias items are created
  - [ ] Receipt artifact is stored in S3

---

## Test Data

### Valid Test Cases

**Indian Phone Numbers:**
```
9876543210       → +919876543210
+91 9876543210   → +919876543210
091-9876543210   → +919876543210
+91-98765-43210  → +919876543210
```

**PAN Numbers:**
```
ABCDE1234F
AAAPL1234C
BBBPL5678D
```

**Email Addresses:**
```
donor@example.com
user+tag@example.co.in
Test.User@Example.COM  → test.user@example.com
```

### Invalid Test Cases

**Invalid Phones:**
```
123            (too short)
abcdefghij     (not digits)
+15551234567   (non-Indian)
```

**Invalid PANs:**
```
ABC1234        (too short)
ABCDE12345     (wrong pattern)
12345ABCDE     (wrong order)
```

**Invalid Emails:**
```
notanemail
missing@domain
@nodomain.com
```

---

## Debugging Failed Tests

### Common Issues

#### 1. Import Errors

```bash
# Error: Cannot find module '../utils/normalizers'
# Solution: Check file paths and ensure TypeScript compilation
npm run build
```

#### 2. TypeScript Errors

```bash
# Run type checking
npm run type-check
```

#### 3. Test Timeouts

```javascript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### 4. Module Resolution

If Jest can't find modules, update `jest.config.js`:

```javascript
module.exports = {
  // ...
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

---

## Performance Testing

### Load Testing (Future)

After Phase 2 implementation, test concurrent donations:

```bash
# Using Artillery
npm install -g artillery

# Create artillery config
artillery quick --count 10 --num 100 \
  https://YOUR_API_URL/receipts
```

**Expected Performance:**
- Single donation creation: < 500ms
- 100 concurrent requests: < 2s p99
- DynamoDB capacity: Auto-scales

---

## CI/CD Integration (Future)

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd lambda/common && npm install
      - name: Run tests
        run: cd lambda/common && npm test
      - name: Check coverage
        run: cd lambda/common && npm run test:coverage
```

---

## Next Steps

1. **Run unit tests** to ensure Phase 1 foundation works correctly
2. **Run manual test script** to visually verify all utilities
3. **Proceed to Phase 2** to implement actual donation creation
4. **Add integration tests** once DynamoDB operations are implemented
5. **Deploy and test** with real AWS resources

---

## Questions or Issues?

If tests fail or you encounter issues:

1. Check this guide for common solutions
2. Review test output for specific error messages
3. Run manual test script to isolate the issue
4. Check TypeScript compilation: `npm run type-check`
5. Verify dependencies are installed: `npm install`

---

*Last Updated: 2025-10-18*
*Version: 1.0 - Phase 1*
