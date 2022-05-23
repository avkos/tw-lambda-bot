import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as cdk from 'aws-cdk-lib'
import {lambdaEnvs, getRole} from "./helpers";

const runEveryMinutes = 5

export class LambdaCronConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, `${id}CronLambdaConstruct`);

        const functionName = `${id}CronLambda`
        const cronLambda = new lambda.Function(scope, functionName, {
            environment: lambdaEnvs,
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('../dist'),
            handler: 'cron.handler',
            timeout: cdk.Duration.seconds(300),
            role: getRole(scope, id),
        })
        const eventRule = new events.Rule(scope, `${id}Rule`, {
            ruleName: `cron-for-${cronLambda.functionName}`,
            schedule: events.Schedule.expression(`rate(${runEveryMinutes} minutes)`),
        })
        eventRule.addTarget(
            new targets.LambdaFunction(cronLambda, {
                event: events.RuleTargetInput.fromObject({}),
            })
        );

        targets.addLambdaPermission(eventRule, cronLambda);

        new cdk.CfnOutput(scope, `${id}CronLambdaArn`, {
            value: cronLambda.functionArn
        });
    }
}
