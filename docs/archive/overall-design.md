# Temple Donation & E-Receipt Management System – Design Document

## 1. Overview
The **Temple Donation & E-Receipt System** digitizes donation intake for a temple trust in Maharashtra (bilingual Marathi/English), replaces handwritten receipts, generates e-receipts (PDF/email), and exports CSV/Excel for Tally.  
Backend is built using **AWS CDK (TypeScript)** with a fully serverless architecture using API Gateway, Lambda, DynamoDB, S3, and (later) SES for email delivery.

---

## 2. Use Case & Goals

### 2.1 Users
| Role | Actions |
|------|----------|
| **Committee (Data Entry)** | Create donations, print/email receipts, search donors/receipts |
| **Treasurer / Auditor** | Export data for Tally, verify totals, audit receipts |
| **Donor** | Receives e-receipt |

### 2.2 Goals
- Digitize receipts (80G compliant)
- Eliminate manual Tally data entry
- Enable quick donor lookups
- Ensure auditability and traceability
- Keep operational cost very low

---

## 3. Core Functional Requirements
- Donation entry (donor info, purpose breakup, payment details)
- Auto sequential **receiptNo** per year
- Generate bilingual PDF receipts and email them
- Search: by donor (phone/PAN/email/name), by date or receipt
- Export donations as CSV/Excel for Tally
- Role-based access control
- Full audit trail of edits and receipts

---

## 4. Non-Functional Requirements
| Category | Requirement |
|-----------|-------------|
| **Scalability** | Serverless; auto-scales during peak festivals |
| **Availability** | ≥ 99.9% uptime target |
| **Security** | Least-privilege IAM, encryption at rest (DynamoDB/S3), TLS in transit |
| **Cost** | Pay-per-use; near-zero idle cost |
| **Localization** | Marathi + English receipt templates |

---

## 5. Business Context
- Managed by a **registered religious trust** (e.g., Shri Datta Devasthan, Sakharapa)
- Must include **trust PAN**, **80G registration number**, and legal details on receipts
- Uses **Tally** as accounting system
- Donation data stored in the **temple’s AWS account**
- Expected volume: 5 000 – 10 000 receipts per year

---

## 6. Architecture Overview

Admin UI (future) / Admin Client
|
v
API Gateway (HTTP API)
|
v
Lambda ───────────┬───────────> S3 (receipts/, exports/)
| |
v └───────────> SES (email) [later]
DynamoDB (single table)

pgsql
Copy code

### Stacks
- **FoundationStack** – DynamoDB (single table) + S3 (Receipts, Exports)
- **ApiStack** – Lambda (ReceiptsFn) + HTTP API routes + IAM grants
- *(Later)* **AuthStack** – Cognito + IAM roles
- *(Later)* **NotificationStack** – SES/SNS integrations

---

## 7. Data Model – Single Table with Donor & Alias

### 7.1 Keys
- **PK** = `ORG#<orgId>`
- **SK** = item type + identifier  
  - Donation → `RCPT#<yyyy>-<seq>`  
  - Donor → `DONOR#<donorId>`  
  - Alias → `ALIAS#<type>#<value>` (type ∈ {PAN, PHONE, EMAIL})

### 7.2 GSIs
| Index | Partition Key | Sort Key | Purpose |
|-------|---------------|----------|----------|
| **GSI1** | `DONOR#<donorId>` | `DATE#<yyyy-mm-dd>#RCPT#<receiptNo>` | All donations for a donor |
| **GSI2** | `DATE#<yyyy-mm-dd>` | `RCPT#<receiptNo>` | Date-range exports |

### 7.3 Item Examples

**Donation item**
```json
{
  "PK": "ORG#DATTA-SAKHARAPA",
  "SK": "RCPT#2025-00071",
  "GSI1PK": "DONOR#D_8b62f34a12ab",
  "GSI1SK": "DATE#2025-10-18#RCPT#2025-00071",
  "GSI2PK": "DATE#2025-10-18",
  "GSI2SK": "RCPT#2025-00071",
  "orgId": "DATTA-SAKHARAPA",
  "receiptNo": "2025-00071",
  "date": "2025-10-18",
  "donorId": "D_8b62f34a12ab",
  "donor": {
    "name": "राम शिंदे",
    "panMasked": "ABCDE****F",
    "panHash": "h:sha256:...",
    "mobile": "+9198XXXXXXXX",
    "email": "donor@example.com",
    "address": { "city": "Sakharapa", "state": "MH" }
  },
  "breakup": { "UTSAV_DANAGI": 500 },
  "payment": { "mode": "UPI", "ref": "UPI-123" },
  "eligible80G": true,
  "total": 500,
  "pdfKey": "receipts/2025/2025-00071.pdf",
  "createdAt": 1734550000000
}
Donor profile item

json
Copy code
{
  "PK": "ORG#DATTA-SAKHARAPA",
  "SK": "DONOR#D_8b62f34a12ab",
  "donorId": "D_8b62f34a12ab",
  "primary": { "name": "राम शिंदे", "mobile": "+9198XXXXXXXX", "email": "donor@example.com" },
  "ids": { "panHash": "h:sha256:...", "emailHash": "h:sha256:...", "phoneE164": "+9198XXXXXXXX" },
  "stats": { "lifetimeTotal": 12500, "lastDonationDate": "2025-10-18", "count": 7 },
  "meta": { "createdAt": 1734550000000 }
}
Alias item

json
Copy code
{
  "PK": "ORG#DATTA-SAKHARAPA",
  "SK": "ALIAS#PHONE#+9198XXXXXXXX",
  "donorId": "D_8b62f34a12ab"
}
7.4 Donor ID Strategy
Stable ID derived from PAN / phone / email (hash + orgId) → D_<hash>

Fallback to UUID if none provided

Never index raw PAN; store panHash for lookups and panMasked for display

8. Request Flows
8.1 Create Donation (POST /receipts)
Normalize inputs (phone → E.164, email → lowercase)

Resolve or generate donorId

Check Alias (ALIAS#PHONE#<e164> / ALIAS#PAN#hash / ALIAS#EMAIL#hash)

If none, create new donorId

Write Donation item (with GSI1/GSI2 fields)

Upsert Donor profile (update stats)

Upsert Alias items for identifiers

Create receipt artifact in S3 (text now; PDF later)

Return { receiptNo, donorId, total, pdfKey }

8.2 Find Donor by Phone/PAN/Email
Read Alias item (ALIAS#PHONE#+91…) → get donorId

Query GSI1 with DONOR#<donorId> → all donations for that donor

9. API Endpoints
Method	Path	Description	Status
GET	/health	Health check	✅
POST	/receipts	Create donation entry + S3 artifact + donor/alias updates	✅ (stub)
GET	/receipts	List donations (date/org filter)	🚧
GET	/receipts/{id}	Fetch one receipt	🚧
GET	/donors/lookup	Lookup donor by phone/PAN/email (via Alias)	🚧
GET	/donors/{donorId}/receipts	List all receipts for donor (GSI1)	🚧
GET	/export	Generate CSV/Excel export to S3	🚧

10. Security & Privacy
Private S3 buckets; DynamoDB encrypted (KMS)

Mask PAN in responses; hash for lookup

Limit access to donor PII by role

Use signed URLs for receipt downloads

CloudWatch logging and future alerts

11. CDK Implementation Notes
DynamoDB Indexes
ts
Copy code
table.addGlobalSecondaryIndex({
  indexName: 'GSI1', // donor → donations
  partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL
});

table.addGlobalSecondaryIndex({
  indexName: 'GSI2', // date → receipts
  partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL
});
S3 Buckets
receipts/<year>/<receiptNo>.pdf – versioned & immutable

exports/<yyyymmdd>/donations.csv – temporary reports

12. Roadmap
Phase	Description	Timeline
1 (MVP)	POST /receipts with donor + alias logic; text artifact → S3	✅ In progress
2	HTML→PDF receipt generation + SES email	Q4 2025
3	Admin UI (React + Cognito auth)	Q1 2026
4	Scheduled exports and analytics dashboard	Q2 2026
5	WhatsApp integration & UPI QR on receipts	Q3 2026

13. Open Questions
How to handle alias collisions (phone reuse etc.)?

Should donor profile updates apply retroactively?

Retention policy for PII (7 years default)?

14. Summary
A single DynamoDB table stores Donation, Donor, and Alias items.
Alias entries enable fast lookups by phone/PAN/email, while GSI1 efficiently lists all donations for a donor.
The design remains fully serverless, cost-efficient, and audit-ready for long-term temple use.

yaml
Copy code
---

✅ You can copy this entire block into `DESIGN.md` in your repo — it’s 100% Markdown-compliant and