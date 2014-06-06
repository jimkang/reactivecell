test:
	mocha --ui tdd -R spec tests/airtests.js

test-inspector:
	node-inspector &
	mocha --debug-brk --ui tdd -R spec tests/airtests.js -t 60000 &
	open http://127.0.0.1:8080/debug?port=5858

testview:
	python -m SimpleHTTPServer &
	open http://localhost:8000/tests/resultsviewer

