import AWS, {CognitoIdentityServiceProvider} from 'aws-sdk'
import config from '../config'

class Cognito {
    private _cognitoIdentityServiceProvider: CognitoIdentityServiceProvider | null

    constructor() {
        AWS.config.region = config.cognito.region;

        this._cognitoIdentityServiceProvider = null;
    }

    getCognitoIdentityServiceProvider() {
        if (!this._cognitoIdentityServiceProvider) {
            this._cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
                apiVersion: '2016-04-18'
            });
        }

        return this._cognitoIdentityServiceProvider;
    }

    async getUserByAccessToken(token: string): Promise<{ email: string, sub: string }> {
        const params = {
            AccessToken: token
        };
        const user = await this.getCognitoIdentityServiceProvider().getUser(params).promise();
        const userData: { [key: string]: string } = {
            ...user,
            ...Object.fromEntries(user.UserAttributes.map((o) => [o.Name, o.Value]))
        } as unknown as { [key: string]: string }
        return {
            email: userData.email,
            sub: userData.sub,
        }
    }
}

export default new Cognito();
