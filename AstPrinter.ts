import {
    Assign, Variable, Visitor, Binary, Grouping, Literal, Expr, Unary, Logical, Call
} from "./types"

export default class AstPrinter implements Visitor<string> {
    visitBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
    }

    visitCallExpr(expr: Call): string {
        return `(call) ${expr}` // TODO
    }

    visitLogicalExpr(expr: Logical): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
    }

    visitGroupingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression)
    }

    visitLiteralExpr(expr: Literal): string {
        if (expr.value === undefined) return "nil"
        return expr.value.toString()
    }

    visitUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right)
    }

    visitVariableExpr(expr: Variable): string {
        return expr.name.lexeme
    }

    visitAssignExpr(expr: Assign): string {
        return `(${expr.name.lexeme} = ${expr.value.accept(this)})`
    }

    parenthesize(name: string, ...exprs: Expr[]): string {
        return `(${name} ${exprs.map(e => e.accept(this)).join(" ")} )`
    }

    print(expression: Expr): string {
        return expression.accept(this)
    }
}
