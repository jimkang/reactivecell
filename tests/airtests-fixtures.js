var assert = require('assert');
var _ = require('lodash');

var cellmapmaker = require('../node_modules/cellmap/hashcellmapmaker');
// var cellmapmaker = require('cellmap');
var createMapParserStream = require('roguemap-parse-stream');
var Writable = require('stream').Writable;
var fs = require('fs');
var cellMap = null;

function addToP(sum, cell) {
  return sum + cell.d.p;
}

function assertTolerance(a, b, tolerance, message) {
  assert.ok(Math.abs(a - b) <= tolerance, message);
}

function applyReactionToCells(reaction, cells, cellmap) {
  var applier = _.curry(applyReactionToNeighbors)(reaction, cellmap);
  cells.forEach(applier);
}

function cellNeedsUpdate(cell) {
  return cell.needsUpdate;
}

function newPIsNonZero(cell) {
  return cell.nextD.p !== 0;
}

function addToNewP(sum, cell) {
  return sum + cell.nextD.p;
}

function applyReactionToNeighbors(reaction, cellmap, actingCell) {
  var neighbors = cellmap.getNeighbors(actingCell.coords);
  reaction(actingCell, neighbors);

  // The problem here is that setCell will count cells with d.p === 0 as default 
  // cells, even if nextD.p is not 0.  
  _.compact(neighbors).forEach(cellmap.setCell);
  cellmap.setCell(actingCell);

  /*
  // This is just here for debugging. Watch out, it brings things to a crawl.
  var totalNewP = cellmap.filterCells(newPIsNonZero).reduce(addToNewP, 0);

  // assertTolerance(totalNewP, 36, 0.01, 'Pressure leaked!');
  if (Math.abs(36 - totalNewP) > 0.01) {
    console.log('Pressure leaked!');
  }
  */


  // // console.log('neighbors.length', neighbors.length)
  // neighbors.forEach(applyReactionToNeighbor);
  // function applyReactionToNeighbor(neighbor, neighborNumber) {
  //   // Don't try to react to non-existent neighbors.
  //   if (actingCell.d && neighbor.d) {
  //     // console.log('total p before:', cells.reduce(addToP, 0));
  //     reaction(actingCell.d, neighbor.d, neighborNumber, neighbors.length);
  //     var totalNewP = cells.reduce(function addToP(sum, cell) {
  //       return sum + cell.nextD.p;
  //     }, 0);

  //     if (totalNewP !== 36) {
  //       debugger;
  //     }
  //     console.log('total p after:', totalNewP);
  //   }
  // }
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
  var resultCells = [];
  var initialTotalP = opts.cellmap.interestingCells().reduce(addToP, 0);

  var updatePWithCellMap = _.curry(updateP)(opts.cellmap);

  for (var i = 0; i < opts.iterations; ++i) {
    var cells = opts.cellmap.interestingCells();
    console.log('Iteration', i, 'cell count:', cells.length);
    // console.log('total p before:', cells.reduce(addToP, 0));
    opts.cellmap.filterCells(function sure() { return true; })
      .forEach(function checkNextD(cell, i) {
        if (!cell.nextD) {
          debugger;
        }
      });

    applyReactionToCells(opts.reaction, cells, opts.cellmap);
    if (!opts.skipComparison) {
      var comparisonCells = _.cloneDeep(opts.cellmap.interestingCells());
      if (!opts.skipSortingResults) {
        comparisonCells = _.sortBy(comparisonCells, function compareCoords(cell) {
          return cell.coords[0] * 1000 + cell.coords[1];
        });
      }
      resultCells.push(comparisonCells);
    }

    var changedCells = opts.cellmap.filterCells(cellNeedsUpdate);
    changedCells.forEach(updatePWithCellMap);

    var totalNewP = opts.cellmap.interestingCells().reduce(addToNewP, 0);
    // debugger;
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
  // debugger;
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
