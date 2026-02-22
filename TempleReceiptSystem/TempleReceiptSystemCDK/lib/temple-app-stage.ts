import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FoundationStack } from './foundation-stack';
import { ApiStack } from './api-stack';
import { UiStack } from './ui-stack';

export interface TempleAppStageProps extends cdk.StageProps {
  stageName: 'test' | 'prod';
}

export class TempleAppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: TempleAppStageProps) {
    super(scope, id, props);

    const foundation = new FoundationStack(this, 'FoundationStack', {
      stageName: props.stageName,
    });

    new ApiStack(this, 'TempleApiStack', {
      donationsTable: foundation.donationsTable,
      receiptsBucket: foundation.receiptsBucket,
      exportsBucket: foundation.exportsBucket,
    });

    new UiStack(this, 'TempleUiStack', {
      stageName: props.stageName,
    });
  }
}
