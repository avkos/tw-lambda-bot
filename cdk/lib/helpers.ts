import * as iam from "aws-cdk-lib/aws-iam";
import {Construct} from "constructs";
import {Effect, ManagedPolicy, PolicyDocument, PolicyStatement} from "aws-cdk-lib/aws-iam";

export const lambdaEnvs: { [key: string]: string } = {
    DYNAMODB_HOLD_TABLE: process.env.DYNAMODB_HOLD_TABLE!,
    DYNAMODB_SETTING_TABLE: process.env.DYNAMODB_SETTING_TABLE!,
    DYNAMODB_STRATEGY_TABLE: process.env.DYNAMODB_STRATEGY_TABLE!,
    BINANCE_API_KEY: process.env.BINANCE_API_KEY!,
    BINANCE_API_SECRET: process.env.BINANCE_API_SECRET!,
}

let lambdaARole: iam.Role
export const getRole = (scope: Construct, id: string): iam.Role => {
    if (lambdaARole) {
        return lambdaARole
    }
    lambdaARole = new iam.Role(scope, `${id}Role`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });


    lambdaARole.addToPolicy(
        new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ['*'],
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ]
        })
    );
    lambdaARole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );
    return lambdaARole
}