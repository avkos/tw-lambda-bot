import BaseApiSpotService from '../provider/BaseApiSpotService'
import settingProvider from '../db/provider/setting'
import {STRATEGY_STATUS} from "../constants";
import config from "../config";

class SpotStrategyBase extends BaseApiSpotService {
    type: string
    strategy: TStrategy
    setting: TSetting

    constructor(symbol: string, type: string) {
        super(symbol)
        this.type = type
        this.symbol = symbol
        this.strategy = {
            status: STRATEGY_STATUS.CREATED,
            type,
            symbol,
            data: {}
        }
        this.setting = {
            type,
            symbol,
            data: config.strategy.defaultSetting
        }
    }

    setStrategy(s: TStrategy) {
        this.strategy = s
    }

    setData(data: any) {
        this.strategy.data = {...(this.strategy.data || {}), ...data}
    }

    async init() {
        this.setting = await settingProvider.getByTypeAndSymbol(this.type, this.symbol)
    }
}

export default SpotStrategyBase
