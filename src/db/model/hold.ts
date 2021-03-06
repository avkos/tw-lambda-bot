import * as dynamoose from 'dynamoose'
import {Document} from "dynamoose/dist/Document";
import config from '../../config'

export class HoldDocument extends Document {
    id?: string
    type?: string
    symbol?: string
    status?: string
    data?: string
    avgPrice?: number
    avgPriceProfit?: number
    orderId?: string
    qty?: number
    createdAt?: number
}

export default dynamoose.model<HoldDocument>(config.tables.hold, {
    id: {
        type: String,
        hashKey: true
    },
    type: {
        type: String,
        index: {
            name: "type",
            global: true
        }
    },
    symbol: {
        type: String,
        index: {
            name: "symbol",
            global: true
        }
    },
    status: {
        type: String,
        index: {
            name: "status",
            global: true
        }
    },
    user: {
        type: String,
        index: {
            name: "user",
            global: true
        }
    },
    data: String,
    avgPrice: Number,
    avgPriceProfit: Number,
    orderId: String,
    qty: Number,
    createdAt: {
        type: Number,
        rangeKey: true
    },

}, {
    // @ts-ignore-next-line
    saveUnknown: false
});