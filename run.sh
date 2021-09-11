#!/usr/bin/env bash

set -ex

SRCS=(
    "main.ts"
    "Token.ts"
    "Scanner.ts"
    "types.ts"
    "AstPrinter.ts"
    "Parser.ts"
)

$(npm bin)/eslint ${SRCS[@]} && $(npm bin)/tsc && node main.js $@
