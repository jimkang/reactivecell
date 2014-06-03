require('approvals').mocha(__dirname + '/approvals/airreaction');

var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');
var _ = require('lodash');
var cellmapmaker = require('cellmap');
var createMapParserStream = require('roguemap-parse-stream');
var Writable = require('stream').Writable;
var fs = require('fs');
var fixtures = require('./airtests-fixtures');

var cellCrossMap = null;

function assembleCell(data, coords) {
  return {
    d: _.cloneDeep(data),
    coords: _.cloneDeep(coords)
  };
}

var cellLegend = {
  a: {
    name: 'c_2_2',
    p: 5,
    newP: 5
  },
  b: {
    name: 'c_3_2',
    p: 3,
    newP: 3
  },
  c: {
    name: 'c_2_1',
    p: 1,
    newP: 1
  },
  d: {
    name: 'c_1_2',
    p: 3,
    newP: 3
  },
  e: {
    name: 'c_2_3',
    p: 2,
    newP: 2
  }
};

var reactions = {};

suite('Reaction creation', function reactionCreationSuite() {
  test('A reaction should be created with flow coefficient 0.5', 
    function testCreateDefaultReaction() {
      reactions.airDefault = airReactionFactory();
      assert.equal(typeof reactions.airDefault, 'function');
      assert.equal(reactions.airDefault.opts().flowCoeff, 0.5);
    }
  );

  test('A reaction should be created with flow coefficient 0.6', 
    function testCreateReaction0_6() {
      reactions.air0_6 = airReactionFactory({flowCoeff: 0.6});
      assert.equal(typeof reactions.air0_6, 'function');
      assert.equal(reactions.air0_6.opts().flowCoeff, 0.6);
    }
  );

  test('A reaction should be created with flow coefficient 0.1', 
    function testCreateSlowFlowReaction() {
      reactions.airSlowFlow = airReactionFactory({flowCoeff: 0.1});
      assert.equal(typeof reactions.airSlowFlow, 'function');
      assert.equal(reactions.airSlowFlow.opts().flowCoeff, 0.1);
    }
  );

  test('A reaction should be created with flow coefficient 1.0', 
    function testCreateSloshReaction() {
      reactions.airSlosh = airReactionFactory({flowCoeff: 1.0});
      assert.equal(typeof reactions.airSlosh, 'function');
      assert.equal(reactions.airSlosh.opts().flowCoeff, 1.0);
    }
  );
});

suite('Cross formation', function cellCrossSuite() {
  before(function setUpReactions() {
      reactions.airDefault = airReactionFactory();
      reactions.air0_6 = airReactionFactory({flowCoeff: 0.6});
      reactions.airSlowFlow = airReactionFactory({flowCoeff: 0.1});
      reactions.airSlosh = airReactionFactory({flowCoeff: 1.0});
  });

  beforeEach(function setUpCrossMap(setupDone) {
    cellCrossMap = cellmapmaker.createMap({size: [4, 4]});

    var mapStream = Writable({objectMode: true});
    var cell
    mapStream._write = function addCells(cellTokens, enc, next) {
      var cellPacks = cellTokens.forEach(function cellPackForToken(cellToken) {
        // TODO: Transform stream for to look up keys in legend and return 
        // cell contents?
        var cellData = cellLegend[cellToken.key];
        if (cellData) {
          cellCrossMap.setCell(assembleCell(cellData, cellToken.coords));
        }
      });
      next();
    };
    var fileStream = fs.createReadStream(
      __dirname + '/data/' + 'airtests-cross-map.txt', {encoding: 'utf8'}
    );
    var parserStream = createMapParserStream({
      batchSize: 1
    });

    fileStream.pipe(parserStream);
    parserStream.pipe(mapStream);
    
    parserStream.on('end', function onParseEnd() {
      setupDone();
    });
  });

  test('With a default reaction, ' +
    'pressure should oscillate between the center and arm cells',
    function testDefault() {
      var cellCrossResults = fixtures.applyReactions({
        reaction: reactions.airDefault,
        cellmap: cellCrossMap,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );


  test('With a slosh reaction, ' +
    'pressure should oscillate rapidly between the center and arm cells',
    function testSlosh() {
      var cellCrossResults = fixtures.applyReactions({
        reaction: reactions.airSlosh,
        cellmap: cellCrossMap,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

  test('With a faster-than-default reaction, ' +
    'pressure should oscillate between the center and arm cells',
    function test0_6() {
      var cellCrossResults = fixtures.applyReactions({
        reaction: reactions.air0_6,
        cellmap: cellCrossMap,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

  test('With a slow flow reaction, ' +
    'pressure should eventually reach equalibrium between all cells',
    function testSlowFlow() {
      var cellCrossResults = fixtures.applyReactions({
        reaction: reactions.airSlowFlow,
        cellmap: cellCrossMap,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

});


