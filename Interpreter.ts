import Token, { ValueType } from "./Token"
import {
    Var, Variable, Stmt, StmtVisitor, Print, Expression, Expr, Literal, Visitor, Grouping, Unary, Binary, Assign,
} from "./types"

import { Lox } from "./main"
import Environment from "./Environment"

export class RuntimeError extends Error {
    token: Token

    constructor(token: Token, message: string) {
        super(message)
        this.token = token
    }
}

export default class Interpreter implements Visitor<ValueType>, StmtVisitor<void> {
    #environment = new Environment()

    visitLiteralExpr(expr: Literal): ValueType {
        return expr.value
    }

    visitGroupingExpr(expr: Grouping): ValueType {
        return this.evaluate(expr.expression)
    }

    visitUnaryExpr(expr: Unary): ValueType {
        const right = this.evaluate(expr.right)
        switch (expr.operator.type) {
            case "MINUS":
                this.checkNumberOperand(expr.operator, right)
                return -(right as number)

            case "BANG":
                return !this.isTruthy(right)
        }

        return undefined
    }

    visitVariableExpr(expr: Variable): ValueType {
        return this.#environment.get(expr.name)
    }

    checkNumberOperand(operator: Token, operand: ValueType): void {
        if (typeof(operand) === "number") return
        throw new RuntimeError(operator, "Operator must be a number")
    }

    visitBinaryExpr(expr: Binary): ValueType {
        const left = this.evaluate(expr.left)
        const right = this.evaluate(expr.right)

        switch (expr.operator.type) {
            case "MINUS":
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) - (right as number)

            case "PLUS": {
                if (typeof(left) === "number" && typeof(right) === "number") {
                    return left + right
                }
                if (typeof(left) === "string" && typeof(right) === "string") {
                    return left + right
                }
                throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings")
            }

            case "SLASH":
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) / (right as number)

            case "STAR":
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) * (right as number)

            case "GREATER":
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) > (right as number)
            case "GREATER_EQUAL":
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) >= (right as number)
            case "LESS":
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) < (right as number)
            case "LESS_EQUAL":
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) <= (right as number)

            case "BANG_EQUAL":
                return !this.isEqual(left, right)
            case "EQUAL_EQUAL":
                return this.isEqual(left, right)
        }

        return undefined
    }

    checkNumberOperands(operator: Token, left: ValueType, right: ValueType): void {
        if (typeof(left) === "number" && typeof(right) === "number") return
        throw new RuntimeError(operator, "Operands must be numbers")
    }

    isTruthy(value: ValueType): boolean {
        if (value === undefined) return false
        if (typeof(value) === "boolean") return value
        return true
    }

    // TODO review
    isEqual(a: ValueType, b: ValueType): boolean {
        if (a === undefined && b === undefined) return true
        if (a === undefined) return false

        return a == b
    }

    evaluate(expr: Expr): ValueType {
        return expr.accept(this)
    }

    execute(stmt: Stmt): void {
        stmt.accept(this)
    }

    visitExpressionStmt(stmt: Expression): void {
        this.evaluate(stmt.expression)
    }

    visitPrintStmt(stmt: Print): void {
        const value = this.evaluate(stmt.expression)
        console.log(this.stringify(value))
    }

    visitVarStmt(stmt: Var): void {
        let value: ValueType = undefined
        if (stmt.initializer !== undefined) {
            value = this.evaluate(stmt.initializer)
        }
        this.#environment.define(stmt.name.lexeme, value)
    }

    visitAssignExpr(expr: Assign): ValueType {
        const value = this.evaluate(expr.value)
        this.#environment.assign(expr.name, value)
        return value
    }

    interpret(statements: Stmt[]): void {
        try {
            for (const stmt of statements) {
                this.execute(stmt)
            }
        } catch (e) {
            if (e instanceof RuntimeError) {
                Lox.runtimeError(e)
            } else {
                throw e
            }
        }
    }

    stringify(value: ValueType): string {
        if (value === undefined) return "nil"

        if (typeof(value) === "number") {
            let text = value.toString()
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2)
            }
            return text
        }

        return value.toString()
    }
}