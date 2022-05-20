import settingProvider from "../src/db/provider/setting";
import holdProvider from "../src/db/provider/hold";
import strategyProvider from "../src/db/provider/strategy";

export const clearDB = async (type: string, symbol: string) => {
    const setting = await settingProvider.getList({type, symbol})
    const prs = []
    for (const s of setting) {
        prs.push(settingProvider.deleteById(s.id))
    }
    const holds = await holdProvider.getList({type,symbol})
    for (const h of holds) {
        prs.push(holdProvider.deleteById(h.id))
    }
    const sList = await strategyProvider.getByTypeAndSymbol(type, symbol)
    for (const s of sList) {
        prs.push(strategyProvider.deleteById(s.id))
    }
    await Promise.all(prs)
}