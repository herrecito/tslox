import * as fs from "fs"
import * as readline from "readline"

import Token from "./Token"
import Scanner from "./Scanner"

export class Lox {
    static hadError = false

    static main(): void {
        const { argv } = process

        if (argv.length > 3) {
            console.log("Usage: jlox [script]")
            process.exit(64)
        } else if (argv.length == 3) {
            this.runFile(argv[2])
        } else {
            this.runPrompt()
        }
    }

    static runFile(path: string): void {
        const source = fs.readFileSync(path, "utf8")
        this.run(source)
        if (this.hadError) process.exit(65)
    }

    static runPrompt(): void {
        const rl = readline.createInterface({
            input:  process.stdin,
            output: process.stdout
        })

        const query = () => {
            rl.question('> ', (answer) => {
                if (answer.length > 0) {
                    this.run(answer)
                    this.hadError = false
                    query()
                } else {
                    rl.close()
                }
            })
        }

        query()
    }

    static run(source: string): void {
        const scanner = new Scanner(source)
        const tokens: Token[] = scanner.scanTokens()

        for (const token of tokens) {
            console.log(`${token}`)
        }
    }

    static error(line: number, message: string): void {
        this.report(line, "", message)
    }

    static report(line: number, where: string, message: string): void {
        console.log(`[line ${line}] Error ${where}: ${message}`)
        this.hadError = true
    }
}

Lox.main()
