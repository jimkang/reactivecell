require('approvals').mocha(__dirname + '/approvals/airreaction');

var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');
var _ = require('lodash');
var cellmapmaker = require('cellmap');
var createMapParserStream = require('roguemap-parse-stream');
var Writable = require('stream').Writable;
var fs = require('fs');

var cellCrossMap = null;

// The cells are arranged in a cross formation.
var cellCoords = [
  [2, 2],
  [3, 2],
  [2, 1],
  [1, 2],
  [2, 3]
];

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
  beforeEach(function setUpCrossMap() {
    cellCrossMap = cellmapmaker.createMap({size: [4, 4]});
    cellCrossMap.addCells([
      [
        {
          name: 'c_2_2',
          p: 5,
          newP: 5
        },
        [2, 2]
      ],
      [
        {
          name: 'c_3_2',
          p: 3,
          newP: 3
        },
        [3, 2]
      ],
      [
        {
          name: 'c_2_1',
          p: 1,
          newP: 1
        },
        [2, 1]
      ],
      [
        {
          name: 'c_1_2',
          p: 3,
          newP: 3
        },
        [1, 2]
      ],
      [
        {
          name: 'c_2_3',
          p: 2,
          newP: 2
        },
        [2, 3]
      ]
    ]);
  });

  function addToP(sum, cell) {
    return sum + cell.p;
  }

  function assertTolerance(a, b, tolerance, message) {
    assert.ok(Math.abs(a - b) <= tolerance, message);
  }

  function applyReactionToCoords(reaction, cellCoords) {
    cellCoords.forEach(function applyReactionToNeighbors(coord) {
      var actingCell = cellCrossMap.getCell(coord);
      var neighbors = _.compact(cellCrossMap.getNeighbors(coord));
      // console.log('neighbors.length', neighbors.length)
      neighbors.forEach(applyReactionToNeighbor);
      function applyReactionToNeighbor(neighbor, neighborNumber) {
        reaction(actingCell, neighbor, neighborNumber, neighbors.length);
      }
    });
  }

  function updateP(cell) {
    cell.p = cell.newP;
  }

  function roundToPlaces(n, places) {
    var factor = Math.pow(10, places);
    return (~~(n * factor))/factor;
  }

  function roundCell(cell) {
    cell.p = roundToPlaces(cell.p, 3);
    cell.newP = roundToPlaces(cell.newP, 3);
  }

  function applyReactions(opts) {
    var resultCells = [];
    var initialTotalP = opts.coords.map(opts.cellmap.getCell).reduce(addToP, 0);

    for (var i = 0; i < opts.iterations; ++i) {
      applyReactionToCoords(opts.reaction, opts.coords);
      var cells = opts.coords.map(opts.cellmap.getCell);
      checkTotalPressureInFormation(cells, i, initialTotalP);
      resultCells.push(_.cloneDeep(cells));      
      cells.forEach(updateP);
    }
    
    // Round cell values for the purpose of reporting in approvals so that 
    // rounding diffs don't trigger a test failure.    
    resultCells.forEach(function roundCellGroup(cellGroup) {
      cellGroup.forEach(roundCell);
    });

    return resultCells;
  }

  function checkTotalPressureInFormation(formation, iteration, expectedTotal) {
    var totalP = formation.reduce(addToP, 0);
    assertTolerance(totalP, expectedTotal, 0.00001,
      'The total p of the cells changed in iteration ' + iteration + '. ' + 
      'It is now ' + totalP + '.');
  }

  test('With a default reaction, ' +
    'pressure should oscillate between the center and arm cells',
    function testDefault() {
      var cellCrossResults = applyReactions({
        reaction: reactions.airDefault,
        cellmap: cellCrossMap,
        coords: cellCoords,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );


  test('With a slosh reaction, ' +
    'pressure should oscillate rapidly between the center and arm cells',
    function testSlosh() {
      var cellCrossResults = applyReactions({
        reaction: reactions.airSlosh,
        cellmap: cellCrossMap,
        coords: cellCoords,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

  test('With a faster-than-default reaction, ' +
    'pressure should oscillate between the center and arm cells',
    function test0_6() {
      var cellCrossResults = applyReactions({
        reaction: reactions.air0_6,
        cellmap: cellCrossMap,
        coords: cellCoords,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

  test('With a slow flow reaction, ' +
    'pressure should eventually reach equalibrium between all cells',
    function testSlowFlow() {
      var cellCrossResults = applyReactions({
        reaction: reactions.airSlowFlow,
        cellmap: cellCrossMap,
        coords: cellCoords,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

});
