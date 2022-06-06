import {STRATEGY_ACTION_SELL, STRATEGY_ACTION_BUY, STRATEGY_STATUS, BOT_STAT} from './constants'
import config from './config'
import strategyProvider from './db/provider/strategy'
import SpotStrategy from './strategy/SpotStrategy'
import cognito from "./helper/cognito";

type TAction = typeof STRATEGY_ACTION_SELL | typeof STRATEGY_ACTION_BUY

const getAction = (req: any): TAction => {
    let data = req.body
    try {
        data = JSON.parse(data)
    } catch (e) {
    }
    let action = ''

    if (data) {
        if (typeof data === 'string') {
            action = data
        } else if (data && data.message) {
            action = data.message
        } else if (data && data.action) {
            action = data.action
        } else {
            action = data.order && data.order.action
        }
    }

    return action as TAction
}

const signalSpotProcessing = async (action: string, symbol: string, currency: string, type: string, accessToken: string): Promise<any> => {
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
            await strategy.sell()

        } else if (action === STRATEGY_ACTION_BUY) {
            try {
                const lastStrategy: TStrategy | undefined = await strategyProvider.getCurrentStrategy(type, symbol)
                if (lastStrategy?.id) {
                    console.log('strategy in progress. do nothing')
                    return
                }
                await strategy.buy(currency)
            } catch (e) {
                console.log('error buy', e)
            }
        } else if (action === BOT_STAT) {
            await getCognitoUser(accessToken)
            return strategy.stat()
        }
    } catch (e) {
        console.error('signalSpotProcessing error', e)
    }
}

const getAccessToken = (req: any): string => {
    return req.headers.authorization
}

const getCognitoUser = async (accessToken: string) => {
    if (accessToken) {
        const cognitoUser = await cognito.getUserByAccessToken(accessToken);
        if (cognitoUser && cognitoUser.email && cognitoUser.email === config.user.email) {
            return cognitoUser
        }

    }
    throw new Error('Unauthorized')
}

export const handler = async (req: any) => {
    const action = getAction(req)
    const accessToken = getAccessToken(req)
    const asset = config.strategy.asset
    const currency = config.strategy.currency
    const symbol = `${asset}${currency}`
    const type = config.strategy.type
    let body
    try {
        body = await signalSpotProcessing(action, symbol, currency, type, accessToken)
    } catch (e) {
        console.log('error', e)
    }

    return {
        success: true,
        statusCode: 200,
        body,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*',
        }
    }
}