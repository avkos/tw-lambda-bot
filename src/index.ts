import {STRATEGY_ACTION_SELL, STRATEGY_ACTION_BUY, STRATEGY_STATUS} from './constants'
import config from './config'
import strategyProvider from '../src/db/provider/strategy'
import SpotStrategy from './strategy/SpotStrategy'

type TAction = typeof STRATEGY_ACTION_SELL | typeof STRATEGY_ACTION_BUY

const getAction = (req: any): TAction => {
    let data = req.body.message || req.body.toString()
    try {
        data = JSON.parse(data)
    } catch (e) {
    }
    let action = ''

    if (data) {
        if (typeof data === 'string') {
            action = data
        } else {
            action = data.order && data.order.action
        }
    }

    return action as TAction
}
const signalSpotProcessing = async (action: string, symbol: string, currency: string, type: string): Promise<void> => {
    try {
        const strategy = new SpotStrategy(symbol, type)
        await strategy.init()
        if (action === STRATEGY_ACTION_SELL) {
            const lastStrategy: TStrategy | undefined = await strategyProvider.getCurrentStrategy(type, symbol)
            if (lastStrategy) {
                strategy.setStrategy(lastStrategy)
            }
            if (strategy.strategy.status !== STRATEGY_STATUS.STARTED) {
                return
            }
            // close potion and open SHORT
            await strategy.sell()

        } else if (action === STRATEGY_ACTION_BUY) {
            try {
                await strategy.buy(currency)
            } catch (e) {
                console.log('error buy', e)
            }
        }
    } catch (e) {

        console.error(e)
    }
}

export const handler = async (req: any): Promise<{ success: boolean }> => {
    const action = getAction(req)
    const asset = config.strategy.asset
    const currency = config.strategy.currency
    const symbol = `${asset}${currency}`
    const type = config.strategy.type
    await signalSpotProcessing(action, symbol, currency, type)
    return {success: true}
}