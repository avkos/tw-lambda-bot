const {holdProvider, settingProvider, strategyProvider} = require('./src_/db/provider')
const {STRATEGY_STATUS} = require("./src_/constants");



const dataBaseTest = async()=>{
	const type ='myStrategy'
	const symbol ='ETHUSDT'

	console.log('test Setting')
	const setting = await settingProvider.getByTypeAndSymbol(type,symbol)
	console.log('getByTypeAndSymbol',setting)

	console.log('test Hold')
	const hold = await holdProvider.create({
		type:'myStrategy',
		symbol:'ETHUSDT',
		data:{some:{data:1}},
		avgPrice:200,
		avgPriceProfit:202,
		orderId:'asdasdasd',
		qty:12.213412
	})
	console.log('create',hold)
	console.log('getByTypeAndSymbol',await holdProvider.getByTypeAndSymbol(type,symbol))
	console.log('getCurrentHolds',await holdProvider.getCurrentHolds())

	console.log('test Strategy')

	const strategy = await strategyProvider.create({
		type,
		symbol,
		profit:12.23,
		holdId:hold.id,
		unHoldPrice:123.23,
		data:{buyOrder:{data:1}},
	})

	const strategySimilar = await strategyProvider.create({
		type,
		symbol,
		status:STRATEGY_STATUS.HOLD,
		profit:12.23,
		holdId:hold.id,
		unHoldPrice:123.23,
		data:{buyOrder:{avgPrice:100}},
	})
	console.log('create',strategy)
	console.log('getByTypeAndSymbol',await strategyProvider.getByTypeAndSymbol(type,symbol))
	console.log('getByHoldId',await strategyProvider.getByHoldId(hold.id))
	console.log('getSimilarHold',await strategyProvider.getSimilarHold(strategy,120))
	console.log('getByTypeAndSymbolStatus',await strategyProvider.getByTypeAndSymbolStatus(type,symbol,STRATEGY_STATUS.HOLD))


	console.log('remove all')
	await holdProvider.deleteById(hold.id)
	await strategyProvider.deleteById(strategy.id)
	await strategyProvider.deleteById(strategySimilar.id)
	await settingProvider.deleteById(setting.id)

}

dataBaseTest().catch(console.error)