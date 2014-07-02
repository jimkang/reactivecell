var assert = require('assert');
var _ = require('lodash');
var cellmapmaker = require('../node_modules/cellmap/hashcellmapmaker');
// var cellmapmaker = require('cellmap');
var createMapParserStream = require('roguemap-parse-stream');
var Writable = require('stream').Writable;
var fs = require('fs');
var automatonFactory = require('../automaton');

var cellMap = null;

function addToP(sum, cell) {
  return sum + cell.d.p;
}

function assertTolerance(a, b, tolerance, message) {
  assert.ok(Math.abs(a - b) <= tolerance, message);
}

function addToNewP(sum, cell) {
  return sum + cell.nextD.p;
}

function updateP(cellmap, cell) {
  if (cell.needsUpdate) {
    cell.d.p = cell.nextD.p;
    cell.needsUpdate = false;
    cellmap.setCell(cell);    
  }
}

function roundToPlaces(n, places) {
  var factor = Math.pow(10, places);
  return (~~(n * factor))/factor;
}

function roundCell(cell) {
  cell.d.p = roundToPlaces(cell.d.p, 3);
  cell.nextD.p = roundToPlaces(cell.nextD.p, 3);
}

function applyReactions(opts) {
  var automaton = automatonFactory.createAutomaton({
    cellmap: opts.cellmap,
    updateCell: function updateAirCell(cell) {
      cell.d.p = cell.nextD.p;
    }
  });
  var resultCells = [];
  var initialTotalP = opts.cellmap.interestingCells().reduce(addToP, 0);

  var updatePWithCellMap = _.curry(updateP)(opts.cellmap);

  for (var i = 0; i < opts.iterations; ++i) {
    console.log('Iteration', i);

    automaton.applyReactionToCells(opts.reaction);

    if (!opts.skipComparison) {
      var comparisonCells = _.cloneDeep(opts.cellmap.interestingCells());
      if (!opts.skipSortingResults) {
        comparisonCells = _.sortBy(comparisonCells, function compareCoords(cell) {
          return cell.coords[0] * 1000 + cell.coords[1];
        });
      }
      resultCells.push(comparisonCells);
    }

    automaton.updateCellmap();

    var totalNewP = opts.cellmap.interestingCells().reduce(addToNewP, 0);
    checkTotalPressureInFormation(opts.cellmap.interestingCells(), i, 
      initialTotalP);
    // console.log('total p after:', cells.reduce(addToP, 0));
  }
  
  if (!opts.skipComparison) {
    // Round cell values for the purpose of reporting in approvals so that 
    // rounding diffs don't trigger a test failure.    
    resultCells.forEach(function roundCellGroup(cellGroup) {
      cellGroup.forEach(roundCell);
    });
  }
  
  return resultCells;
}

function checkTotalPressureInFormation(formation, iteration, expectedTotal) {
  var totalP = formation.reduce(addToP, 0);
  assertTolerance(totalP, expectedTotal, 0.00001,
    'The total p of the cells changed in iteration ' + iteration + '. ' + 
    'It is now ' + totalP + ' instead of ' + expectedTotal);
}


function loadMap(opts, done) {
  var mapOpts = {
    size: opts.mapSize,
  };

  if (opts.defaultCellData) {
    if (opts.isDefault) {
      mapOpts.isDefault = opts.isDefault
    }
    else {
      mapOpts.isDefault = function isDefault(cell) {
        return !cell.d.inert && 
          (cell.d.p === opts.defaultCellData.p && 
            cell.nextD.p === opts.defaultCellData.p);
      };
    }
    mapOpts.createDefaultCell = function createDefaultCell(coords) {
      return {
        d: _.cloneDeep(opts.defaultCellData),
        nextD: _.cloneDeep(opts.defaultCellData),
        coords: coords
      };
    };
  }

  var cellMap = cellmapmaker.createMap(mapOpts);

  var mapStream = Writable({objectMode: true});
  mapStream._write = function addCells(cellTokens, enc, next) {
    var cellPacks = cellTokens.forEach(function cellPackForToken(cellToken) {
      // TODO: Transform stream for to look up keys in legend and return 
      // cell contents?
      var cellData = opts.mapLegend[cellToken.key];
      if (cellData) {
        cellMap.setCell(assembleCell(cellData, cellToken.coords));
      }
    });
    next();
  };

  var fileStream = fs.createReadStream(
    __dirname + '/data/' + opts.mapFilename, {encoding: 'utf8'}
  );
  var parserStream = createMapParserStream({
    batchSize: 1
  });

  fileStream.pipe(parserStream);
  parserStream.pipe(mapStream);
  
  parserStream.on('end', function onParseEnd() {
    done(null, cellMap);
  });
}

function assembleCell(data, coords) {
  return {
    d: _.cloneDeep(data),
    nextD: _.cloneDeep(data),
    coords: _.cloneDeep(coords)
  };
}

module.exports = {
  applyReactions: applyReactions,
  loadMap: loadMap
};
