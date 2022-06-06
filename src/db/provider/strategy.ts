import StrategyModel, {StrategyDocument} from '../model/strategy'
import Base from './base'
import {STRATEGY_STATUS} from '../../constants'
import {getOrderPrice} from '../../helper/order'
import * as dynamoose from "dynamoose";

class Strategy extends Base<StrategyDocument, TStrategy> {
    getByTypeAndSymbol(type: string, symbol: string): Promise<TStrategy[]> {
        return this.getList({type, symbol})
    }

    create(data: TStrategy): Promise<TStrategy> {
        return super.create({
            status: STRATEGY_STATUS.CREATED,
            ...data
        })
    }

    update(s: TStrategy): Promise<TStrategy> {
        if (s.id) {
            return super.update(s)
        } else {
            return this.create(s)
        }

    }

    getByHoldId(type: string, symbol: string, holdId: string): Promise<TStrategy[]> {
        return this.getList({type, symbol, holdId})
    }

    async getSimilarHold(strategy: TStrategy, currentPrice: number): Promise<TStrategy | undefined> {
        const list = (await this.getList({
            type: strategy.type,
            symbol: strategy.symbol,
            status: STRATEGY_STATUS.HOLD,
        })) || []

        return list.find((s: TStrategy) => currentPrice >= getOrderPrice(s.data?.buyOrder))
    }

    getByTypeAndSymbolStatus(type: string, symbol: string, status: string): Promise<TStrategy[]> {
        return this.getList({type, symbol, status})
    }

    getCurrentStrategy(type: string, symbol: string): Promise<TStrategy | undefined> {
        return this.getFirst({type, symbol, status: STRATEGY_STATUS.STARTED})
    }

    async calculateProfit(type: string, symbol: string): Promise<number> {
        const condition = new dynamoose
            .Condition()
            .filter('user').eq(this.user)
            .filter('type').eq(type)
            .filter('symbol').eq(symbol)
            .filter('status').in([STRATEGY_STATUS.FINISHED, STRATEGY_STATUS.UNHOLD])

        const strategies = await this.getList(condition)

        return strategies.reduce((acc, el) => acc + (Number(el.profit) || 0), 0)
    }
}

export default new Strategy(StrategyModel);