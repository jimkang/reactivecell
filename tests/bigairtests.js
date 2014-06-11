require('approvals').mocha(__dirname + '/approvals/airreaction');

var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');
var fixtures = require('./airtests-fixtures');

var reactions = {};

suite('Big tunnel formation', function bigTunnelSuite() {
  var bigTunnelMap = null;

  before(function setUpReactions() {
      reactions.airDefault = airReactionFactory();
      reactions.air0_6 = airReactionFactory({flowCoeff: 0.6});
      reactions.airSlowFlow = airReactionFactory({flowCoeff: 0.1});
      reactions.airSlosh = airReactionFactory({flowCoeff: 1.0});
  });

  beforeEach(function setUpBigTunnelMap(setupDone) {
    var defaultCellData = {
      name: 'still',
      p: 0,
    };

    fixtures.loadMap(
      {
        mapSize: [78, 82],
        mapFilename: 'airtests-big-tunnel-map.txt',
        mapLegend: {
          l: {
            name: 'low',
            p: 1
          },
          m: {
            name: 'medium',
            p: 8
          },
          h: {
            name: 'high',
            p: 20
          },
          x: {
            name: 'block',
            inert: true,
            p: 0
          },
          '.': defaultCellData
        },
        defaultCellData: defaultCellData
      },
      function done(error, map) {
        bigTunnelMap = map;
        setupDone();
      }
    );
  });

  test('With a default reaction, ' +
    'pressure should do something',
    function testDefault() {
      var bigTunnelResults = fixtures.applyReactions({
        reaction: reactions.airDefault,
        cellmap: bigTunnelMap,
        iterations: 80
      });

      this.verifyAsJSON(bigTunnelResults);
    }
  );
});
