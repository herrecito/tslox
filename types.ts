import Token, { ValueType } from "./Token"

// TODO namespace this
//
export interface Stmt {
    accept<R>(visitor: StmtVisitor<R>): R
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

export class Print implements Stmt {
    expression: Expr

    constructor(expression: Expr) {
        this.expression = expression
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitPrintStmt(this)
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
}

export interface StmtVisitor<R> {
    visitExpressionStmt(stmt: Expression): R
    visitPrintStmt(stmt: Print): R
    visitVarStmt(stmt: Var): R
}
