import Token, { ValueType } from "./Token"
import { RuntimeError } from "./Interpreter"

export default class Environment {
    values = new Map<string, ValueType>()

    define(name: string, value: ValueType): void {
        this.values.set(name, value)
    }

    get(name: Token): ValueType {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme)
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }

    assign(name: Token, value: ValueType): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value)
        } else {
            throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
        }
    }
}
