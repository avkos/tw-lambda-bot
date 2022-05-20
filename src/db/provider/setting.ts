import SettingModel, {SettingDocument} from '../model/setting'
import Base from './base'
import config from '../../config'

class Setting extends Base<SettingDocument, TSetting> {
    async getByTypeAndSymbol(type: string, symbol: string): Promise<TSetting> {
        let setting = await this.getFirst({type, symbol})
        if (!setting) {
            setting = await this.create({
                type,
                symbol,
                data: config.strategy.defaultSetting
            })

        }
        return setting
    }
}

export default new Setting(SettingModel);