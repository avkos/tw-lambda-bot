import { Stack, StackProps } from 'aws-cdk-lib';
import { LambdaApiConstruct } from './lambda-api-construct';
import { LambdaCronConstruct } from './lambda-cron-construct';
import { CognitoConstruct } from './cognito-construct';
import { Construct } from 'constructs';

export class CdkBackStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new LambdaApiConstruct(this, id)

    new LambdaCronConstruct(this, id)

    new CognitoConstruct(this, id)
  }
}
