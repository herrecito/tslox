import Token, { TokenType } from "./Token"
import { Lox } from "./main"

import { Expr, Binary, Unary, Literal, Grouping } from "./types"

class ParseError extends Error {
}

export default class Parser {
    #tokens: Token[]
    #current = 0

    constructor(tokens: Token[]) {
        this.#tokens = tokens
    }

    parse(): Expr | undefined {
        try {
            return this.expression()
        } catch(e: unknown) {
            if (e instanceof ParseError) {
                return undefined
            } else {
                throw e
            }
        }
    }

    expression(): Expr {
        return this.equality()
    }

    equality(): Expr {
        let expr = this.comparison()
        while (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
            const operator = this.previous()
            const right = this.comparison()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    comparison(): Expr {
        let expr = this.term()

        while (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
            const operator = this.previous()
            const right = this.term()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    term(): Expr {
        let expr = this.factor()

        while (this.match("MINUS", "PLUS")) {
            const operator = this.previous()
            const right = this.factor()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    factor(): Expr {
        let expr = this.unary()

        while (this.match("SLASH", "STAR")) {
            const operator = this.previous()
            const right = this.unary()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    unary(): Expr {
        if (this.match("BANG", "MINUS")) {
            const operator = this.previous()
            const right = this.unary()
            return new Unary(operator, right)
        }

        return this.primary()
    }

    primary(): Expr {
        if (this.match("FALSE")) return new Literal(false)
        if (this.match("TRUE")) return new Literal(true)
        if (this.match("NIL")) return new Literal(undefined)

        if (this.match("NUMBER", "STRING")) {
            return new Literal(this.previous().literal)
        }

        if (this.match("LEFT_PAREN")) {
            const expr = this.expression()
            this.consume("RIGHT_PAREN", "Expected ')' after expression.")
            return new Grouping(expr)
        }

        throw this.error(this.peek(), "Expected expression.")
    }

    match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance()
                return true
            }
        }
        return false
    }

    consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance()
        throw this.error(this.peek(), message)
    }

    check(type: TokenType): boolean {
        if (this.isAtEnd()) return false
        return this.peek().type == type
    }

    advance(): Token {
        if (!this.isAtEnd()) this.#current += 1
        return this.previous()
    }

    isAtEnd(): boolean {
        return this.peek().type == "EOF"
    }

    peek(): Token {
        return this.#tokens[this.#current]
    }

    previous(): Token {
        return this.#tokens[this.#current - 1]
    }

    error(token: Token, message: string): ParseError {
        Lox.errorWithToken(token, message)
        return new ParseError()
    }

    synchronize(): void {
        this.advance()
        while (!this.isAtEnd()) {
            if (this.previous().type == "SEMICOLON") return

            switch (this.peek().type) {
                case "CLASS":
                case "FOR":
                case "FUN":
                case "IF":
                case "PRINT":
                case "RETURN":
                case "VAR":
                case "WHILE":
                    return
            }

            this.advance()
        }
    }
}
