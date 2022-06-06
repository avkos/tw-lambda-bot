import {v4} from 'uuid'
import {AnyDocument} from "dynamoose/dist/Document";
import {Model} from "dynamoose/dist/Model";
import {Condition, ConditionInitalizer} from "dynamoose/dist/Condition";
import config from "../../config";

export default class BaseProvider<BaseDocument extends AnyDocument, Data extends { data?: string | object, id?: string, createdAt?: string | number, user?: string }> {
    model: Model
    user: string

    constructor(model: Model) {
        this.model = model
        this.user = config.user.email
    }

    addUserToFilter(filter: Partial<Data> | ConditionInitalizer) {
        if (filter instanceof Condition) {
            return filter
        }

        return {...(filter as Object), user: this.user}
    }

    async count(filter: Partial<Data> | ConditionInitalizer) {
        const res = await this.model.query(this.addUserToFilter(filter)).count().exec()
        return res.count
    }

    async getList(filter: Partial<Data> | ConditionInitalizer, options: { limit?: number, order?: 'descending' | 'ascending' } = {}): Promise<Data[]> {
        const {limit, order} = options
        let query = this.model.query(this.addUserToFilter(filter))
        if (order) {
            // query.using('createdAt')
            query.filter('createdAt').ge(+new Date - 365 * 24 * 60 * 60 * 1000)
            query.sort(order)
        }
        if (limit) {
            query.limit(limit)
        }

        return (await query.exec()).toJSON().map((m: Data) => this.dataFromDB(m))
    }

    async getFirst(filter: Partial<Data>): Promise<Data | undefined> {
        return (await this.getList(this.addUserToFilter(filter), {limit: 1}))[0]
    }

    dataFromDB(model: Data): Data {
        if (model?.data && typeof model?.data === 'string') {
            try {
                model.data = JSON.parse(model.data)
            } catch (e) {
                console.error('Parse data error', e)
            }
        }
        return model
    }

    dataToDB(model: Data) {
        if (model.data && typeof model.data === 'object') {
            try {
                model.data = JSON.stringify(model.data)
            } catch (e) {
                console.error('Stringify data error', e)
            }
        }
        if (model?.createdAt && typeof model?.createdAt === "string") {
            model.createdAt = Number(new Date(model.createdAt))
        }
        return model
    }

    async create(data: Data): Promise<Data> {
        const d = {
            id: this.getRandomId(),
            createdAt: this.getNowUnix(),
            user: this.user,
            ...this.dataToDB(data),
        }

        const s: BaseDocument = await this.model.create(d) as BaseDocument;

        return this.dataFromDB(s.toJSON() as Data) as Data
    }

    async update({id, ...data}: Data): Promise<Data> {
        await this.model.update(id as string, this.dataToDB(data as Data));
        return {id, ...data} as Data
    }

    async removeFields(id: string | undefined, fieldList: string[]): Promise<void> {
        if (id) {
            await this.model.update(id, {$REMOVE: fieldList});
        }
    }

    getRandomId(): string {
        return v4();
    }

    getNowUnix(): number {
        return parseInt(String(+new Date()))
    }

    async deleteById(id: string | undefined): Promise<void> {
        if (id) {
            const el = await this.getById(id)
            if (el && el?.user === this.user) {
                return this.model.delete(id)
            }
        }
    }

    async getById(id: string | undefined): Promise<Data | undefined> {
        if (!id) {
            return undefined
        }
        const res = await this.model.get(id)
        if (!res) {
            return undefined
        }
        return this.dataFromDB(res.toJSON() as Data)
    }
}
