var assert = require('assert');
var _ = require('lodash');

var cellmapmaker = require('cellmap');
var createMapParserStream = require('roguemap-parse-stream');
var Writable = require('stream').Writable;
var fs = require('fs');
var cellCrossMap = null;

function addToP(sum, cell) {
  return sum + cell.d.p;
}

function assertTolerance(a, b, tolerance, message) {
  assert.ok(Math.abs(a - b) <= tolerance, message);
}

function applyReactionToCells(reaction, cells, cellmap) {
  cells.forEach(function applyReactionToNeighbors(actingCell) {
    var neighbors = _.filter(cellmap.getNeighbors(actingCell.coords), 
      function isDataNonNull(neighbor) {
        return neighbor.d;
      }
    );
    // console.log('neighbors.length', neighbors.length)
    neighbors.forEach(applyReactionToNeighbor);
    function applyReactionToNeighbor(neighbor, neighborNumber) {
      // Don't try to react to non-existent neighbors.
      if (actingCell.d && neighbor.d) {
        reaction(actingCell.d, neighbor.d, neighborNumber, neighbors.length);
      }
    }
  });
}

function updateP(cell) {
  cell.d.p = cell.d.newP;
}

function roundToPlaces(n, places) {
  var factor = Math.pow(10, places);
  return (~~(n * factor))/factor;
}

function roundCell(cell) {
  cell.d.p = roundToPlaces(cell.d.p, 3);
  cell.d.newP = roundToPlaces(cell.d.newP, 3);
}

function applyReactions(opts) {
  var resultCells = [];
  var initialTotalP = opts.cellmap.interestingCells().reduce(addToP, 0);

  for (var i = 0; i < opts.iterations; ++i) {
    var cells = opts.cellmap.interestingCells();
    applyReactionToCells(opts.reaction, cells, opts.cellmap);
    checkTotalPressureInFormation(cells, i, initialTotalP);
    var comparisonCells = _.cloneDeep(cells);
    resultCells.push(comparisonCells);
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


function loadMap(opts, done) {
  cellCrossMap = cellmapmaker.createMap({size: opts.mapSize});

  var mapStream = Writable({objectMode: true});
  mapStream._write = function addCells(cellTokens, enc, next) {
    var cellPacks = cellTokens.forEach(function cellPackForToken(cellToken) {
      // TODO: Transform stream for to look up keys in legend and return 
      // cell contents?
      var cellData = opts.mapLegend[cellToken.key];
      if (cellData) {
        cellCrossMap.setCell(assembleCell(cellData, cellToken.coords));
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
    done(null, cellCrossMap);
  });
}

function assembleCell(data, coords) {
  return {
    d: _.cloneDeep(data),
    coords: _.cloneDeep(coords)
  };
}

module.exports = {
  applyReactions: applyReactions,
  loadMap: loadMap
};
