import {
    FunctionType, ClassType,
    ExprVisitor, StmtVisitor, Block, Stmt, Var, Variable, Expr, Assign, Func, Expression, If, Print,
    Return, While, Binary, Call, Grouping, Literal, Logical, Unary, Class, Get, Set, This
} from "./types"
import Interpreter from "./Interpreter"
import Token from "./Token"
import { Lox } from "./main"

export default class Resolver implements StmtVisitor<void>, ExprVisitor<void> {
    interpreter: Interpreter
    scopes = new Array<Map<string, boolean>>()
    currentFunction: FunctionType = "NONE"
    currentClass: ClassType = "NONE"

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter
    }

    visitBlockStmt(stmt: Block): void {
        this.beginScope()
        this.resolveStmts(stmt.statements)
        this.endScope()
    }

    visitClassStmt(stmt: Class): void {
        const enclosingClass = this.currentClass
        this.currentClass = "CLASS"
        this.declare(stmt.name) // define?

        this.beginScope()
        this.scopes[this.scopes.length-1].set("this", true)

        for (const method of stmt.methods) {
            let decl: FunctionType = "METHOD"
            if (method.name.lexeme == "init") {
                decl = "INITIALIZER"
            }
            this.resolveFunction(method, decl)
        }
        this.define(stmt.name)
        this.endScope()
        this.currentClass = enclosingClass
    }

    visitExpressionStmt(stmt: Expression): void {
        this.resolveExpr(stmt.expression)
    }

    visitFuncStmt(stmt: Func): void {
        this.declare(stmt.name)
        this.define(stmt.name)
        this.resolveFunction(stmt, "FUNCTION")
    }

    visitIfStmt(stmt: If): void {
        this.resolveExpr(stmt.condition)
        this.resolveStmt(stmt.thenBranch)
        if (stmt.elseBranch !== undefined) this.resolveStmt(stmt.elseBranch)
    }

    visitPrintStmt(stmt: Print): void {
        this.resolveExpr(stmt.expression)
    }

    visitReturnStmt(stmt: Return): void {
        if (this.currentFunction == "NONE") {
            Lox.errorWithToken(stmt.keyword, "Can't return from top-level code.")
        }

        if (stmt.value !== undefined) {
            if (this.currentFunction == "INITIALIZER") {
                Lox.errorWithToken(stmt.keyword,
                    "Can't return a value from an initializer.")
            }
            this.resolveExpr(stmt.value)
        }
    }

    visitVarStmt(stmt: Var): void {
        this.declare(stmt.name)
        if (stmt.initializer !== undefined) {
            this.resolveExpr(stmt.initializer)
        }
        this.define(stmt.name)
    }

    visitWhileStmt(stmt: While): void {
        this.resolveExpr(stmt.condition)
        this.resolveStmt(stmt.body)
    }

    visitAssignExpr(expr: Assign): void {
        this.resolveExpr(expr.value)
        this.resolveLocal(expr, expr.name)
    }

    visitBinaryExpr(expr: Binary): void {
        this.resolveExpr(expr.left)
        this.resolveExpr(expr.right)
    }

    visitCallExpr(expr: Call): void {
        this.resolveExpr(expr.callee)

        for (const arg of expr.args) {
            this.resolveExpr(arg)
        }
    }

     visitGetExpr(expr: Get): void {
         this.resolveExpr(expr.obj)
     }

    visitGroupingExpr(expr: Grouping): void {
        this.resolveExpr(expr.expression)
    }

    visitLiteralExpr(expr: Literal): void {
        return undefined
    }

    visitLogicalExpr(expr: Logical): void {
        this.resolveExpr(expr.left)
        this.resolveExpr(expr.right)
    }

    visitSetExpr(expr: Set): void {
        this.resolveExpr(expr.value)
        this.resolveExpr(expr.obj)
    }

    visitThisExpr(expr: This): void {
        if (this.currentClass == "NONE") {
            Lox.errorWithToken(expr.keyword, "Can't use 'this' outside of a class.")
        } else {
            this.resolveLocal(expr, expr.keyword)
        }
    }

    visitUnaryExpr(expr: Unary): void {
        this.resolveExpr(expr.right)
    }

    visitVariableExpr(expr: Variable): void {
        const { scopes } = this
        if (scopes.length != 0 && scopes[scopes.length - 1].get(expr.name.lexeme) === false) {
            Lox.errorWithToken(expr.name, "Can't read local variable in its own initializer.")
        }

        this.resolveLocal(expr, expr.name)
    }

    resolveStmts(statements: Stmt[]): void {
        for (const statement of statements) {
            this.resolveStmt(statement)
        }
    }

    resolveStmt(stmt: Stmt): void {
        stmt.accept(this)
    }

    resolveExpr(expr: Expr): void {
        expr.accept(this)
    }

    resolveFunction(func: Func, kind: FunctionType): void {
        const enclosingFunction = this.currentFunction
        this.currentFunction = kind

        this.beginScope()
        for (const param of func.params) {
            this.declare(param)
            this.define(param)
        }
        this.resolveStmts(func.body)
        this.endScope()

        this.currentFunction = enclosingFunction
    }

    beginScope(): void {
        this.scopes.push(new Map<string, boolean>())
    }

    endScope(): void {
        this.scopes.pop()
    }

    declare(name: Token): void {
        if (this.scopes.length == 0) return

        const scope = this.scopes[this.scopes.length - 1]
        if (scope.has(name.lexeme)) {
            Lox.errorWithToken(name, "Already a variable with this name in this scope.")
        }
        scope.set(name.lexeme, false)
    }

    define(name: Token): void {
        if (this.scopes.length == 0) return
        this.scopes[this.scopes.length - 1].set(name.lexeme, true)
    }

    resolveLocal(expr: Expr, name: Token): void {
        const { scopes, interpreter } = this

        for (let i = scopes.length - 1; i >=0; i -= 1) {
            if (scopes[i].has(name.lexeme)) {
                interpreter.resolve(expr, scopes.length - 1 - i)
                return
            }
        }
    }
}
