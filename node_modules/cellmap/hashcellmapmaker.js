function createCellMapmaker() {
  if (typeof require === 'function') {
    _ = require('lodash');
  }

  function createMap(opts) {
    var map = {};

    if (!opts.createDefaultCell) {
      opts.createDefaultCell = function createNullDataCell(theCoords) {
        return {
          d: null,
          coords: [theCoords[0], theCoords[1]]
        };
      };
    }    

    function getCell(coords) {
      var cell = null;
      if (coordsAreWithinBounds(coords)) {
        cell = map[coords.toString()];
      
        if (!cell && opts.createDefaultCell) {
          cell = opts.createDefaultCell(coords);
        }
      }
      return cell;
    }

    function setCell(cell) {
      var key = cell.coords.toString();
      if (opts.isDefault && opts.isDefault(cell)) {
        // If it's a default cell, it doesn't need to be stored in the map.
        if (key in map) {
          delete map[key];
        }
      }
      else {
        map[key] = cell;
      }
    }

    function setCells(cells) {
      cells.forEach(setCell);
    }

    function getNeighbors(coords) {
      var neighborCoords = [
        [coords[0] + 1, coords[1]],
        [coords[0], coords[1] + 1],
        [coords[0] - 1, coords[1]],
        [coords[0], coords[1] - 1]
      ];
      return neighborCoords.map(getCell);
    }

    function removeCell(coords) {
      delete map[coords.toString()];
      // if (coordsAreWithinBounds(coords)) {
        // quadtree.remove(coords);
      // }
    }

    function coordsAreWithinBounds(coords) {
      return (coords[0] > -1 && coords[0] <= opts.size[0] &&
        coords[1] > -1 && coords[1] <= opts.size[1]
      );
    }

    function interestingCells() {
      return _.values(map);
    }

    function filterCells(filterFn) {
      return _.filter(map, filterFn);
    }

    function plusX(coords) {
      return [coords[0] + 1, coords[1]];
    }

    function plusY(coords) {
      return [coords[0], coords[1] + 1];
    }

    function minusX(coords) {
      return [coords[0] - 1, coords[1]];
    }

    function minusY(coords) {
      return [coords[0], coords[1] - 1];
    }

    function pointsUsedForStorage() {      
      return _.size(map);
    }

    return {
      // defaultCell: opts.defaultCell ? opts.defaultCell : null,
      createDefaultCell: opts.createDefaultCell,
      isDefault: opts.isDefault,
      getCell: getCell,
      setCell: setCell,
      setCells: setCells,
      getNeighbors: getNeighbors,
      interestingCells: interestingCells,
      filterCells: filterCells,
      removeCell: removeCell,
      plusX: plusX,
      plusY: plusY,
      minusX: minusX,
      minusY: minusY,
      pointsUsedForStorage: pointsUsedForStorage
    };
  }

  return {
    createMap: createMap
  };
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = createCellMapmaker();
}

