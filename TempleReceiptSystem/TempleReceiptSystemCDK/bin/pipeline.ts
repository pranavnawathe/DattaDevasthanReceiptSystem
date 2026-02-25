import { App } from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new App();

new PipelineStack(app, 'TempleReceiptPipelineStack', {
  env: { account: '671924214635', region: 'ap-south-1' },
  connectionArn:
    app.node.tryGetContext('connectionArn') ||
    'arn:aws:codeconnections:ap-south-1:671924214635:connection/81131386-f3f1-4dfd-9085-a8a70db091ae',
  repoOwner: app.node.tryGetContext('repoOwner') || 'pranavnawathe',
  repoName: app.node.tryGetContext('repoName') || 'DattaDevasthanReceiptSystem',
  branch: app.node.tryGetContext('branch') || 'main',
});

app.synth();
