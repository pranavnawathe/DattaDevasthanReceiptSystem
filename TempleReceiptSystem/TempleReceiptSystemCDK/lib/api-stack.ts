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

    // Receipts Lambda Function
    const receiptsFn = new lambda.Function(this, 'ReceiptsFn', {
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
    props.donationsTable.grantReadWriteData(receiptsFn);
    props.receiptsBucket.grantReadWrite(receiptsFn);
    props.exportsBucket.grantReadWrite(receiptsFn);

    // Ranges Lambda Function
    const rangesFn = new lambda.Function(this, 'RangesFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'ranges/index.handler',
      code: lambda.Code.fromAsset('lambda'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: props.donationsTable.tableName,
      },
    });

    // Grant Ranges Lambda permissions to access DynamoDB
    props.donationsTable.grantReadWriteData(rangesFn);

    const httpApi = new apigwv2.HttpApi(this, 'TempleHttpApi', {
      corsPreflight: {
        allowOrigins: ['*'], // Allows all origins including http://localhost:5173
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Receipts routes
    const receiptsIntegration = new integrations.HttpLambdaIntegration('ReceiptsIntegration', receiptsFn);
    httpApi.addRoutes({ path: '/health', methods: [apigwv2.HttpMethod.GET], integration: receiptsIntegration });
    httpApi.addRoutes({ path: '/receipts', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST], integration: receiptsIntegration });
    httpApi.addRoutes({ path: '/receipts/search', methods: [apigwv2.HttpMethod.GET], integration: receiptsIntegration });
    httpApi.addRoutes({ path: '/receipts/donor/{donorId}', methods: [apigwv2.HttpMethod.GET], integration: receiptsIntegration });
    httpApi.addRoutes({ path: '/receipts/{receiptNo}/download', methods: [apigwv2.HttpMethod.GET], integration: receiptsIntegration });

    // Ranges routes
    const rangesIntegration = new integrations.HttpLambdaIntegration('RangesIntegration', rangesFn);
    httpApi.addRoutes({ path: '/ranges', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST], integration: rangesIntegration });
    httpApi.addRoutes({ path: '/ranges/{rangeId}', methods: [apigwv2.HttpMethod.GET], integration: rangesIntegration });
    httpApi.addRoutes({ path: '/ranges/{rangeId}/status', methods: [apigwv2.HttpMethod.PUT], integration: rangesIntegration });

    new cdk.CfnOutput(this, 'HttpApiUrl', { value: httpApi.apiEndpoint });
  }
}
