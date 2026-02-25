import { App } from 'aws-cdk-lib';
import { FoundationStack } from '../lib/foundation-stack';
import { ApiStack } from '../lib/api-stack';
import { UiStack } from '../lib/ui-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new App();
const env = {
  region: 'ap-south-1',
  account: '671924214635',
};

// CDK Pipeline(self-mutating)
new PipelineStack(app, 'TempleReceiptPipelineStack', {
  env,
  connectionArn: 'arn:aws:codeconnections:ap-south-1:671924214635:connection/81131386-f3f1-4dfd-9085-a8a70db091ae',
  repoOwner: 'pranavnawathe',
  repoName: 'DattaDevasthanReceiptSystem',
  branch: 'main',
});

// Standalone stacks (for direct cdk deploy without pipeline)
const foundationStack = new FoundationStack(app, 'FoundationStack', {
  env: { ...env },
  stageName: 'prod',
});

new ApiStack(app, 'TempleApiStack', {
  env,
  donationsTable: foundationStack.donationsTable,
  receiptsBucket: foundationStack.receiptsBucket,
  exportsBucket: foundationStack.exportsBucket,
});

new UiStack(app, 'TempleUiStack', {
  env,
  stageName: 'prod',
});
