#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {CdkBackStack} from '../lib/cdk-back-stack';
import {CdkFrontStack} from '../lib/cdk-front-stack';

const app = new cdk.App();
new CdkBackStack(app, 'TwBot');
new CdkFrontStack(app, 'TwBotFront');
