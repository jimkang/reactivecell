var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');
var fixtures = require('./airtests-fixtures');

var reactions = {};

reactions.airDefault = airReactionFactory();

function bigTunnelSuite() {
  var bigTunnelMap = null;

  var defaultCellData = {
    name: 'still',
    p: 0,
  }

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
      testDefault();
    }
  );

  function testDefault() {
    fixtures.applyReactions({
      reaction: reactions.airDefault,
      cellmap: bigTunnelMap,
      iterations: 100,
      skipComparison: true
    });
  }
}

bigTunnelSuite();

