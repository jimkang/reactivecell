var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');

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
    function testCreateEqualibriumReaction() {
      reactions.airEquilibrium = airReactionFactory();
      assert.equal(typeof reactions.airEquilibrium, 'function');
      assert.equal(reactions.airEquilibrium.opts().flowCoeff, 0.5);
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

  test('With an equilibrium reaction, ' +
    'pressure should oscillate between the center and arm cells',
    function testEquilibrium() {      
      for (var i = 0; i < 100; ++i) {
        console.log('Iteration ' + i);

        cellCross.forEach(function updateP(cell) {
          cell.p = cell.newP;
        });

        reactions.airEquilibrium(cellCross[0], cellCross[1], 0, 4);
        reactions.airEquilibrium(cellCross[0], cellCross[2], 1, 4);
        reactions.airEquilibrium(cellCross[0], cellCross[3], 2, 4);
        reactions.airEquilibrium(cellCross[0], cellCross[4], 3, 4);

        reactions.airEquilibrium(cellCross[1], cellCross[0], 0, 1);
        reactions.airEquilibrium(cellCross[2], cellCross[0], 0, 1);
        reactions.airEquilibrium(cellCross[3], cellCross[0], 0, 1);
        reactions.airEquilibrium(cellCross[4], cellCross[0], 0, 1);

        var totalP = cellCross.reduce(addToP, 0);
        assertTolerance(totalP, 14, 0.00001,
          'The total p of the cells changed in iteration ' + i + '. ' + 
          'It is now ' + totalP + '.');

        cellCross.forEach(function printNewP(cell) {
          console.log(cell.newP);
        });
      }
    }
  );

});


