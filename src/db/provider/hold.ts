import HoldModel, {HoldDocument} from '../model/hold'
import Base from './base'
import {HOLD_STATUS} from '../../constants'

class Hold extends Base<HoldDocument, THold> {
    getByTypeAndSymbol(type: string, symbol: string): Promise<THold | undefined> {
        return this.getFirst({type, symbol})
    }

    getByTypeAndSymbolStatus(type: string, symbol: string, status: string): Promise<THold | undefined> {
        return this.getFirst({type, symbol, status})
    }

    create(data: THold): Promise<THold> {
        return super.create({
            status: HOLD_STATUS.STARTED,
            ...data
        })
    }

    getCurrentHolds(): Promise<THold[]> {
        return this.getList({status: HOLD_STATUS.STARTED})
    }
}

export default new Hold(HoldModel);