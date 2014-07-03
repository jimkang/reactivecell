if (typeof module === 'object' && typeof module.exports === 'object') {
  _ = require('lodash');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createAirReaction(opts) {
  opts = opts ? opts : {};
  _.defaults(opts, {
    flowCoeff: 0.5
  });

  function reactToNeighbor(cell, neighborCount, neighbor) {
    var pDiff = cell.d.p - neighbor.d.p;
    var flow = ~~(opts.flowCoeff * pDiff);
    flow = clamp(flow, 0, ~~(cell.d.p/neighborCount));
    if (flow !== 0) {
      cell.nextD.p -= flow;
      if (!neighbor.nextD) {
        debugger;
      }
      neighbor.nextD.p += flow;
      cell.needsUpdate = true;
      neighbor.needsUpdate = true;
    }
  };

  function airReaction(cell, neighbors) {
    if (!cell.d.inert) {
      // var neighborData = _.pluck(nonNullNeigbhors, 'd');
      var reactiveNeighbors = _.compact(neighbors).filter(isReactive);
      // debugger;
      var react = _.curry(reactToNeighbor)(cell, reactiveNeighbors.length);
      reactiveNeighbors.forEach(react);
    }
  }

  function isReactive(cell) {
    return cell && cell.d && !cell.d.inert;
  }

  airReaction.opts = function getOpts() {
    return opts;
  };

  return airReaction;
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = createAirReaction;
}

