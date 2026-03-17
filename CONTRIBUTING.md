# Contributing to Datta Devasthan Receipt System

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 9+
- **AWS CLI v2** configured with `temple-admin` profile
- **AWS CDK CLI** (`npm install -g aws-cdk`)

## Repository Structure

```
/ (repo root)
├── package.json                           # Root scripts — start here
├── ui/                                    # React frontend (Vite + Tailwind)
├── TempleReceiptSystem/
│   └── TempleReceiptSystemCDK/
│       ├── bin/                           # CDK app entry points
│       ├── lib/                           # CDK stack definitions
│       └── lambda/
│           ├── common/                    # Shared services, types, utils (TypeScript source)
│           └── receipts/                  # Single Lambda handler (index.ts)
├── docs/                                  # Project documentation
└── CLAUDE.md                              # AI assistant instructions
```

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/pranavnawathe/DattaDevasthanReceiptSystem.git
cd DattaDevasthanReceiptSystem/code

npm run install:all   # installs ui + CDK + lambda deps in one step
```

### 2. Run the UI locally

```bash
npm run dev
# Opens at http://localhost:5173, points to production API
```

To use a different API URL, edit `ui/src/services/api.ts` and change `API_BASE_URL` (don't commit).

### 3. Run tests

```bash
npm test
```

### 4. Build Lambda and verify

```bash
npm run build:lambda   # compile Lambda TypeScript → JS
```

## Deployment

### Normal workflow — push to main

Pushing to `main` triggers CodePipeline automatically:

1. Deploys to **test environment** (separate DynamoDB, API, S3)
2. Waits for **manual approval** in AWS Console
3. Deploys to **production**

### Manual hotfix deploy

Use only when you need to bypass the pipeline (e.g. emergency fix already in prod state):

```bash
npm run deploy
# equivalent to: build:lambda + cdk deploy (using temple-backend.ts entry point)
```

> ⚠️ Manual deploys skip the test stage. Prefer the pipeline for normal changes.

## Lambda Build — Important

Lambda TypeScript **must be compiled to JS before deploying**. The CDK packages the
`lambda/` directory as-is; it does not run `tsc` automatically.

```bash
npm run build:lambda   # always run this before npm run deploy
```

The `deploy` script already includes this step, but if you edit Lambda code and push
to git without running `build:lambda` first, the pipeline will deploy stale JS.

**How the build works:**

- `lambda/receipts/tsconfig.json` has `rootDir/outDir: ".."` (the `lambda/` level)
- Running `tsc` from `lambda/receipts/` compiles `index.ts` → `receipts/index.js`
  and transitively compiles all `common/*.ts` → `common/*.js`
- Both the handler and shared code are rebuilt in one pass

## Making Changes

### Branch strategy

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run build:lambda` to compile Lambda TS
4. Run `npm test` locally
5. Commit compiled JS alongside TS source
6. Open a PR against `main`
7. Pipeline deploys to test on merge; approve for production

### Code style

- **TypeScript** throughout (CDK, Lambda, UI)
- **Prettier** for formatting (`.prettierrc` at repo root)
- 2-space indentation, single quotes
- Run `npm run format` from `TempleReceiptSystem/TempleReceiptSystemCDK/` to auto-format

### Key conventions

- **DynamoDB**: Single-table design. All entities use `PK=ORG#<orgId>`, `SK` varies by type
- **Receipt numbers**: Stored as `NNNNN-YYYY-YY` (e.g. `00071-2025-26`), displayed as `NNNNN/YYYY-YY`
- **Financial year**: April–March. Counter resets each April, allocated atomically via DynamoDB
- **Organization ID**: Hardcoded as `DATTA-SAKHARAPA` (will come from auth later)
- **Bilingual**: UI and PDFs support Marathi (Devanagari) + English

## Architecture Quick Reference

| Layer | Technology | Key files |
|-------|-----------|-----------|
| Infrastructure | AWS CDK v2 (TypeScript) | `lib/foundation-stack.ts`, `lib/api-stack.ts`, `lib/ui-stack.ts` |
| API | API Gateway HTTP API + Lambda | `lambda/receipts/index.ts` |
| Database | DynamoDB (single table: `TempleReceipts`) | `lambda/common/db/` |
| Frontend | React 19 + Vite + Tailwind | `ui/src/` |
| CI/CD | CodePipeline + CodeBuild | `lib/pipeline-stack.ts` |

## Common Tasks

### Add a new API endpoint

1. Add the route in `lib/api-stack.ts`
2. Add the handler logic in `lambda/receipts/index.ts`
3. Add shared service code in `lambda/common/services/`
4. Add types in `lambda/common/types.ts`
5. Run `npm run build:lambda`

### Add a new UI page

1. Create the page component in `ui/src/pages/`
2. Add the route in `ui/src/App.tsx` (hash-based routing)
3. Add API methods in `ui/src/services/api.ts` if needed

### Modify DynamoDB schema

1. Update types in `lambda/common/types.ts`
2. If adding a new GSI, update `lib/foundation-stack.ts`
3. Update relevant services in `lambda/common/services/`
4. Run `npm run build:lambda`

## Need Help?

- Check `docs/` for detailed documentation
- See `docs/PROJECT_OVERVIEW.md` for system overview
