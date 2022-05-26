import holdProvider from './db/provider/hold'
import strategyProvider from './db/provider/strategy'
import BaseApiSpotService from './provider/BaseApiSpotService'
import {getOrderStatus, getOrderQuantity, calculateProfit, calculateOrderFills} from './helper/order'
import {ORDER, STRATEGY_STATUS, HOLD_STATUS} from './constants'

class CheckHold {
    api: BaseApiSpotService
    hold: THold

    constructor(hold: THold) {
        this.hold = hold
        this.api = new BaseApiSpotService(this.hold.symbol)
    }

    async check() {
        if (this.hold.orderId) {
            await this.checkOrder()
            if (getOrderStatus(this.hold.data.sellOrder) === ORDER.STATUS.FILLED) {
                await this.unHold()
            }
        }
    }

    async checkOrder(): Promise<void> {
        const orderData: any = await this.api.checkStatus(this.hold.orderId!)
        if (!this.hold.data) {
            this.hold.data = {}
        }
        // update hold data if order changed
        if (orderData && orderData.orderId && (orderData.orderId!==this.hold.orderId || getOrderStatus(this.hold.data.sellOrder) !== String(orderData.status))) {
            this.hold.data.sellOrder = orderData
            const {avgPrice, totalQty, commission, commissionAsset} = calculateOrderFills(
                orderData && orderData.fills)
            this.hold.data.sellOrder.totalQty = totalQty
            this.hold.data.sellOrder.commission = commission
            this.hold.data.sellOrder.avgPrice = avgPrice
            this.hold.data.sellOrder.commissionAsset = commissionAsset
            await holdProvider.update(this.hold)
        }
    }

    async unHold(): Promise<void> {
        // get all strategies which related with this hold
        const strategies = await strategyProvider.getByHoldId(this.hold.type, this.hold.symbol, this.hold.id!)
        if (strategies && strategies.length > 0) {
            for (const s of strategies) {
                try {
                    // calculate profit for each strategy
                    const qty = getOrderQuantity(s.data?.buyOrder)
                    const commission = this.hold.data.sellOrder.totalQty > 0 ? this.hold.data.sellOrder.commission * qty /
                        this.hold.data.sellOrder.totalQty : 0
                    const sell = {...this.hold.data.sellOrder, totalQty: qty, commission}
                    s.profit = calculateProfit(s.data?.buyOrder, sell)
                    s.data = {...s.data, sellOrder: sell}
                    // save UNHOLD status, profit, and data to DB
                    await strategyProvider.update({...s, status: STRATEGY_STATUS.UNHOLD})
                } catch (e) {
                    console.log('error set profit', {s, hold: this.hold})
                }
            }
        }

        // update hold status to FINISHED
        this.hold.status = HOLD_STATUS.FINISHED
        await holdProvider.update(this.hold)
    }
}

export const handler = async () => {
    const holds = await holdProvider.getCurrentHolds()
    for (const hold of holds) {
        try {
        const chHold = new CheckHold(hold)
        await chHold.check()
        } catch (e) {
            console.log('error', e)
        }
    }

    return {success: true, statusCode: 200}
}