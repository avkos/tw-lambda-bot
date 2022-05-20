import SpotStrategyBase from './SpotStrategyBase'
import {STRATEGY_STATUS, ORDER, HOLD_STATUS} from '../constants'
import holdProvider from '../db/provider/hold'
import strategyProvider from '../db/provider/strategy'
import {calculateOrderFills, getOrderStatus, calculateProfit, getOrderPrice, getOrderQuantity} from '../helper/order'

class SpotStrategy extends SpotStrategyBase {

    async calculatePositionQty(symbol: string, currency: string): Promise<number> {
        try {
            const {available: balance} = await this.getBalance(currency)
            const currentPrice = await this.getPrice(symbol)
            if (currentPrice > 0 && balance > 0) {

                let qty = balance * this.setting.data.riskPercent / currentPrice
                if ((qty * currentPrice) < ORDER.MIN_USD) {
                    qty = (ORDER.MIN_USD / currentPrice) * 1.01
                }
                if ((qty * currentPrice) < this.setting.data.minAmountUSDT) {
                    qty = this.setting.data.minAmountUSDT / currentPrice
                }
                if ((qty * currentPrice) * 1.005 > balance) {
                    throw new Error('not enough balance')
                }
                return qty
            }
            return 0.01
        } catch (e) {
            // @ts-ignore
            throw new Error(e)
        }
    }

    async copyStrategy(strategy: TStrategy, similar: TStrategy): Promise<TStrategy> {
        strategy.status = STRATEGY_STATUS.STARTED
        strategy.data = {
            ...(similar.data || {}),
            fromStrategyId: similar.id as string
        }
        await strategyProvider.update(strategy)
        return strategy
    }

    async sell(): Promise<void> {
        const currentPrice = await this.getPrice()
        const buyPrice = getOrderPrice(this.strategy?.data?.buyOrder)
        const buyQty = getOrderQuantity(this.strategy?.data?.buyOrder)
        if (buyPrice < currentPrice) {
            if (buyQty > 0) {
                const sellOrder = await this.marketSell(buyQty)
                const {
                    avgPrice,
                    totalQty,
                    commission,
                    commissionAsset
                } = calculateOrderFills(sellOrder && sellOrder.fills)

                sellOrder.avgPrice = avgPrice
                sellOrder.totalQty = totalQty
                sellOrder.commission = commission
                sellOrder.commissionAsset = commissionAsset
                this.strategy.profit = calculateProfit(this.strategy?.data?.buyOrder, sellOrder)
                this.setData({sellOrder})
                this.strategy.status = STRATEGY_STATUS.FINISHED
                await strategyProvider.update(this.strategy)
            }
        } else {
            if (buyQty > 0) {
                await this.addToHold()
            }
        }
    }

    async buy(currency: string): Promise<void> {
        if (this.setting.data.isReuseHold) {
            const currentPrice = await this.getPrice()

            const similar = await strategyProvider.getSimilarHold(this.strategy, currentPrice)
            if (similar && similar.id) {
                if (await this.removeFromHold(similar)) {
                    this.strategy = await this.copyStrategy(this.strategy, similar)
                    return
                }
            }
        }
        const qty = await this.calculatePositionQty(this.symbol, currency)
        const buyOrder = await this.marketBuy(qty)
        const {avgPrice, totalQty, commission, commissionAsset} = calculateOrderFills(buyOrder && buyOrder.fills)
        buyOrder.commission = commission
        buyOrder.commissionAsset = commissionAsset
        buyOrder.avgPrice = avgPrice
        buyOrder.totalQty = totalQty
        this.setData({buyOrder})
        this.strategy.status = STRATEGY_STATUS.STARTED
        await strategyProvider.update(this.strategy)
    }

    async checkOrder(hold: THold): Promise<THold> {
        const orderData: any = await this.checkStatus(hold.orderId as string)
        if (!hold.data) {
            hold.data = {}
        }
        if (orderData && orderData.orderId && getOrderStatus(hold.data.sellOrder) !== String(orderData.status)) {
            hold.data.sellOrder = orderData
            const {avgPrice, totalQty, commission, commissionAsset} = calculateOrderFills(
                orderData && orderData.fills)
            hold.data.sellOrder.totalQty = totalQty
            hold.data.sellOrder.commission = commission
            hold.data.sellOrder.avgPrice = avgPrice
            hold.data.sellOrder.commissionAsset = commissionAsset
            await holdProvider.update(hold)
        }
        return hold
    }

    async removeFromHold(strategy: TStrategy): Promise<boolean> {
        const holdId = String(strategy.holdId)
        const hold = await this.checkOrder((await holdProvider.getById(holdId))!)
        if (getOrderStatus(hold.data && hold.data.sellOrder) === ORDER.STATUS.FILLED) {
            return false
        } else {
            delete strategy.holdId
            delete strategy.unHoldPrice
            strategy.status = STRATEGY_STATUS.CANCELED
            await strategyProvider.update(strategy)
            await strategyProvider.removeFields(strategy.id, ['holdId', 'unHoldPrice'])
            const calcHold = await this.recalculateHold(hold)
            if (calcHold) {
                await this.createOrUpdateOrder(calcHold)
            } else {
                await this.holdCancel(hold)
                hold.status = HOLD_STATUS.CANCELED
                await holdProvider.update(hold)
            }
        }
        return true
    }

    async recalculateHold(hold: THold): Promise<THold | undefined> {
        const list = await strategyProvider.getByHoldId(hold.type,hold.symbol,hold.id as string)
        if (list.length === 0) {
            return undefined
        }
        type TPriceQty = { price: number, qty: number }

        const data: {
            strategies: TStrategy[],
            priceQty: TPriceQty[],
            ids: string[]
        }
            = {
            strategies: [],
            priceQty: [],
            ids: [],
        }
        for (const s of list) {
            const price = getOrderPrice(s.data?.buyOrder)
            const qty = getOrderQuantity(s.data?.buyOrder)
            if (price > 0 && qty > 0) {
                data.priceQty.push({price, qty})
                data.ids.push(s.id as string)
                data.strategies.push(s)
            }
        }

        let qty = 0
        let priceQty = 0
        for (const s of data.priceQty) {
            priceQty += (Number(s.price) || 0) * (Number(s.qty) || 0)
            qty += (Number(s.qty) || 0)
        }
        hold.avgPrice = qty > 0 ? (priceQty / qty) : 0
        hold.avgPriceProfit = hold.avgPrice * 1.01
        hold.qty = qty
        await holdProvider.update(hold)
        if (list && list.length > 0) {
            const prs = []
            for (const s of list) {
                prs.push(strategyProvider.update({...s, unHoldPrice: hold.avgPriceProfit}))
            }
            await Promise.all(prs)
        }
        return hold
    }

    async holdCancel(hold: THold): Promise<void> {
        try {
            await this.cancelOrder(hold.orderId)
            await holdProvider.removeFields(hold.id, ['orderId'])
        } catch (e) {
            console.log('cancel order error', e)
        }
    }

    async createOrUpdateOrder(hold: THold): Promise<void> {
        if (hold.orderId) {
            await this.holdCancel(hold)
        }
        if (hold?.qty && hold?.avgPriceProfit && hold?.qty > 0 && hold?.avgPriceProfit > 0) {
            const order = await this.limitSell(hold.qty, hold.avgPriceProfit)
            hold.orderId = order.orderId
            await holdProvider.update(hold)
        }
    }

    async addToHold(): Promise<void> {
        let hold = await holdProvider.getByTypeAndSymbolStatus(this.type, this.symbol, HOLD_STATUS.STARTED)
        if (!hold) {
            hold = await holdProvider.create({
                type: this.type,
                symbol: this.symbol,
                status: HOLD_STATUS.STARTED
            })
        }
        this.strategy.holdId = hold.id
        this.strategy.status = STRATEGY_STATUS.HOLD
        await strategyProvider.update(this.strategy)

        const calcHold = await this.recalculateHold(hold)
        if (calcHold) {
            await this.createOrUpdateOrder(calcHold)
        }
    }
}

export default SpotStrategy
