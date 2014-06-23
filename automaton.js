
function createAutomaton(opts) {
  // TODO: Make this non-air-specific.

  function applyReactionToCells(reaction, cellmap) {
    var applier = _.curry(applyReactionToNeighbors)(reaction, cellmap);
    cellmap.interestingCells().forEach(applier);
  }

  function cellNeedsUpdate(cell) {
    return cell.needsUpdate;
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
  
  function updateCellmap(cellmap) {
    var changedCells = cellmap.filterCells(cellNeedsUpdate);
    var updatePWithCellMap = _.curry(updateP)(cellmap);
    changedCells.forEach(updatePWithCellMap);

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
