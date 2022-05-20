import * as dynamoose from 'dynamoose'
import config from '../../config'
import {Document} from "dynamoose/dist/Document";

export class StrategyDocument extends Document {
    id?: string
    type?: string
    symbol?: string
    status?: string
    profit?: number
    data?: string
    createdAt?: Date
    holdId?: string
    unHoldPrice?: number
}

export default dynamoose.model<StrategyDocument>(config.tables.strategy, {
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
    profit: Number,
    data: String,
    createdAt: Date,
    holdId: {
        type: String,
        index: {
            name: "holdId",
            global: true
        }
    },
    unHoldPrice: Number,
}, {
    // @ts-ignore-next-line
    saveUnknown: false,
});