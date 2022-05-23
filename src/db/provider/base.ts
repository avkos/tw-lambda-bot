import {v4} from 'uuid'
import {AnyDocument} from "dynamoose/dist/Document";
import {Model} from "dynamoose/dist/Model";

export default class BaseProvider<BaseDocument extends AnyDocument, Data extends { data?: string | object, id?: string, createdAt?: string | number }> {
    model: Model

    constructor(model: Model) {
        this.model = model
    }

    async getList(filter: Partial<Data>): Promise<Data[]> {
        return (await this.model.query(filter).exec()).toJSON().map((m: Data) => this.dataFromDB(m))
    }

    async getFirst(filter: Partial<Data>): Promise<Data | undefined> {
        return (await this.getList(filter))[0]
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
        const d ={
            ...this.dataToDB(data),
            id: this.getRandomId(),
            createdAt: this.getNowUnix(),
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
            return this.model.delete(id)
        }
    }

    async getById(id: string | undefined): Promise<Data | undefined> {
        if (!id) {
            return undefined
        }
        const res = await this.model.get(id)
        if(!res){
            return undefined
        }
        return this.dataFromDB(res.toJSON() as Data)
    }
}
