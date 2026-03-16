import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../lib/pipeline-stack';

describe('PipelineStack', () => {
  const app = new cdk.App();
  const stack = new PipelineStack(app, 'TestPipelineStack', {
    env: { account: '671924214635', region: 'ap-south-1' },
    connectionArn: 'arn:aws:codeconnections:ap-south-1:671924214635:connection/test-id',
    repoOwner: 'test-owner',
    repoName: 'test-repo',
    branch: 'main',
  });
  const template = Template.fromStack(stack);

  it('creates a CodePipeline', () => {
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
  });

  it('creates CodeBuild projects for synth and self-mutation', () => {
    const projects = template.findResources('AWS::CodeBuild::Project');
    expect(Object.keys(projects).length).toBeGreaterThanOrEqual(2);
  });

  it('creates an S3 artifacts bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {});
  });
});
