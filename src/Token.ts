import { TokenType, ValueType } from "./types"

export default class Token {
    type: TokenType
    lexeme: string
    literal: ValueType
    line: number

    constructor(type: TokenType, lexeme: string, literal: ValueType, line: number) {
        this.type = type
        this.lexeme = lexeme
        this.literal = literal
        this.line = line
    }

    toString(): string {
        return `${this.type} ${this.lexeme} ${this.literal}`
    }
}
