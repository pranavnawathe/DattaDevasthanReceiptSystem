import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export interface ApiStackProps extends cdk.StackProps {
  donationsTable: Table;
  receiptsBucket: Bucket;
  exportsBucket: Bucket;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'ReceiptsFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'receipts/index.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: {
        DONATIONS_TABLE_NAME: props.donationsTable.tableName,
        RECEIPTS_BUCKET_NAME: props.receiptsBucket.bucketName,
        EXPORTS_BUCKET_NAME: props.exportsBucket.bucketName,
      },
    });

    // Grant Lambda permissions to access DynamoDB and S3
    props.donationsTable.grantReadWriteData(fn);
    props.receiptsBucket.grantReadWrite(fn);
    props.exportsBucket.grantReadWrite(fn);

    const httpApi = new apigwv2.HttpApi(this, 'TempleHttpApi', {
      corsPreflight: {
        allowOrigins: ['*'], // Allows all origins including http://localhost:5173
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1),
      },
    });

    const integration = new integrations.HttpLambdaIntegration('ReceiptsIntegration', fn);
    httpApi.addRoutes({ path: '/health', methods: [apigwv2.HttpMethod.GET], integration });
    httpApi.addRoutes({ path: '/receipts', methods: [apigwv2.HttpMethod.POST], integration });
    httpApi.addRoutes({ path: '/receipts/{receiptNo}/download', methods: [apigwv2.HttpMethod.GET], integration });

    new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.apiEndpoint });
  }
}
