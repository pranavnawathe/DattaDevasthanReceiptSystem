# TempleReceiptSystemCDK

AWS CDK v2 (TypeScript) infrastructure for the Temple Receipt System backend.

## Features
- DynamoDB table for donations (with PITR)
- Private S3 buckets for receipts/exports
- Lambda/API Gateway for receipt management
- Minimal, secure, testable TypeScript code

## Tech Stack
- AWS CDK v2 (TypeScript)
- Node.js 20 (for Lambdas)
- AWS SDK v3

## Structure
```
/bin/temple-backend.ts      # CDK app entry
/lib/foundation-stack.ts    # Infra stack (DynamoDB, S3)
/lambda/                    # Lambda handlers (future)
/lambda/common/             # Shared types/utils (future)
```

## Setup
```sh
npm install
npm run build
npm run synth
```

## Deployment
```sh
npm run deploy
```

## Notes
- All buckets are private
- DynamoDB has point-in-time recovery enabled
- IAM is least-privilege
- API routes and Lambdas will be added in future phases
