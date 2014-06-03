test:
	mocha --ui tdd -R spec tests/airtests.js
	python -m SimpleHTTPServer &
	open http://localhost:8000/tests

