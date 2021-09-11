export type TokenType =
    // Single-character tokens.
      "LEFT_PAREN" | "RIGHT_PAREN" | "LEFT_BRACE" | "RIGHT_BRACE" | "COMMA" | "DOT" | "MINUS"
    | "PLUS" | "SEMICOLON" | "SLASH" | "STAR"

    // One or two character tokens.
    | "BANG" | "BANG_EQUAL" | "EQUAL" | "EQUAL_EQUAL" | "GREATER" | "GREATER_EQUAL" | "LESS"
    | "LESS_EQUAL"

    // Literls.
    | "IDENTIFIER" | "STRING" | "NUMBER"

    // Keywords
    | "AND" | "CLASS" | "ELSE" | "FALSE" | "FUN" | "FOR" | "IF" | "NIL" | "OR" | "PRINT" | "RETURN"
    | "SUPER" | "THIS" | "TRUE" | "VAR" | "WHILE" | "EOF"

export type LiteralType = string | number | boolean | undefined

export default class Token {
    type: TokenType
    lexeme: string
    literal: LiteralType
    line: number


    constructor(type: TokenType, lexeme: string, literal: LiteralType, line: number) {
        this.type = type
        this.lexeme = lexeme
        this.literal = literal
        this.line = line
    }

    toString(): string {
        return `${this.type} ${this.lexeme} ${this.literal}`
    }
}
