import Token, { TokenType } from "./Token"
import { Lox } from "./main"

export default class Scanner {
    #source: string
    #tokens: Token[] = []

    constructor(source: string) {
        this.#source = source
    }

    #start = 0
    #current = 0
    #line = 1
    #keywords: Map<string, TokenType> = new Map([
        ["and", "AND"],
        ["class", "CLASS"],
        ["else", "ELSE"],
        ["false", "FALSE"],
        ["for", "FOR"],
        ["fun", "FUN"],
        ["if", "IF"],
        ["nil", "NIL"],
        ["or", "OR"],
        ["print", "PRINT"],
        ["return", "RETURN"],
        ["super", "SUPER"],
        ["this", "THIS"],
        ["true", "TRUE"],
        ["var", "VAR"],
        ["while", "WHILE"],
    ])

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.#start = this.#current
            this.scanToken()
        }
        this.#tokens.push(new Token("EOF", "", undefined, this.#line))
        return this.#tokens
    }

    scanToken(): void {
        const c = this.advance()
        switch (c) {
            case "(": this.addToken("LEFT_PAREN"); break;
            case ")": this.addToken("RIGHT_PAREN"); break;
            case "{": this.addToken("LEFT_BRACE"); break;
            case "}": this.addToken("RIGHT_BRACE"); break;
            case ",": this.addToken("COMMA"); break;
            case ".": this.addToken("DOT"); break;
            case "-": this.addToken("MINUS"); break;
            case "+": this.addToken("PLUS"); break;
            case ";": this.addToken("SEMICOLON"); break;
            case "*": this.addToken("STAR"); break;

            case "!": this.addToken(this.match("=") ? "BANG_EQUAL" : "BANG"); break;
            case "=": this.addToken(this.match("=") ? "EQUAL_EQUAL" : "EQUAL"); break;
            case "<": this.addToken(this.match("=") ? "LESS_EQUAL" : "LESS"); break;
            case ">": this.addToken(this.match("=") ? "GREATER_EQUAL" : "GREATER"); break;

            case "/":
                if (this.match("/")) {
                    while (this.peek() != "\n" && !this.isAtEnd()) this.advance()
                } else {
                    this.addToken("SLASH")
                }
                break

            case " ":
            case "\r":
            case "\t":
                // Ignore whitespace
                break

            case "\n":
                this.#line += 1
                break

            case '"': this.string(); break;

            default:
                if (this.isDigit(c)) {
                    this.number()
                } else if (this.isAlpha(c)) {
                    this.identifier()
                } else {
                    Lox.error(this.#line, "Unexpected character.");
                }

        }
    }

    advance(): string {
        return this.#source[this.#current++]
    }

    match(expected: string): boolean {
        if (this.isAtEnd()) return false
        if (this.#source[this.#current] != expected) return false
        this.#current += 1
        return true
    }

    peek(): string {
        if (this.isAtEnd()) return "\0"
        return this.#source[this.#current]
    }

    peekNext(): string {
        if (this.#current + 1 >= this.#source.length) return "\0"
        return this.#source[this.#current + 1]
    }

    addToken(type: TokenType, literal?: string | number): void {
        const text = this.#source.substring(this.#start, this.#current)
        this.#tokens.push(new Token(type, text, literal, this.#line))
    }

    string(): void {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == "\n") this.#line += 1
            this.advance()
        }
        if (this.isAtEnd()) {
            Lox.error(this.#line, "Unterminated string.")
            return
        }
        this.advance() // The closing ".

        // Trim the surrounding quites.
        const value = this.#source.substring(this.#start + 1, this.#current - 1)
        this.addToken("STRING", value)
    }

    number(): void {
        while (this.isDigit(this.peek())) this.advance()

        if (this.peek() == "." && this.isDigit(this.peekNext())) {
            this.advance()

            while (this.isDigit(this.peek())) this.advance()
        }

        this.addToken("NUMBER",
            Number.parseFloat(this.#source.substring(this.#start, this.#current)))
    }

    identifier(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance()
        const text = this.#source.substring(this.#start, this.#current)
        let type = this.#keywords.get(text)
        if (type === undefined) type = "IDENTIFIER"
        this.addToken(type)
    }

    isAtEnd(): boolean {
        return this.#current >= this.#source.length
    }

    isDigit(c: string): boolean {
        return c >= '0' && c <= '9'
    }

    isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= '>') || c ==  "_"
    }

    isAlphaNumeric(c: string): boolean {
        return this.isDigit(c) || this.isAlpha(c)
    }
}
