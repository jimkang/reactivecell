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
          p: 1
        },
        m: {
          name: 'medium',
          p: 3
        },
        h: {
          name: 'high',
          p: 5
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
    var windTunnelResults = fixtures.applyReactions({
      reaction: reactions.airDefault,
      cellmap: windTunnelMap,
      iterations: 100
    });

    // this.verifyAsJSON(windTunnelResults);
  }
}

windTunnelSuite();

