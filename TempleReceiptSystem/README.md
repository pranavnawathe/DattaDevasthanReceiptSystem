This project is called **TempleReceiptSystem Backend**.  

It is a donation management and e-receipt system for a temple organization in Maharashtra, India.  

The system will:  
- Allow committee members to enter donation details (donor info, PAN, amount, mode, purpose).  
- Generate bilingual (Marathi + English) e-receipts as PDFs that can be printed or emailed/WhatsApped.  
- Store donation data in DynamoDB (with point-in-time recovery).  
- Store receipt PDFs in a private S3 bucket.  
- Provide an API (via API Gateway + Lambda) to create and fetch receipts, and export data.  
- Allow exporting donations as CSV/Excel for Tally integration (no direct sync initially).  

We are building it using **AWS CDK v2 (TypeScript)**.  
Initial scope is minimal (one stack that creates a DynamoDB table, S3 buckets, Lambda, and an HTTP API).  
Future phases will add export, audit trail, and proper PDF receipts.  

Coding guidelines:  
- TypeScript (strict), Node.js 20 for Lambdas, AWS SDK v3.  
- CDK constructs organized as: `/bin` (entry), `/lib` (stacks), `/lambda` (handlers), `/lambda/common` (types & utils).  
- Follow least-privilege IAM, private S3, DynamoDB PITR enabled.  
- Keep code clear, minimal, and testable.  

Always assume this context when generating code or making suggestions.
