import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import {FunctionUrlAuthType} from "aws-cdk-lib/aws-lambda";
import * as cdk from 'aws-cdk-lib'
import {lambdaEnvs, getRole} from "./helpers";
import {Duration} from "aws-cdk-lib/core/lib/duration";

export class LambdaApiConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, `${id}LambdaConstruct`);
        const functionName = `${id}Lambda`

        const apiLambda = new lambda.Function(scope, functionName, {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('../dist'),
            handler: 'index.handler',
            environment: lambdaEnvs,
            timeout: cdk.Duration.seconds(300),
            role: getRole(scope, id)
        })

        const lambdaFunctionUrl = apiLambda.addFunctionUrl({
            authType: FunctionUrlAuthType.NONE,
        })

        new cdk.CfnOutput(scope, `${id}LambdaFunctionUrl`, {
            value: lambdaFunctionUrl.url
        });
    }
}
