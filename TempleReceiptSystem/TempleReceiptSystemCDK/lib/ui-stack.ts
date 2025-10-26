import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class UiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for hosting the UI
    const uiBucket = new s3.Bucket(this, 'UiBucket', {
      bucketName: 'datta-devasthan-receipts',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing fallback
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Deploy UI files from dist/ folder
    new s3deploy.BucketDeployment(this, 'DeployUi', {
      sources: [s3deploy.Source.asset('../../ui/dist')],
      destinationBucket: uiBucket,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UiBucketName', {
      value: uiBucket.bucketName,
      description: 'S3 bucket name for UI',
    });

    new cdk.CfnOutput(this, 'UiBucketWebsiteUrl', {
      value: uiBucket.bucketWebsiteUrl,
      description: 'S3 website URL (HTTP) - Use this to access the UI',
    });
  }
}
