import Interpreter from "./Interpreter"
import Environment from "./Environment"
import LoxCallable from "./LoxCallable"
import LoxInstance from "./LoxInstance"
import { Func, ValueType } from "./types"
import ReturnException from "./ReturnException"

export default class LoxFunction extends LoxCallable {
    declaration: Func
    closure: Environment
    isInitializer: boolean

    constructor(declaration: Func, closure: Environment, isInitializer: boolean) {
        super()
        this.declaration = declaration
        this.closure = closure
        this.isInitializer = isInitializer
    }

    bind(instance: LoxInstance): LoxFunction {
        const env = new Environment(this.closure)
        env.define("this", instance)
        return new LoxFunction(this.declaration, env, this.isInitializer)
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
                if (this.isInitializer) return this.closure.getAt(0, "this")
                return e.value
            } else {
                throw e
            }
        }
        if (this.isInitializer) return this.closure.getAt(0, "this")
        return undefined
    }

    arity(): number {
        return this.declaration.params.length
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`
    }
}
