import * as dynamoose from 'dynamoose'
import config from '../../config'
import {Document} from "dynamoose/dist/Document";

export class SettingDocument extends Document {
    id?: string
    type?: string
    symbol?: string
    status?: string
    data?: string
    createdAt?: Date
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
    data: String,
    createdAt: Date,
}, {
    // @ts-ignore-next-line
    saveUnknown: false,
});