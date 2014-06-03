test:
	mocha --ui tdd -R spec tests/airtests.js

testview: test
	python -m SimpleHTTPServer &
	open http://localhost:8000/tests/resultsviewer

