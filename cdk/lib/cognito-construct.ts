import {Construct} from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as cdk from 'aws-cdk-lib'

export class CognitoConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, `${id}CognitoConstruct`);
        const userPoolName = `${id}UserPool`
        const pool = new cognito.UserPool(this, userPoolName, {
            userPoolName,
            standardAttributes: {
                email: {
                    required: true
                }
            },
            signInAliases: {
                email: true
            },
            signInCaseSensitive: false,
            selfSignUpEnabled: true
        })

        const client = pool.addClient(`${id}UserPoolClient`, {
            userPoolClientName: `${userPoolName}Client`,
            generateSecret: false,
        })

        new cdk.CfnOutput(scope, `${userPoolName}-id`, {
            value: pool.userPoolId
        });

        new cdk.CfnOutput(scope, `${userPoolName}Client-id`, {
            value: client.userPoolClientId
        });
    }
}
