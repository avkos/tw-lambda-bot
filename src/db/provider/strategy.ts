import StrategyModel, {StrategyDocument} from '../model/strategy'
import Base from './base'
import {STRATEGY_STATUS} from '../../constants'
import {getOrderPrice} from '../../helper/order'

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
}

export default new Strategy(StrategyModel);