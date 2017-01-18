BROWSERIFY ?= ./node_modules/.bin/browserify

public/main.js: lib/index.js
	$(BROWSERIFY) $< -o $@
