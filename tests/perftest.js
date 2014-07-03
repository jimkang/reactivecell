var airReactionFactory = require('../reactions/airreaction');
var assert = require('assert');
var fixtures = require('./airtests-fixtures');

var reactions = {};

reactions.airDefault = airReactionFactory();

function windTunnelSuite() {
  var windTunnelMap = null;

  var defaultCellData = {
    name: 'still',
    p: 0,
  }

  fixtures.loadMap(
    {
      mapSize: [32, 6],
      mapFilename: 'airtests-wind-tunnel-map.txt',
      mapLegend: {
        l: {
          name: 'low',
          p: 1000
        },
        m: {
          name: 'medium',
          p: 3000
        },
        h: {
          name: 'high',
          p: 5000
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
      windTunnelMap = map;
      testDefault();
    }
  );

  function testDefault() {
    fixtures.applyReactions({
      reaction: reactions.airDefault,
      cellmap: windTunnelMap,
      iterations: 100,
      skipComparison: true
    });
  }
}

windTunnelSuite();
