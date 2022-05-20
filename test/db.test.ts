import settingProvider from '../src/db/provider/setting';
import holdProvider from '../src/db/provider/hold';
import strategyProvider from '../src/db/provider/strategy';
import {STRATEGY_STATUS} from "../dist/constants";
import config from "../src/config";
import {clearDB} from "./helper";


describe('db providers', () => {
    let type: string
    let symbol: string
    let data: any
    beforeAll(async () => {
        type = 'myStrategyTest'
        symbol = 'ETHUSDT'
        data = {some: {data: 1}}
        await clearDB(type, symbol)
    })
    afterAll(async () => {
        await clearDB(type, symbol)
    })
    describe('setting', () => {
        it('getByTypeAndSymbol', async () => {
            const setting = await settingProvider.getByTypeAndSymbol(type, symbol)
            expect(setting).toBeDefined()
            expect(setting?.id).toBeDefined()
            expect(setting?.data).toBeDefined()
            expect(setting?.data).toEqual(config.strategy.defaultSetting)
        })
    })
    describe('hold', () => {
        it('create', async () => {
            const hold = await holdProvider.create({
                type,
                symbol,
                data,
                avgPrice: 200,
                avgPriceProfit: 202,
                orderId: 'asdasdasd',
                qty: 12.213412
            })
            expect(hold).toBeDefined()
            expect(hold?.id).toBeDefined()
            expect(hold?.data).toBeDefined()
            expect(hold?.data).toEqual(data)
        })
        it('getByTypeAndSymbol', async () => {
            await holdProvider.create({
                type,
                symbol,
                data,
                avgPrice: 200,
                avgPriceProfit: 202,
                orderId: 'asdasdasd',
                qty: 12.213412
            })
            const getFirstHold = (await holdProvider.getByTypeAndSymbol(type, symbol))!
            expect(getFirstHold).toBeDefined()
            expect(getFirstHold?.id).toBeDefined()
            expect(getFirstHold?.data).toBeDefined()
            expect(getFirstHold?.data).toEqual(data)
        })
        it('getCurrentHolds', async () => {
            await holdProvider.create({
                type,
                symbol,
                data,
                avgPrice: 200,
                avgPriceProfit: 202,
                orderId: 'asdasdasd',
                qty: 12.213412,
            })
            const getCurrentHolds = await holdProvider.getCurrentHolds()
            expect(getCurrentHolds).toBeDefined()
            expect(getCurrentHolds[0]?.id).toBeDefined()
            expect(getCurrentHolds[0]?.data).toBeDefined()
            expect(getCurrentHolds[0]?.data).toEqual(data)
        })
    })
    describe('strategy', () => {
        it('create', async () => {
            const strategy = await strategyProvider.create({
                type,
                symbol,
                status: STRATEGY_STATUS.HOLD,
                profit: 12.23,
                unHoldPrice: 123.23,
                data,
            })
            expect(strategy).toBeDefined()
            expect(strategy?.id).toBeDefined()
            expect(strategy?.data).toBeDefined()
            expect(strategy?.data).toEqual(data)
        })
        it('update', async () => {
            const strategy = await strategyProvider.create({
                type,
                symbol,
                status: STRATEGY_STATUS.HOLD,
                profit: 12.23,
                unHoldPrice: 123.23,
                data,
            })
            strategy.profit = 123123
            delete strategy.unHoldPrice
            await strategyProvider.update(strategy)
            await strategyProvider.removeFields(strategy.id, ['unHoldPrice'])
            const res = (await strategyProvider.getById(strategy.id))!
            expect(res).toBeDefined()
            expect(res?.id).toBeDefined()
            expect(res?.profit).toBe(123123)
            expect(res?.unHoldPrice).toBeUndefined()
        })
        it('getByTypeAndSymbol', async () => {
            await strategyProvider.create({
                type,
                symbol,
                status: STRATEGY_STATUS.HOLD,
                profit: 12.23,
                unHoldPrice: 123.23,
                data,
            })
            const d = await strategyProvider.getByTypeAndSymbolStatus(type, symbol, STRATEGY_STATUS.HOLD)
            expect(d[0]).toBeDefined()
            expect(d[0]?.id).toBeDefined()
            expect(d[0]?.data).toBeDefined()
            expect(d[0]?.data).toEqual(data)
        })
        it('getCurrentHolds', async () => {
            const holdId: string = 'test'
            await strategyProvider.create({
                type,
                symbol,
                status: STRATEGY_STATUS.HOLD,
                profit: 12.23,
                unHoldPrice: 123.23,
                data,
                holdId,
            })
            const sHold = await strategyProvider.getByHoldId(type, symbol, holdId)
            expect(sHold).toBeDefined()
            expect(sHold[0]?.id).toBeDefined()
            expect(sHold[0]?.data).toBeDefined()
            expect(sHold[0]?.data).toEqual(data)
        })
        it('getSimilarHold', async () => {
            const holdId: string = 'test'
            const strategySimilar = await strategyProvider.create({
                type,
                symbol,
                status: STRATEGY_STATUS.HOLD,
                profit: 12.23,
                holdId,
                unHoldPrice: 123.23,
                data: {buyOrder: {avgPrice: 100}},
            })
            const sHold = await strategyProvider.getSimilarHold(strategySimilar, 120)
            expect(sHold).toBeDefined()
            expect(sHold?.id).toBeDefined()
            expect(sHold?.data).toBeDefined()
        })
        it('getByTypeAndSymbolStatus', async () => {
            const tempData = {
                type,
                symbol,
                status: STRATEGY_STATUS.HOLD,
                profit: 12.23,
                unHoldPrice: 123.23,
                data: {buyOrder: {avgPrice: 100}},
            }
            const res = await strategyProvider.create(tempData)
            const sHold = await strategyProvider.getById(res.id)
            expect(sHold).toBeDefined()
            expect(sHold?.id).toBeDefined()
            expect(sHold?.data).toBeDefined()
            expect(sHold?.data).toEqual(tempData.data)
        })
    })
});
