import Token, { ValueType } from "./Token"
import { RuntimeError } from "./Interpreter"

export default class Environment {
    enclosing?: Environment
    values = new Map<string, ValueType>()

    constructor(enclosing?: Environment) {
        this.enclosing = enclosing
    }

    define(name: string, value: ValueType): void {
        this.values.set(name, value)
    }

    get(name: Token): ValueType {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme)
        }

        if (this.enclosing !== undefined) {
            return this.enclosing.get(name)
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }

    assign(name: Token, value: ValueType): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value)
            return
        }

        if (this.enclosing !== undefined) {
            this.enclosing.assign(name, value)
            return
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }
}
