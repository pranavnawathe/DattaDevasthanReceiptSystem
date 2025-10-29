import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table, ProjectionType, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';

export class FoundationStack extends Stack {
  public readonly donationsTable: Table;
  public readonly receiptsBucket: Bucket;
  public readonly exportsBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    // Single table design supporting multiple entity types:
    // - Receipts: PK=ORG#<orgId>, SK=RCPT#<receiptNumber>
    // - Donors: PK=ORG#<orgId>, SK=DONOR#<donorId>
    // - Ranges: PK=ORG#<orgId>, SK=RANGE#<rangeId>
    // - Aliases: PK=ORG#<orgId>, SK=ALIAS#<type>#<value>
    // - Counters (Legacy): PK=ORG#<orgId>, SK=COUNTER#RECEIPT#<year>
    this.donationsTable = new Table(this, 'DonationsTable', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      encryption: TableEncryption.AWS_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN, // Retain data on stack deletion
    });

    // GSI1: donor lookups (DONOR#<donorId> → DATE#<date>#RCPT#<receiptNo>)
    this.donationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // GSI2: date range queries (DATE#<date> → RCPT#<receiptNo>)
    this.donationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // S3 Buckets
    this.receiptsBucket = new Bucket(this, 'ReceiptsBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    this.exportsBucket = new Bucket(this, 'ExportsBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN, 
    });
  }
}
