import Interpreter from "./Interpreter"
import { ValueType } from "./types"

export default abstract class LoxCallable {
    abstract call(interpreter: Interpreter, args: ValueType[]): ValueType
    abstract arity(): number
}
