import {Construct} from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cdk from 'aws-cdk-lib'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'

export class FrontConstruct extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, `${id}AppConstruct`);
        const bucketId = `${id}App`
        const staticS3Bucket = new s3.Bucket(scope, bucketId, {
            bucketName:bucketId.toLowerCase(),
            websiteIndexDocument: "index.html",
            websiteErrorDocument: "error.html",
            publicReadAccess: false,
            //only for demo not to use in production
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        new cdk.CfnOutput(scope, "Bucket", {value: staticS3Bucket.bucketName});

        const originAccessIdentity = new cloudfront.OriginAccessIdentity(
            scope,
            `${id}cloudFront`
        );
        staticS3Bucket.grantRead(originAccessIdentity);

        new s3deploy.BucketDeployment(scope, "React app", {
            sources: [s3deploy.Source.asset('../../tw-lambda-bot-app/build')],
            destinationBucket: staticS3Bucket
        });

        const staticS3Distribution = new cloudfront.CloudFrontWebDistribution(
            scope,
            `${id}AppCloudfront`,
            {
                originConfigs: [
                    {
                        s3OriginSource: {
                            s3BucketSource: staticS3Bucket,
                            originAccessIdentity: originAccessIdentity
                        },
                        behaviors: [
                            {
                                isDefaultBehavior: true,
                            }
                        ]
                    },
                ]
            }
        );

        new cdk.CfnOutput(scope, "CF_STATIC_URL", {
            value: `https://${staticS3Distribution.distributionDomainName}`
        });

    }
}

