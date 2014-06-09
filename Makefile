test:
	mocha --ui tdd -R spec tests/airtests.js

test-debug:
	mocha debug --ui tdd -R spec tests/airtests.js

test-perf:
	../node/node --prof --trace-opt --trace-deopt tests/perftest.js > tests/perf-logs/windtunnel-opt-depot.txt # Run version of node with known v8.log format.
	D8_PATH=../node/deps/v8/out/native ../node/deps/v8/tools/mac-tick-processor v8.log > tests/perf-logs/windtunnel_perf.txt

test-perf-big:
	../node/node --prof --trace-opt --trace-deopt tests/perftest.js > tests/perf-logs/big-opt-deopt.txt # Run version of node with known v8.log format.
	D8_PATH=../node/deps/v8/out/native ../node/deps/v8/tools/mac-tick-processor v8.log > tests/perf-logs/big-perf.txt

test-inspector:
	node-inspector &
	mocha --debug-brk --ui tdd -R spec tests/airtests.js -t 60000 &
	open http://127.0.0.1:8080/debug?port=5858

testview:
	python -m SimpleHTTPServer &
	open http://localhost:8000/tests/resultsviewer

