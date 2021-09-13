import Interpreter from "./Interpreter"
import Environment from "./Environment"
import LoxCallable from "./LoxCallable"
import { Func, ValueType } from "./types"
import ReturnException from "./ReturnException"

export default class LoxFunction extends LoxCallable {
    declaration: Func
    closure: Environment

    constructor(declaration: Func, closure: Environment) {
        super()
        this.declaration = declaration
        this.closure = closure
    }

    call(interpreter: Interpreter, args: ValueType[]): ValueType {
        const env = new Environment(this.closure)
        for (let i = 0; i < this.declaration.params.length; i++) {
            env.define(this.declaration.params[i].lexeme, args[i])
        }
        try {
            interpreter.executeBlock(this.declaration.body, env)
        } catch (e: unknown) {
            if (e instanceof ReturnException) {
                return e.value
            } else {
                throw e
            }
        }
        return undefined
    }

    arity(): number {
        return this.declaration.params.length
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`
    }
}
