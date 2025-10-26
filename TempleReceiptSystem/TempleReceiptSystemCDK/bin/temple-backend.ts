import { App } from 'aws-cdk-lib';
import { FoundationStack } from '../lib/foundation-stack';
import { ApiStack } from '../lib/api-stack';
import { UiStack } from '../lib/ui-stack';

const app = new App();
const env = {
  region: 'ap-south-1',
  account: '671924214635'
}

const foundationStack = new FoundationStack(app, 'FoundationStack', {
  env: { ...env }
});

new ApiStack(app, 'TempleApiStack', {
  env,
  donationsTable: foundationStack.donationsTable,
  receiptsBucket: foundationStack.receiptsBucket,
  exportsBucket: foundationStack.exportsBucket,
});

new UiStack(app, 'TempleUiStack', {
  env,
});
