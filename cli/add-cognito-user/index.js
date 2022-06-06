const coginto = require('./cognito')

const [, , name, email, password] = process.argv;

const run = async () => {
	await coginto.signUp({
		name, email, password
	}, true)
}

run().catch(console.error)