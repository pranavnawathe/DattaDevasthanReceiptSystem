import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { TempleAppStage } from './temple-app-stage';

export interface PipelineStackProps extends cdk.StackProps {
  connectionArn: string;
  repoOwner: string;
  repoName: string;
  branch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const source = pipelines.CodePipelineSource.connection(
      `${props.repoOwner}/${props.repoName}`,
      props.branch,
      { connectionArn: props.connectionArn },
    );

    const pipeline = new pipelines.CodePipeline(this, 'TemplePipeline', {
      pipelineName: 'TempleReceiptSystem',
      crossAccountKeys: false,
      synth: new pipelines.ShellStep('Synth', {
        input: source,
        commands: [
          // Install Lambda dependencies
          'cd TempleReceiptSystem/TempleReceiptSystemCDK/lambda/common && npm ci',
          'cd TempleReceiptSystem/TempleReceiptSystemCDK/lambda/receipts && npm ci',
          'cd TempleReceiptSystem/TempleReceiptSystemCDK/lambda/ranges && npm ci',
          // Run unit tests
          'cd TempleReceiptSystem/TempleReceiptSystemCDK/lambda/common && npm test',
          // Build UI
          'cd ui && npm ci && npm run build',
          // Install CDK deps and synth
          'cd TempleReceiptSystem/TempleReceiptSystemCDK && npm ci',
          'cd TempleReceiptSystem/TempleReceiptSystemCDK && npx cdk synth',
        ],
        primaryOutputDirectory: 'TempleReceiptSystem/TempleReceiptSystemCDK/cdk.out',
      }),
    });

    // Test stage
    const testStage = new TempleAppStage(this, 'Test', {
      env: { account: '671924214635', region: 'ap-south-1' },
      stageName: 'test',
    });
    pipeline.addStage(testStage);

    // Production stage (with manual approval gate)
    const prodStage = new TempleAppStage(this, 'Prod', {
      env: { account: '671924214635', region: 'ap-south-1' },
      stageName: 'prod',
    });
    pipeline.addStage(prodStage, {
      pre: [
        new pipelines.ManualApprovalStep('PromoteToProd', {
          comment: 'Review the test environment and approve production deployment.',
        }),
      ],
    });
  }
}
