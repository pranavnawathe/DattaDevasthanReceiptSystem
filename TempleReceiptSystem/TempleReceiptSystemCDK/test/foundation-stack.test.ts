import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FoundationStack } from '../lib/foundation-stack';

describe('FoundationStack', () => {
  describe('prod stage', () => {
    const app = new cdk.App();
    const stack = new FoundationStack(app, 'TestFoundationStack', {
      stageName: 'prod',
    });
    const template = Template.fromStack(stack);

    it('creates a DynamoDB table with PAY_PER_REQUEST billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    it('enables point-in-time recovery for prod', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    it('uses RETAIN removal policy for prod DynamoDB', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableLogicalId = Object.keys(tables)[0];
      expect(tables[tableLogicalId].DeletionPolicy).toBe('Retain');
    });

    it('creates two GSIs (GSI1 and GSI2)', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
            ],
          },
          {
            IndexName: 'GSI2',
            KeySchema: [
              { AttributeName: 'GSI2PK', KeyType: 'HASH' },
              { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
            ],
          },
        ],
      });
    });

    it('creates two private S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    it('blocks all public access on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('test stage', () => {
    const app = new cdk.App();
    const stack = new FoundationStack(app, 'TestFoundationStack', {
      stageName: 'test',
    });
    const template = Template.fromStack(stack);

    it('disables point-in-time recovery for test', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: false,
        },
      });
    });

    it('uses DELETE removal policy for test DynamoDB', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableLogicalId = Object.keys(tables)[0];
      expect(tables[tableLogicalId].DeletionPolicy).toBe('Delete');
    });
  });
});
