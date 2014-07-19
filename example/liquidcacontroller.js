function createLiquidCAController() {
  var a = createAccessorizer();
  a.createBasicAccessor('id');
  a.cacheAccessor('transform', function getTransform(d) {
    return 'translate(' + d.offset[0] + ',' + d.offset[1] + ')';
  });

  var greatestDepth = 5000;
  var lowestElevation = -30000;

  // var defaultLabColor = d3.lab();
  var interpolator = d3.interpolate(
    d3.lab('hsl(150, 50%, 70%)'), d3.lab('hsl(300, 50%, 70%)')
  );

  // Orange
  var maxDepthColor = {
    l: 70,
    a: 69,
    b: 38
  };
  // Green
  var minDepthColor = {
    l: 70,
    a: -79,
    b: 82
  };

  var interpolator = d3.interpolateLab(
    d3.lab(minDepthColor.l, minDepthColor.a, minDepthColor.b), 
    d3.lab(maxDepthColor.l, maxDepthColor.a, maxDepthColor.b)
  );

  function fillForCell(cell) {
    if (cell.d.inert) {
      return '#fff';
    }
    else {
      // Lightness will come from elevation.
      // a and be will come from liquid depth.
      // Deeper is purpler, shallower is greener.
      var lightness = 70;
      if (depictElevation) {
        lightness = 70 + 30 * cell.d.elevation/(-lowestElevation);
      }
      var colorString = 'hsl(0, 0%, ' + lightness +'%)';
      if (depictDepth) {
        var depthRatio = cell.d.liquid.depth/greatestDepth;
        var color = interpolator(depthRatio);
        color.l = lightness;
        colorString = color.toString();
      }
      
      return colorString;
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

  function toggleAutomaton() {
    var toggleAutomatonButton = d3.select('#toggle-play-button');
    if (advanceKey) {
      pauseAutomaton();
      toggleAutomatonButton.text('Play');
    }
    else {
      resumeAutomaton();
      toggleAutomatonButton.text('Pause');
    }
  }

  function pauseAutomaton() {
    clearInterval(advanceKey);
    advanceKey = null;
  }

  function resumeAutomaton() {
    advanceKey = setInterval(advanceAutomaton, 1000);
  }

  var displayMode = 0;
  var depictElevation = true;
  var depictDepth = true;

  function toggleDisplayMode() {
    displayMode += 1;
    if (displayMode > 2) {
      displayMode = 0;
    }

    var modeTextSpan = d3.select('#display-mode-text');
    var modeButton = d3.select('#toggle-display-mode-button');

    if (displayMode === 0) {
      depictElevation = true;
      depictDepth = true;
      modeTextSpan.text('both liquid depth and elevation');
      modeButton.text('Show elevation only');
    }
    else if (displayMode === 1) {
      depictElevation = true;
      depictDepth = false;
      modeTextSpan.text('elevation only');
      modeButton.text('Show liquid depth only');
    }
    else if (displayMode === 2) {
      depictElevation = false;
      depictDepth = true;
      modeTextSpan.text('liquid depth only');
      modeButton.text('Show both liquid depth and elevation');
    }

    d3.select('#backdroplayer').classed('elevation-only', !depictDepth);
    renderer.renderCells(cellmap.interestingCells());
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
      d.liquid.depth = greatestDepth;
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
      d.elevation = lowestElevation;
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
    d3.select('#toggle-play-button').on('click', toggleAutomaton);
    d3.select('#toggle-display-mode-button').on('click', toggleDisplayMode);

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

  })();

  return {
    cellmap: cellmap,
    renderer: renderer
  };
}

var liquidCAController = createLiquidCAController();

