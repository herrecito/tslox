import LoxClass from "./LoxClass"
import Token from "./Token"
import { ValueType } from "./types"
import RuntimeError from "./RuntimeError"

export default class LoxInstance {
    klass: LoxClass
    fields = new Map<string, ValueType>()

    constructor(klass: LoxClass) {
        this.klass = klass
    }

    toString(): string {
        return `${this.klass.name} instance`
    }

    get(name: Token): ValueType {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme)
        }

        const method = this.klass.findMethod(name.lexeme)
        if (method !== undefined) return method.bind(this)

        throw new RuntimeError(name,
            `Undefined property: '${name.lexeme}'.`)
    }

    set(name: Token, value: ValueType): void {
        this.fields.set(name.lexeme, value)
    }
}
