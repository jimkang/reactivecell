
function createAutomaton() {
  // TODO: Make this non-air-specific.
  function addToP(sum, cell) {
    return sum + cell.d.p;
  }

  function applyReactionToCells(reaction, cellmap) {
    var applier = _.curry(applyReactionToNeighbors)(reaction, cellmap);
    cellmap.interestingCells().forEach(applier);
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

  function updateCellmap(cellmap) {
    // var resultCells = [];
    // var initialTotalP = cellmap.interestingCells().reduce(addToP, 0);

    var updatePWithCellMap = _.curry(updateP)(cellmap);

    // // for (var i = 0; i < opts.iterations; ++i) {
    //   // var cells = cellmap.interestingCells();
    //   // console.log('Iteration', i, 'cell count:', cells.length);

    //   applyReactionToCells(reaction, cellmap);

      var changedCells = cellmap.filterCells(cellNeedsUpdate);
      changedCells.forEach(updatePWithCellMap);
    // }
    return changedCells;
  }

  return {
    applyReactionToCells: applyReactionToCells,
    updateCellmap: updateCellmap
  };
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = {
    createAutomaton: createAutomaton
  };
}

