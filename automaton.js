
function createAutomaton(opts) {
  function applyReactionToCells(reaction) {
    var applier = _.curry(applyReactionToNeighbors)(reaction);
    opts.cellmap.interestingCells().forEach(applier);
  }

  function cellNeedsUpdate(cell) {
    return cell.needsUpdate;
  }

  function applyReactionToNeighbors(reaction, actingCell) {
    var neighbors = opts.cellmap.getNeighbors(actingCell.coords);
    reaction(actingCell, neighbors);

    // The problem here is that setCell will count cells with d.p === 0 as default 
    // cells, even if nextD.p is not 0.  
    _.compact(neighbors).forEach(opts.cellmap.setCell);
    opts.cellmap.setCell(actingCell);
  }

  function updateCell(cell) {
    if (cell.needsUpdate) {
      opts.updateCell(cell);
      cell.needsUpdate = false;
      opts.cellmap.setCell(cell);    
    }
  }

  function updateCellmap() {
    var changedCells = opts.cellmap.filterCells(cellNeedsUpdate);
    changedCells.forEach(updateCell);

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
