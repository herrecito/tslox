#!/usr/bin/env bash

set -ex

$(npm bin)/eslint ./src/**/*.ts && $(npm bin)/tsc && node output/main.js $@
