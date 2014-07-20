if (typeof module === 'object' && typeof module.exports === 'object') {
  _ = require('lodash');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Relevant cell properties:
// liquid.depth - liquid depth. Vertical space taken up by the liquid.
// elevation - elevation of the surface of the cell. Can be negative.
// liquid level = elevation + sum(all liquid.depth)

// TODO: How should we deal with multiple liquids with varying flowCoeffs 
// (viscosities)? Do they stack or do they blend?

// Should cell data use namespaces?

function createLiquidReaction(opts) {
  opts = opts ? opts : {};
  _.defaults(opts, {
    flowCoeff: 0.251
  });

  function flowOutToCell(src, level, numberOfDestCells, dest) {
    var nLevel = getLevel(dest);
    var lDiff = level - nLevel;
    var flow = ~~(opts.flowCoeff * lDiff);
    flow = clamp(flow, 0, ~~(src.d.liquid.depth/numberOfDestCells));
    if (flow !== 0) {
      src.nextD.liquid.depth -= flow;
      dest.nextD.liquid.depth += flow;
      src.needsUpdate = true;
      dest.needsUpdate = true;
    }
  }

  function liquidReaction(cell, neighbors) {
    if (!cell.d.inert) {
      // var neighborData = _.pluck(nonNullNeigbhors, 'd');
      var level = getLevel(cell);
      var outflowCells = neighbors.filter(_.curry(isOutflowCell)(level));
      var react = _.curry(flowOutToCell)(cell, level, outflowCells.length);
      outflowCells.forEach(react);
    }
  }

  function isOutflowCell(level, cell) {
    return (cell && isReactive(cell) && getLevel(cell) < level);
  }

  function getLevel(cell) {
    return cell.d.elevation + cell.d.liquid.depth;    
  }

  function isReactive(cell) {
    return cell && cell.d && !cell.d.inert;
  }

  liquidReaction.opts = function getOpts() {
    return opts;
  };

  return liquidReaction;
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = createLiquidReaction;
}

