const {handler} = require('./dist/index')



const test = async()=>{
	// await handler({body:'buy'})
	// await handler({body:'sell'})
	console.log(JSON.stringify(await handler({body:{action:'stat'}})))
}

test().catch(console.error)