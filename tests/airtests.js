require('approvals').mocha(__dirname + '/approvals/airreaction');

var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');
var _ = require('lodash');

// cellCross in a cross formation.
var cellCross = [
  {
    name: 'c_2_2',
    p: 5
  },
  {
    name: 'c_3_2',
    p: 3
  },
  {
    name: 'c_2_1',
    p: 1
  },
  {
    name: 'c_1_2',
    p: 3
  },
  {
    name: 'c_2_3',
    p: 2
  }
];

function initCell(cell) {
  if (!cell.newP) {
    cell.newP = cell.p;
  }
}


var reactions = {};

suite('Cross formation', function cellCrossSuite() {
  before(function initCells() {
    cellCross.forEach(initCell);
  });

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

  function addToP(sum, cell) {
    return sum + cell.p;
  }

  function assertTolerance(a, b, tolerance, message) {
    assert.ok(Math.abs(a - b) <= tolerance, message);
  }

  function applyReactionToCrossCells(reaction, cellCross) {
    var centerCell = cellCross[0];
    var armCells = cellCross.slice(1);
    armCells.forEach(function reactWithArmCell(armCell, i) {
      reaction(centerCell, armCell, i, 4);
    });
    armCells.forEach(function reactWithCenterCell(armCell) {
      reaction(armCell, centerCell, 0, 1);
    });
  }

  function updateP(cell) {
    cell.p = cell.newP;
  }

  function applyReactions(opts) {
    var resultFormations = [];
    var initialTotalP = opts.formation.reduce(addToP, 0);

    for (var i = 0; i < opts.iterations; ++i) {
      opts.applyReactionToFormation(opts.reaction, opts.formation);
      resultFormations.push(_.cloneDeep(opts.formation));
      checkTotalPressureInFormation(opts.formation, i, initialTotalP);

      opts.formation.forEach(updateP);
    }
    return resultFormations;
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
        formation: _.cloneDeep(cellCross),
        reaction: reactions.airDefault,
        applyReactionToFormation: applyReactionToCrossCells,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );


  test('With a slosh reaction, ' +
    'pressure should oscillate rapidly between the center and arm cells',
    function testSlosh() {
      var cellCrossResults = applyReactions({
        formation: _.cloneDeep(cellCross),
        reaction: reactions.airSlosh,
        applyReactionToFormation: applyReactionToCrossCells,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

  test('With a faster-than-default reaction, ' +
    'pressure should oscillate between the center and arm cells',
    function test0_6() {
      var cellCrossResults = applyReactions({
        formation: _.cloneDeep(cellCross),
        reaction: reactions.air0_6,
        applyReactionToFormation: applyReactionToCrossCells,
        iterations: 100
      });

      this.verifyAsJSON(cellCrossResults);
    }
  );

});
