import * as dynamoose from 'dynamoose'
import config from '../../config'
import {Document} from "dynamoose/dist/Document";

export class SettingDocument extends Document {
    id?: string
    type?: string
    symbol?: string
    status?: string
    data?: string
    createdAt?: number
}

export default dynamoose.model<SettingDocument>(config.tables.setting, {
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
    user: {
        type: String,
        index: {
            name: "user",
            global: true
        }
    },
    data: {
        type: String,
    },
    createdAt: {
        type: Date,
        rangeKey: true
    },
}, {
    // @ts-ignore-next-line
    saveUnknown: false,
});