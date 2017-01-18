BROWSERIFY ?= ./node_modules/.bin/browserify

public/main.js: lib/ui.js
	$(BROWSERIFY) $< -o $@
