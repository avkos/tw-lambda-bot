const AWS = require('aws-sdk');

class Cognito {
	constructor() {
		this.config = {
			userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
			clientId: process.env.AWS_COGNITO_APP_CLIENT_ID,
			region: process.env.AWS_COGNITO_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			accessSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
		}

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

	async deleteUser(username) {
		const params = {
			UserPoolId: this.config.userPoolId,
			Username: username
		};
		return this.getCognitoIdentityServiceProvider().adminDeleteUser(params).promise();
	}

	async signUp(options, fromAdmin = false) {
		const email = options.email && String(options.email).toLowerCase();

		const userEmail = await this.getUserNameByField('email', email);
		// console.log('userEmail', userEmail)

		if (userEmail.sub && userEmail.email_verified === 'true') {
			throw new Error('Email already exists');
		} else if (userEmail.sub && userEmail.email_verified === 'false') {
			await this.deleteUser(email)
		}
		const UserAttributes = [
			{Name: 'email', Value: email},
			{Name: 'name', Value: options.name}
		];
		const params = {
			ClientId: this.config.clientId,
			Password: options.password,
			Username: email,
			UserAttributes
		};

		console.log('cognito sign up params', params);

		const result = await this.getCognitoIdentityServiceProvider().signUp(params).promise();

		if (fromAdmin) {
			await this.getCognitoIdentityServiceProvider()
				.adminConfirmSignUp({
					UserPoolId: this.config.userPoolId,
					Username: email
				})
				.promise();
		}

		await this.getCognitoIdentityServiceProvider()
			.adminUpdateUserAttributes({
				UserAttributes: [
					{
						Name: 'preferred_username',
						Value: email
					}
				],
				UserPoolId: this.config.userPoolId,
				Username: email
			})
			.promise();

		return {...result, email};
	}

	async getUserNameByField(field, value) {
		const filter = `${field} = "${value}"`;
		const attr = ['sub', 'email', 'email_verified'];
		const req = {
			Filter: filter,
			UserPoolId: this.config.userPoolId,
			AttributesToGet: attr,
			Limit: 1
		};
		// console.log('req', req);
		const data = await this.getCognitoIdentityServiceProvider().listUsers(req).promise();

		return data.Users.length
			? data.Users[0].Attributes.reduce((obj, attr) => ({...obj, [attr.Name]: attr.Value}), {})
			: {};
	}


}

module.exports = new Cognito();
;
