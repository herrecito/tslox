import { ValueType } from "./types"

export default class ReturnException {
    value: ValueType

    constructor(value: ValueType) {
        this.value = value
    }
}
