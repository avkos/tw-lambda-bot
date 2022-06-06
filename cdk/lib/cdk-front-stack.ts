import { Stack, StackProps } from 'aws-cdk-lib';
import { FrontConstruct } from './front-construct';
import { Construct } from 'constructs';

export class CdkFrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    new FrontConstruct(this, id)
  }
}
