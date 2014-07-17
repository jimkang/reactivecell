function createLiquidCAController() {
  var a = createAccessorizer();
  a.createBasicAccessor('id');
  a.cacheAccessor('transform', function getTransform(d) {
    return 'translate(' + d.offset[0] + ',' + d.offset[1] + ')';
  });

  function fillForCell(cell) {
    if (cell.d.inert) {
      return '#555';
    }
    else {
      // Saturation will be determined by liquid depth.
      // Lightness will come from elevation.
      var saturation = 100 * cell.d.liquid.depth/5000;
      var lightness = 70 + 30 * cell.d.elevation/30000;
      return 'hsl(200, ' +  saturation + '%, ' + lightness + '%)';
    }
  }

  var liquidLayer = d3.select('#liquid-layer');

  var renderer = createFixedCellGridRenderer({
    cellWidth: 8,
    cellHeight: 8,
    cellClass: 'cell',
    customUpdate: function renderCellFills(cells) {
      // Setting the fill for this <g> means <rect>s within it will use that 
      // fill, too.
      cells.attr('fill', fillForCell);
    },
    selectors: {
      root: '#liquid-layer' 
    },
    idFunction: a.id
  });

  var cellmap = createCellMapmaker().createMap({
    size: [1000, 1000],
    createDefaultCell: function createZeroCell(coords) {
      return {
        d: {
          elevation: 0,
          liquid: {
            depth: 0
          }
        },
        nextD: {
          elevation: 0,
          liquid: {
            depth: 0
          }
        },
        id: coords[0] + '_' + coords[1],
        coords: _.cloneDeep(coords)
      };
    },
    isDefault: function cellIsDefault(cell) {
      var isDef = true;
      if (cell.d.inert) {
        isDef = false;
      }
      else if (cell.d.liquid.depth !== 0 || cell.d.elevation !== 0) {
        isDef = false;
      }
      else if (cell.nextD && 
        (cell.nextD.liquid.depth !== 0 || cell.nextD.elevation !== 0)) {
        isDef = false;
      }

      return isDef;
    }
  });

  var automaton = createAutomaton({
    cellmap: cellmap,
    updateCell: function updateLiquidCell(cell) {
      cell.d.liquid.depth = cell.nextD.liquid.depth;
    }
  });
  var liquidReaction = createLiquidReaction();


  var advancing = false;
  var iteration = 0;
  var advanceKey = null;

  function advanceAutomaton() {
    if (advancing) {
      console.log('Already advancing!');
    }
    else {
      automaton.applyReactionToCells(liquidReaction);
      automaton.updateCellmap();
      iteration += 1;

      var cellsToRender = cellmap.interestingCells()
        .filter(cellShouldBeReRendered);
      renderer.renderCells(cellsToRender);
    }
  }

  function pauseAutomaton() {
    clearInterval(advanceKey);
    advanceKey = null;
  }

  function resumeAutomaton() {
    advanceKey = setInterval(advanceAutomaton, 400);
  }

  function createCellDataForKey(key) {
    // '.' key corresponds to this fallthrough case.
    var d = {
      elevation: 0,
      liquid: {
        depth: 0
      }
    };

    if (key === 'x') {
      d.inert = true;
    }
    else if (key === 'l') {
      d.liquid.depth = 1000;
    }
    else if (key === 'm') {
      d.liquid.depth = 2000;
    }
    else if (key === 'h') {
      d.liquid.depth = 5000;
    }
    return d;
  }  

  function addElevationDataForKey(key, d) {
    // '.' key corresponds to this fallthrough case.
    d.elevation = 0;

    if (key === 'x') {
      d.inert = true;
    }
    else if (key === 's') {
      d.elevation = -5000;
    }
    else if (key === 'm') {
      d.elevation = -15000;
    }
    else if (key === 'd') {
      d.elevation = -30000;
    }
    return d;
  }  

  function cellShouldBeReRendered(cell) {
    return true;
    return (cell.coords[0] <= 78/2 && cell.coords[1] < 82/2);
  }

  function setUpKeyCommands() {
    var strokerouter = createStrokeRouter(d3.select(document));

    function routeToNext(key) {
      strokerouter.routeKeyUp(key, null, advanceAutomaton);
    }
    ['rightArrow', 'downArrow', 'space', 'enter', 'n'].forEach(routeToNext);
  }

  (function init() {
    setUpKeyCommands();
    d3.select('#next-button').on('click', advanceAutomaton);
    d3.select('#pause-button').on('click', pauseAutomaton);
    d3.select('#resume-button').on('click', resumeAutomaton);

    var q = queue(1);
    q.defer(loadMapFromURL, {
      url: '../tests/data/liquidtests-big-tunnel-map.txt',
      cellmap: cellmap,
      createCellDataForKey: createCellDataForKey,
    });

    q.defer(loadMapFromURL, {
      url: '../tests/data/liquidtests-big-tunnel-elevation-map.txt',
      cellmap: cellmap,
      updateCellDataForKey: addElevationDataForKey
    });

    q.await(function useMaps(error) {
      if (error) {
        console.log(error);
      }
      else {
        // HACK. Once roguemap-parse-stream and cellmapWriteStream emit 
        // 'end' events, remove this setTimeout.
        setTimeout(function initialRender() {
          // TODO: Load elevation map. Try out nlz.io.
          renderer.renderCells(cellmap.interestingCells());
        },
        500);
      }
    });

    resumeAutomaton();
  })();

  return {
    cellmap: cellmap,
    renderer: renderer
  };
}

var liquidCAController = createLiquidCAController();

