import Token, { LiteralType } from "./Token"

export interface Expr {
    accept<R>(visitor: Visitor<R>): R
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
    value: LiteralType

    constructor(value: LiteralType) {
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

export interface Visitor<R> {
    visitBinaryExpr(binary: Binary): R
    visitGroupingExpr(grouping: Grouping): R
    visitLiteralExpr(literal: Literal): R
    visitUnaryExpr(unary: Expr): R
}
