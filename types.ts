import Token, { ValueType } from "./Token"

// TODO namespace this

export interface Stmt {
    accept<R>(visitor: StmtVisitor<R>): R
}

export class Block implements Stmt {
    statements: Stmt[]

    constructor(statements: Stmt[]) {
        this.statements = statements
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitBlockStmt(this)
    }
}

export class Expression implements Stmt {
    expression: Expr

    constructor(expression: Expr) {
        this.expression = expression
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitExpressionStmt(this)
    }
}

export class Func implements Stmt {
    name: Token
    params: Token[]
    body: Stmt[]

    constructor(name: Token, params: Token[], body: Stmt[]) {
        this.name = name
        this.params = params
        this.body = body
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitFuncStmt(this)
    }
}

export class If implements Stmt {
    condition: Expr
    thenBranch: Stmt
    elseBranch?: Stmt

    constructor(condition: Expr, thenBranch: Stmt, elseBranch?: Stmt) {
        this.condition = condition
        this.thenBranch = thenBranch
        this.elseBranch = elseBranch
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitIfStmt(this)
    }
}

export class Print implements Stmt {
    expression: Expr

    constructor(expression: Expr) {
        this.expression = expression
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitPrintStmt(this)
    }
}

export class Return implements Stmt {
    keyword: Token
    value?: Expr

    constructor(keyword: Token, value?: Expr) {
        this.keyword = keyword
        this.value = value
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitReturnStmt(this)
    }
}

export class While implements Stmt {
    condition: Expr
    body: Stmt

    constructor(condition: Expr, body: Stmt) {
        this.condition = condition
        this.body = body
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitWhileStmt(this)
    }
}

export class Var implements Stmt {
    name: Token
    initializer?: Expr

    constructor(name: Token, initializer: Expr | undefined) {
        this.name = name
        this.initializer = initializer
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitVarStmt(this)
    }
}

export interface Expr {
    accept<R>(visitor: Visitor<R>): R
}

export class Assign implements Expr {
    name: Token
    value: Expr

    constructor(name: Token, value: Expr) {
        this.name = name
        this.value = value
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitAssignExpr(this)
    }
}

export class Binary implements Expr {
    left: Expr
    operator: Token
    right: Expr

    constructor(left: Expr, operator: Token, right: Expr) {
        this.left = left
        this.operator = operator
        this.right = right
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBinaryExpr(this)
    }
}

export class Call implements Expr {
    callee: Expr
    paren: Token
    args: Expr[]

    constructor(callee: Expr, paren: Token, args: Expr[]) {
        this.callee = callee
        this.paren = paren
        this.args = args
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitCallExpr(this)
    }
}

export class Logical implements Expr {
    left: Expr
    operator: Token
    right: Expr

    constructor(left: Expr, operator: Token, right: Expr) {
        this.left = left
        this.operator = operator
        this.right = right
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLogicalExpr(this)
    }
}

export class Grouping implements Expr {
    expression: Expr

    constructor(expression: Expr) {
        this.expression = expression
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitGroupingExpr(this)
    }
}

export class Literal implements Expr {
    value: ValueType

    constructor(value: ValueType) {
        this.value = value
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLiteralExpr(this)
    }
}

export class Unary implements Expr {
    operator: Token
    right: Expr

    constructor(operator: Token, right: Expr) {
        this.operator = operator
        this.right = right
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitUnaryExpr(this)
    }
}

export class Variable implements Expr {
    name: Token

    constructor(name: Token) {
        this.name = name
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitVariableExpr(this)
    }
}

export interface Visitor<R> {
    visitBinaryExpr(binary: Binary): R
    visitGroupingExpr(grouping: Grouping): R
    visitLiteralExpr(literal: Literal): R
    visitUnaryExpr(unary: Unary): R
    visitVariableExpr(variable: Variable): R
    visitAssignExpr(assign: Assign): R
    visitLogicalExpr(expr: Logical): R
    visitCallExpr(expr: Call): R
}

export interface StmtVisitor<R> {
    visitExpressionStmt(stmt: Expression): R
    visitPrintStmt(stmt: Print): R
    visitVarStmt(stmt: Var): R
    visitBlockStmt(stmt: Block): R
    visitIfStmt(stmt: If): R
    visitWhileStmt(stmt: While): R
    visitFuncStmt(stmt: Func): R
    visitReturnStmt(stmt: Return): R
}
