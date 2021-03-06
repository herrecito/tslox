import { ValueType } from "./types"
import LoxCallable from "./LoxCallable"
import Interpreter from "./Interpreter"
import LoxInstance from "./LoxInstance"
import LoxFunction from "./LoxFunction"

export default class LoxClass extends LoxCallable {
    name: string
    superclass?: LoxClass
    methods = new Map<string, LoxFunction>()

    constructor(name: string, superclass: LoxClass | undefined, methods: Map<string, LoxFunction>) {
        super()
        this.name = name
        this.superclass = superclass
        this.methods = methods
    }

    call(interpreter: Interpreter, args: ValueType[]): ValueType {
        const instance = new LoxInstance(this)
        const initializer = this.findMethod("init")
        if (initializer !== undefined) {
            initializer.bind(instance).call(interpreter, args)
        }
        return instance
    }

    arity(): number {
        const initializer = this.findMethod("init")
        if (initializer === undefined) return 0
        return initializer.arity()
    }

    findMethod(name: string): LoxFunction | undefined {
        if (this.methods.has(name)) {
            return this.methods.get(name)
        } else if (this.superclass !== undefined) {
            return this.superclass.findMethod(name)
        } else {
            return undefined
        }
    }

    toString(): string {
        return this.name
    }
}
