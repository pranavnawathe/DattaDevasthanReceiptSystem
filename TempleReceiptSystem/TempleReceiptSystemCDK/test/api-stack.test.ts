import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FoundationStack } from '../lib/foundation-stack';
import { ApiStack } from '../lib/api-stack';

describe('ApiStack', () => {
  const app = new cdk.App();
  const foundation = new FoundationStack(app, 'TestFoundation', {
    stageName: 'prod',
  });
  const stack = new ApiStack(app, 'TestApiStack', {
    donationsTable: foundation.donationsTable,
    receiptsBucket: foundation.receiptsBucket,
    exportsBucket: foundation.exportsBucket,
  });
  const template = Template.fromStack(stack);

  it('creates two Lambda functions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 2);
  });

  it('uses Node.js 20.x runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
    });
  });

  it('uses ARM64 architecture', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: ['arm64'],
    });
  });

  it('creates an HTTP API Gateway', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  it('configures CORS on the API', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      CorsConfiguration: {
        AllowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
        AllowOrigins: ['*'],
      },
    });
  });

  it('creates API routes for receipts', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'GET /health',
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'POST /receipts',
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'GET /receipts',
    });
  });

  it('creates API routes for ranges', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'GET /ranges',
    });
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      RouteKey: 'POST /ranges',
    });
  });

  it('outputs the API URL', () => {
    template.hasOutput('HttpApiUrl', {});
  });
});
