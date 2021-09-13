import Token from "./Token"
import { ValueType } from "./types"
import RuntimeError from "./RuntimeError"

export default class Environment {
    enclosing?: Environment
    values = new Map<string, ValueType>()

    constructor(enclosing?: Environment) {
        this.enclosing = enclosing
    }

    define(name: string, value: ValueType): void {
        this.values.set(name, value)
    }

    ancestor(distance: number): Environment {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let env: Environment = this
        for (let i = 0; i < distance; i++) {
            if (env.enclosing !== undefined) {
                env = env.enclosing
            } else {
                // TODO how to handle this?
                console.log("we screwed up")
            }
        }
        return env
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

    getAt(distance: number, name: string): ValueType {
        return this.ancestor(distance).values.get(name)
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

    assignAt(distance: number, name: Token, value: ValueType): void {
        this.ancestor(distance).values.set(name.lexeme, value)
    }
}
