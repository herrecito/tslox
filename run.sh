#!/usr/bin/env bash

set -ex

SRCS=(
    "main.ts"
    "Token.ts"
    "Scanner.ts"
)

$(npm bin)/eslint ${SRCS[@]} && $(npm bin)/tsc && node main.js $@
