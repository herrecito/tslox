import Token, { TokenType } from "./Token"
import { Lox } from "./main"

import {
    Assign, Var, Variable, Stmt, Print, Expression, Expr, Binary, Unary, Literal, Grouping, Block,
    If, Logical, While, Call, Func, Return
} from "./types"

class ParseError extends Error {
}

export default class Parser {
    #tokens: Token[]
    #current = 0

    constructor(tokens: Token[]) {
        this.#tokens = tokens
    }

    parse(): Stmt[] {
        const statements: Stmt[] = []
        while (!this.isAtEnd()) {
            const decl = this.declaration()
            if (decl !== undefined) statements.push(decl) // TODO not handled in the book
        }
        return statements
    }

    expression(): Expr {
        return this.assignment()
    }

    declaration(): Stmt | undefined {
        try {
            if (this.match("FUN")) return this.function("function")
            if (this.match("VAR")) return this.varDeclaration()
            return this.statement()
        } catch (e) {
            if (e instanceof ParseError) {
                this.synchronize()
                return undefined
            } else {
                throw e
            }
        }
    }

    statement(): Stmt {
        if (this.match("FOR")) return this.forStatement()
        if (this.match("IF")) return this.ifStatement()
        if (this.match("PRINT")) return this.printStatement()
        if (this.match("RETURN")) return this.returnStatement()
        if (this.match("WHILE")) return this.whileStatement()
        if (this.match("LEFT_BRACE")) return new Block(this.block())
        return this.expressionStatement()
    }

    forStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'for'.")

        let initializer: Stmt | undefined
        if (this.match("SEMICOLON")) {
            initializer = undefined
        } else if (this.match("VAR")) {
            initializer = this.varDeclaration()
        } else {
            initializer = this.expressionStatement()
        }

        let condition: Expr | undefined = undefined
        if (!this.check("SEMICOLON")) {
            condition = this.expression()
        }
        this.consume("SEMICOLON", "Expect ';' after loop condition.")

        let increment: Expr | undefined = undefined
        if (!this.check("RIGHT_PAREN")) {
            increment = this.expression()
        }
        this.consume("RIGHT_PAREN", "Expect ')' after for clauses.")

        let body = this.statement()

        if (increment !== undefined) {
            body = new Block([body, new Expression(increment)])
        }

        if (condition === undefined) condition = new Literal(true)
        body = new While(condition, body)

        if (initializer !== undefined) {
            body = new Block([initializer, body])
        }

        return body
    }

    ifStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'if'.")
        const condition = this.expression()
        this.consume("RIGHT_PAREN", "Expect ')' after if condition.")

        const thenBranch = this.statement()
        let elseBranch: Stmt | undefined = undefined
        if (this.match("ELSE")) {
            elseBranch = this.statement()
        }

        return new If(condition, thenBranch, elseBranch)
    }

    printStatement(): Stmt {
        const value = this.expression()
        this.consume("SEMICOLON", "Expect ';' after value.")
        return new Print(value)
    }

    returnStatement(): Stmt {
        const keyword = this.previous()
        let value: Expr | undefined = undefined
        if (!this.check("SEMICOLON")) {
            value = this.expression()
        }
        this.consume("SEMICOLON", "Expect ';' after return value.")
        return new Return(keyword, value)
    }

    whileStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'while'.")
        const condition = this.expression()
        this.consume("RIGHT_PAREN", "Expect ')' after while condition.")
        const body = this.statement()

        return new While(condition, body)
    }

    varDeclaration(): Stmt {
        const name = this.consume("IDENTIFIER", "Expect variable name.")
        let initializer: Expr | undefined
        if (this.match("EQUAL")) {
            initializer = this.expression()
        }
        this.consume("SEMICOLON", "Expect ';' after variable declaration.")
        return new Var(name, initializer)
    }

    expressionStatement(): Stmt {
        const expr = this.expression()
        this.consume("SEMICOLON", "Expect ';' after expression.")
        return new Expression(expr)
    }

    function(kind: string): Func {
        const name = this.consume("IDENTIFIER", `Expect ${kind} name.`)
        this.consume("LEFT_PAREN", `Expect '(' after ${kind} name.`)
        const parameters: Token[] = []
        if (!this.check("RIGHT_PAREN")) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.")
                }
                parameters.push(
                    this.consume("IDENTIFIER", "Expect parameter name."))
            } while (this.match("COMMA"))
        }
        this.consume("RIGHT_PAREN", "Expect ')' after parameters.")

        this.consume("LEFT_BRACE", `Expect '{' before ${kind} body.`)
        const body = this.block()
        return new Func(name, parameters, body)
    }

    block(): Stmt[] {
        const statements: Stmt[] = []

        while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
            const decl = this.declaration()
            if (decl !== undefined) statements.push(decl) // TODO not handled in the book
        }

        this.consume("RIGHT_BRACE", "Expect '}' after block.")
        return statements
    }

    assignment(): Expr {
        const expr = this.or()

        if (this.match("EQUAL")) {
            const equals = this.previous()
            const value = this.assignment()

            if (expr instanceof Variable) {
                return new Assign(expr.name, value)
            }

            this.error(equals, "Invalid assignment target.")
        }

        return expr
    }

    or(): Expr {
        let expr = this.and()

        while (this.match("OR")) {
            const operator = this.previous()
            const right = this.and()
            expr = new Logical(expr, operator, right)
        }

        return expr
    }

    and(): Expr {
        let expr = this.equality()

        while (this.match("AND")) {
            const operator = this.previous()
            const right = this.equality()
            expr = new Logical(expr, operator, right)
        }

        return expr
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

        return this.call()
    }

    finishCall(callee: Expr): Expr {
        const args: Expr[] = []
        if (!this.check(("RIGHT_PAREN"))) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 arguments.")
                }
                args.push(this.expression())
            } while (this.match("COMMA"))
        }

        const paren = this.consume("RIGHT_PAREN", "Expect ')' after arguments.")

        return new Call(callee, paren, args)
    }

    call(): Expr {
        let expr = this.primary()

        while (true) {
            if (this.match("LEFT_PAREN")) {
                expr = this.finishCall(expr)
            } else {
                break;
            }
        }

        return expr
    }

    primary(): Expr {
        if (this.match("FALSE")) return new Literal(false)
        if (this.match("TRUE")) return new Literal(true)
        if (this.match("NIL")) return new Literal(undefined)

        if (this.match("NUMBER", "STRING")) {
            return new Literal(this.previous().literal)
        }

        if (this.match("IDENTIFIER")) {
            return new Variable(this.previous())
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
