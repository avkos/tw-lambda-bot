const Binance = require('node-binance-api')
import config from '../config'

export default class BaseApiSpotService {
    symbol: string
    client: typeof Binance

    constructor(symbol: string) {
        this.symbol = symbol
        this.client = new Binance().options({
            APIKEY: config.binance.key,
            APISECRET: config.binance.secret,
            recvWindow: 60000,
        })
    }

    async getBalance(currency: string, workingCurrency?: string, currentPrice?: number): Promise<{ total: number, available: number, onOrder: number }> {
        const balances = await this.client.balance()
        let onOrder = 0
        let total = balances && balances[currency] &&
            ((Number(balances[currency].available) || 0) + (Number(balances[currency].onOrder) || 0)) || 0
        if (workingCurrency && currentPrice) {
            total += currentPrice *
                (balances && balances[workingCurrency] && (Number(balances[workingCurrency].onOrder) || 0) || 0)
            onOrder = Number(balances[workingCurrency].onOrder)
        }
        return {total, available: (Number(balances[currency].available) || 0), onOrder}
    }

    async getPrice(symbol?: string):Promise<number> {
        symbol = symbol || this.symbol
        const prices = await this.client.prices(symbol)
        return prices && prices[symbol] && Number(prices[symbol])
    }

    async limitSell(quantity: number, price: number):Promise<unknown> {
        try {
            return await this.client.sell(this.symbol, Number(quantity).toFixed(3), Number(price).toFixed(2))
        } catch (e) {
            console.log('limitSell err', {quantity, price}, (e as any).body)
            throw new Error('limitSell err')
        }

    }

    async marketSell(quantity: number):Promise<unknown> {
        try {
            return await this.client.marketSell(this.symbol, Number(quantity).toFixed(3))
        } catch (e) {
            console.log('marketSell err', {quantity}, e)
            throw new Error('marketSell err')
        }
    }

    async marketBuy(quantity: number):Promise<unknown> {
        try {
            return await this.client.marketBuy(this.symbol, Number(quantity).toFixed(3))
        } catch (e) {
            console.log('marketBuy err', {quantity}, (e as any).body)
            throw new Error('marketBuy err')
        }
    }

    async checkStatus(orderId: string):Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.orderStatus(this.symbol, orderId, (error: Error, orderStatus: string) => {
                if (error) {
                    return reject(error)
                }
                return resolve(orderStatus)
            }, {orderId})
        })
    }

    async cancelOrder(orderId: string | undefined, symbol?: string):Promise<unknown> {
        if (!orderId) {
            return
        }
        return new Promise<void>((resolve) => {
            this.client.cancel(this.symbol || symbol, orderId, (error: Error, response: any) => {
                if (error) {
                    console.log('cancelOrder err', orderId, (error as any).body)
                    return resolve()
                }
                return resolve(response)
            })
        })

    }

}
