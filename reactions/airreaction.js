var _ = require('lodash');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createAirReaction(opts) {
  opts = opts ? opts : {};
  _.defaults(opts, {flowCoeff: 0.5});

  function airReaction(cellData, neighbor, neighborIndex, neighborCount) {
    if (!cellData.inert) {
      var pDiff = cellData.p - neighbor.p;
      var flow = opts.flowCoeff * pDiff;
      flow = clamp(flow, 0, cellData.p/neighborCount);
      cellData.newP -= flow;
      neighbor.newP += flow;
    }
  };

  airReaction.opts = function getOpts() {
    return opts;
  };

  return airReaction;
}

module.exports = createAirReaction;
