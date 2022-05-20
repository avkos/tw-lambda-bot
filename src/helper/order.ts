export const getOrderPrice = (o: TOrder | undefined) => {
    if (!o) {
        return 0
    }
    return Number(o.avgPrice) || Number(o.price) || Number(o.stopPrice) || 0
}

export const getOrderStatus = (o: TOrder) => {
    return o && o.status
}

export const getOrderQuantity = (o: TOrder | undefined) => {
    if (!o) {
        return 0
    }
    return Number(o.totalQty) || Number(o.origQty)
}
export const calculateProfit = (buyOrder: TOrder | undefined, sellOrder: TOrder | undefined) => {
    if (!buyOrder || !sellOrder) {
        return 0
    }
    const buyPrice = getOrderPrice(buyOrder)
    const sellPrice = getOrderPrice(sellOrder)
    const qty = getOrderQuantity(buyOrder)
    return (sellPrice - buyPrice) * qty
}
export const calculateOrderFills = (fills: TFill[] = []) => {
    let totalQty = 0
    let priceQty = 0
    let commission = 0
    let commissionAsset = 'USDT'
    for (const f of fills) {
        commissionAsset = f.commissionAsset as string
        commission += (Number(f.commission) || 0)
        priceQty += (Number(f.price) || 0) * (Number(f.qty) || 0)
        totalQty += (Number(f.qty) || 0)
    }
    return {
        commission,
        commissionAsset,
        totalQty,
        avgPrice: totalQty > 0 ? (priceQty / totalQty) : 0,
    }
}
