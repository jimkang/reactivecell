require('approvals').mocha(__dirname + '/approvals/airreaction');

var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');
var _ = require('lodash');

// cellCross in a cross formation.
var cellCross = [
  {
    name: 'c_2_2',
    newP: 5
  },
  {
    name: 'c_3_2',
    newP: 3
  },
  {
    name: 'c_2_1',
    newP: 1
  },
  {
    name: 'c_1_2',
    newP: 3
  },
  {
    name: 'c_2_3',
    newP: 2
  }
];

var reactions = {};

suite('Cross formation', function cellCrossSuite() {
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

  test('With an Default reaction, ' +
    'pressure should oscillate between the center and arm cells',
    function testDefault() {
      var cellCrossResults = [];

      for (var i = 0; i < 100; ++i) {
        cellCross.forEach(function updateP(cell) {
          cell.p = cell.newP;
        });

        applyReactionToCrossCells(reactions.airDefault, cellCross);

        var totalP = cellCross.reduce(addToP, 0);
        assertTolerance(totalP, 14, 0.00001,
          'The total p of the cells changed in iteration ' + i + '. ' + 
          'It is now ' + totalP + '.');

        cellCrossResults.push(_.cloneDeep(cellCross));
      }

      this.verify(JSON.stringify(cellCrossResults, null, '  '));
    }
  );

});
