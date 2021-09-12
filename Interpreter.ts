import { performance } from "perf_hooks"

import Token, { ValueType } from "./Token"
import {
    Var, Variable, Stmt, StmtVisitor, Print, Expression, Expr, Literal, Visitor, Grouping, Unary,
    Binary, Assign, Block, If, Logical, While, Call, Func, Return
} from "./types"

import { Lox } from "./main"
import Environment from "./Environment"
import LoxCallable, { LoxFunction } from "./LoxCallable"

export class RuntimeError extends Error {
    token: Token

    constructor(token: Token, message: string) {
        super(message)
        this.token = token
    }
}

export class ReturnException {
    value: ValueType

    constructor(value: ValueType) {
        this.value = value
    }
}

export default class Interpreter implements Visitor<ValueType>, StmtVisitor<void> {
    globals = new Environment()
    #environment = this.globals

    constructor() {
        this.globals.define("clock", new class extends LoxCallable {
            arity(): number {
                return 0
            }

            call(interpreter: Interpreter, args: ValueType[]): ValueType {
                return performance.now()
            }

            toString(): string {
                return "<native fn>"
            }
        }())
    }

    visitLiteralExpr(expr: Literal): ValueType {
        return expr.value
    }

    visitLogicalExpr(expr: Logical): ValueType {
        const left = this.evaluate(expr.left)

        if (expr.operator.type == "OR") {
            if (this.isTruthy(left)) return left
        } else {
            if (!this.isTruthy(left)) return left
        }

        return this.evaluate(expr.right)
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

    visitCallExpr(expr: Call): ValueType {
        const callee = this.evaluate(expr.callee)

        const args: ValueType[] = []
        for (const arg of expr.args) {
            args.push(this.evaluate(arg))
        }

        // TODO problem! can check "implementsof"
        if (!(callee instanceof LoxCallable)) {
            throw new RuntimeError(expr.paren, "Can only call functions and classes.")
        }

        const func = callee as LoxCallable
        if (args.length != func.arity()) {
            throw new RuntimeError(expr.paren,
                `Expected ${func.arity()} arguments but got ${args.length}.`)
        }
        return func.call(this, args)
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

    executeBlock(statements: Stmt[], environment: Environment): void {
        const previous = this.#environment
        try {
            this.#environment = environment

            for (const stmt of statements) {
                this.execute(stmt)
            }
        } finally {
            this.#environment = previous
        }
    }

    visitBlockStmt(block: Block): void {
        this.executeBlock(block.statements, new Environment(this.#environment))
    }

    visitExpressionStmt(stmt: Expression): void {
        this.evaluate(stmt.expression)
    }

    visitFuncStmt(stmt: Func): void {
        const func = new LoxFunction(stmt, this.#environment)
        this.#environment.define(stmt.name.lexeme, func)
    }

    visitIfStmt(stmt: If): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch)
        } else if (stmt.elseBranch !== undefined) {
            this.execute(stmt.elseBranch)
        }
    }

    visitPrintStmt(stmt: Print): void {
        const value = this.evaluate(stmt.expression)
        console.log(this.stringify(value))
    }

    visitReturnStmt(stmt: Return): void {
        let value: ValueType = undefined
        if (stmt.value !== undefined) value = this.evaluate(stmt.value)
        throw new ReturnException(value)
    }

    visitVarStmt(stmt: Var): void {
        let value: ValueType = undefined
        if (stmt.initializer !== undefined) {
            value = this.evaluate(stmt.initializer)
        }
        this.#environment.define(stmt.name.lexeme, value)
    }

    visitWhileStmt(stmt: While): void {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body)
        }
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
