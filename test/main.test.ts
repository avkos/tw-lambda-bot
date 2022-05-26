import BaseApiSpotService from '../src/provider/BaseApiSpotService'
import {ORDER} from "../src/constants";
import {handler} from "../src";
import {handler as cronHandler} from "../src/cron";
import config from "../src/config";
import strategyProvider from "../src/db/provider/strategy";
import holdProvider from "../src/db/provider/hold";
import {STRATEGY_STATUS} from "../src/constants";
import {clearDB} from "./helper";
import {getOrderQuantity, getOrderPrice} from "../src/helper/order";
import {HOLD_STATUS} from "../dist/constants";

jest.mock('../src/provider/BaseApiSpotService');

describe('main', () => {
    let type: string
    let symbol: string
    let currency: string
    let currentPrice: number
    let balance: number
    let orderId: string
    let api: BaseApiSpotService
    let apiMethods: any = {}
    beforeAll(async () => {
        type = 'myStrategyTestMain'
        symbol = 'ETHUSDT'
        currency = 'USDT'
        orderId = 'someOrderId'
        config.strategy.type = type
        config.strategy.defaultSetting.minAmountUSDT = 200
        await clearDB(type, symbol)
        api = new BaseApiSpotService(symbol)
    })
    beforeEach(async () => {
        await clearDB(type, symbol)
        balance = 1200
        currentPrice = 2000
        apiMethods.getBalance = jest
            .spyOn(BaseApiSpotService.prototype, 'getBalance')
            .mockImplementation(async () => ({total: balance, available: balance, onOrder: 0}));
        apiMethods.getPrice = jest
            .spyOn(BaseApiSpotService.prototype, 'getPrice')
            .mockImplementation(async () => currentPrice);
        apiMethods.checkStatus = jest
            .spyOn(BaseApiSpotService.prototype, 'checkStatus')
            .mockImplementation(async () => ({status: ORDER.STATUS.NEW, orderId}) as any);
        apiMethods.marketSell = jest.spyOn(BaseApiSpotService.prototype, 'marketSell')
            .mockImplementation(async (qty: number) => ({
                avgPrice: currentPrice,
                price: currentPrice,
                status: ORDER.STATUS.FILLED,
                totalQty: qty,
                origQty: qty,
                orderId
            }))
        apiMethods.marketBuy = jest.spyOn(BaseApiSpotService.prototype, 'marketBuy')
            .mockImplementation(async (qty: number) => ({
                avgPrice: currentPrice,
                price: currentPrice,
                status: ORDER.STATUS.FILLED,
                totalQty: qty,
                origQty: qty,
                orderId
            }))
        apiMethods.cancelOrder = jest.spyOn(BaseApiSpotService.prototype, 'cancelOrder')
        apiMethods.limitSell = jest.spyOn(BaseApiSpotService.prototype, 'limitSell')
            .mockImplementation(async (qty: number) => ({
                price: currentPrice,
                status: ORDER.STATUS.NEW,
                totalQty: qty,
                origQty: qty,
                orderId
            }))
    })
    afterEach(() => {
        for (const m of Object.keys(apiMethods)) {
            apiMethods[m].mockClear()
        }
    })
    afterAll(async () => {
        await clearDB(type, symbol)
    })
    describe('binance', () => {
        it('balance', async () => {
            const {available} = await api.getBalance(currency)
            expect(available).toBe(balance)
        })
        it('getPrice', async () => {
            const price = await api.getPrice(currency)
            expect(price).toBe(currentPrice)
        })
        it('marketSell', async () => {
            await api.marketSell(0.1)
            expect(api.marketSell).toHaveBeenCalledWith(0.1);
        })
        it('marketBuy', async () => {
            await api.marketBuy(0.2)
            expect(api.marketBuy).toHaveBeenCalledWith(0.2);
        })
        it('limitSell', async () => {
            await api.limitSell(0.3, 2345)
            expect(api.limitSell).toHaveBeenCalledWith(0.3, 2345);
        })
        it('checkStatus', async () => {
            const res: any = await api.checkStatus('123')
            expect(res?.status).toBe(ORDER.STATUS.NEW)
        })
        it('cancelOrder', async () => {
            await api.cancelOrder('123')
            expect(api.cancelOrder).toHaveBeenCalledWith('123');
        })

    })
    describe('signal', () => {
        it('buy - sell - profit', async () => {
            // buy
            await handler({body: {message: 'buy'}})
            const shouldBeQty = config.strategy.defaultSetting.minAmountUSDT / currentPrice
            expect(apiMethods.getPrice).toHaveBeenCalled();
            expect(apiMethods.getBalance).toHaveBeenCalledWith(currency);
            expect(apiMethods.marketBuy).toHaveBeenCalledWith(shouldBeQty);
            const s = (await strategyProvider.getCurrentStrategy(type, symbol))!
            expect(s.symbol).toBe(symbol)
            expect(s.data?.buyOrder?.status).toBe(ORDER.STATUS.FILLED)
            expect(s.data?.buyOrder?.origQty).toBe(shouldBeQty)
            expect(s.status).toBe(STRATEGY_STATUS.STARTED)
            expect(s.id).toBeDefined()
            expect(s.type).toBe(type)

            // sell to profit
            currentPrice = 2200
            apiMethods.getPrice.mockClear()
            await handler({body: {message: 'sell'}})
            const strategyAfter = (await strategyProvider.getById(s.id))!

            expect(apiMethods.getPrice).toHaveBeenCalled();
            expect(apiMethods.marketSell).toHaveBeenCalledWith(getOrderQuantity(s.data?.buyOrder));
            expect(strategyAfter.symbol).toBe(symbol)
            expect(strategyAfter.data?.sellOrder?.status).toBe(ORDER.STATUS.FILLED)
            expect(strategyAfter.data?.sellOrder?.origQty).toBe(shouldBeQty)
            expect(strategyAfter.status).toBe(STRATEGY_STATUS.FINISHED)
            expect(strategyAfter.id).toBeDefined()
            expect(strategyAfter.profit).toBe(getOrderQuantity(s.data?.buyOrder) * (getOrderPrice(strategyAfter.data?.sellOrder) - getOrderPrice(strategyAfter.data?.buyOrder)))
            expect(strategyAfter.type).toBe(type)
        })

        it('buy - hold', async () => {
            // buy
            await handler({body: {message: 'buy'}})
            const shouldBeQty = config.strategy.defaultSetting.minAmountUSDT / currentPrice
            const s = (await strategyProvider.getCurrentStrategy(type, symbol))!
            expect(apiMethods.getPrice).toHaveBeenCalled();
            expect(apiMethods.getBalance).toHaveBeenCalledWith(currency);
            expect(apiMethods.marketBuy).toHaveBeenCalledWith(shouldBeQty);
            expect(s.symbol).toBe(symbol)
            expect(s.data?.buyOrder?.status).toBe(ORDER.STATUS.FILLED)
            expect(s.data?.buyOrder?.origQty).toBe(shouldBeQty)
            expect(s.status).toBe(STRATEGY_STATUS.STARTED)
            expect(s.id).toBeDefined()
            expect(s.type).toBe(type)

            // hold
            currentPrice = 1800
            apiMethods.getPrice.mockClear()
            apiMethods.getBalance.mockClear()
            apiMethods.marketBuy.mockClear()
            await handler({body: {message: 'sell'}})
            const strategyAfter = (await strategyProvider.getById(s.id))!
            const hold = (await holdProvider.getById(strategyAfter.holdId))!

            expect(apiMethods.getPrice).toHaveBeenCalled();
            expect(strategyAfter.symbol).toBe(symbol)
            expect(strategyAfter.status).toBe(STRATEGY_STATUS.HOLD)
            expect(strategyAfter.id).toBeDefined()
            expect(strategyAfter.type).toBe(type)
            expect(strategyAfter.holdId).toBeDefined()
            expect(strategyAfter.unHoldPrice).toBe(2020)
            expect(apiMethods.limitSell).toHaveBeenCalledWith(shouldBeQty, 2020)
            expect(hold.orderId).toBe(orderId)
            expect(hold.status).toBe(HOLD_STATUS.STARTED)
        })

        it('buy - hold - reuse', async () => {
            // buy
            await handler({body: {message: 'buy'}})
            const s = (await strategyProvider.getCurrentStrategy(type, symbol))!

            // hold
            currentPrice = 1800
            await handler({body: {message: 'sell'}})
            const strategyHold = (await strategyProvider.getById(s.id))!
            const hold = (await holdProvider.getById(strategyHold.holdId))!
            expect(strategyHold.status).toBe(STRATEGY_STATUS.HOLD)
            expect(hold.status).toBe(HOLD_STATUS.STARTED)

            // reuse hold
            currentPrice = 2200
            await handler({body: {message: 'buy'}})
            const copyStrategy = (await strategyProvider.getCurrentStrategy(type, symbol))!
            const strategyCanceled = (await strategyProvider.getById(s.id))!
            const holdAfter = (await holdProvider.getById(hold.id))!

            expect(strategyCanceled.holdId).toBeUndefined()
            expect(strategyCanceled.unHoldPrice).toBeUndefined()
            expect(strategyCanceled.status).toBe(STRATEGY_STATUS.CANCELED)
            expect(copyStrategy.symbol).toBe(symbol)
            expect(copyStrategy.status).toBe(STRATEGY_STATUS.STARTED)
            expect(copyStrategy.id).toBeDefined()
            expect(copyStrategy.type).toBe(type)
            expect(copyStrategy.data?.buyOrder).toEqual(strategyCanceled.data?.buyOrder)
            expect(copyStrategy.data?.fromStrategyId).toBe(strategyCanceled.id)
            expect(apiMethods.cancelOrder).toHaveBeenCalledWith(orderId)
            expect(holdAfter.status).toBe(HOLD_STATUS.CANCELED)
        })
    })

    describe('cron', () => {
        it('check when wait', async () => {
            apiMethods.checkStatus = jest
                .spyOn(BaseApiSpotService.prototype, 'checkStatus')
                .mockImplementation(async () => ({status: ORDER.STATUS.NEW, orderId}) as any);
            // buy
            await handler({body: {message: 'buy'}})
            const currentStrategy = (await strategyProvider.getCurrentStrategy(type, symbol))!
            expect(currentStrategy.status).toBe(STRATEGY_STATUS.STARTED)

            // hold
            currentPrice = 1800
            await handler({body: {message: 'sell'}})
            const currentStrategyHold = (await strategyProvider.getById(currentStrategy.id))!
            const hold = (await holdProvider.getById(currentStrategyHold.holdId))!
            expect(hold.status).toBe(HOLD_STATUS.STARTED)
            expect(currentStrategyHold.status).toBe(STRATEGY_STATUS.HOLD)

            // check hold
            currentPrice = 1600
            await cronHandler()
            const holdAfter = (await holdProvider.getById(hold.id))!
            const currentStrategyHoldAgain = (await strategyProvider.getById(currentStrategy.id))!
            expect(apiMethods.checkStatus).toHaveBeenCalledWith(orderId)
            expect(currentStrategyHoldAgain.status).toBe(STRATEGY_STATUS.HOLD)
            expect(holdAfter.status).toBe(HOLD_STATUS.STARTED)
        })
        it('check when profit', async () => {
            apiMethods.checkStatus = jest
                .spyOn(BaseApiSpotService.prototype, 'checkStatus')
                .mockImplementation(async () => ({status: ORDER.STATUS.FILLED, orderId}) as any);

            // buy
            await handler({body: {message: 'buy'}})
            currentPrice = 1800
            const currentStrategy = (await strategyProvider.getCurrentStrategy(type, symbol))!

            // hold
            await handler({body: {message: 'sell'}})
            const currentStrategyHold = (await strategyProvider.getById(currentStrategy.id))!
            currentPrice = 2200
            const hold = (await holdProvider.getById(currentStrategyHold.holdId))!
            expect(hold.status).toBe(HOLD_STATUS.STARTED)

            // unhold
            await cronHandler()
            const holdAfter = (await holdProvider.getById(hold.id))!
            const currentStrategyUnHold = (await strategyProvider.getById(currentStrategy.id))!
            expect(apiMethods.checkStatus).toHaveBeenCalledWith(orderId)
            expect(holdAfter.status).toBe(HOLD_STATUS.FINISHED)
            expect(currentStrategyUnHold.data?.sellOrder?.status).toBe(ORDER.STATUS.FILLED)
        })

    })

});
