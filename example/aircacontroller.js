function createAirCAController() {
  var a = createAccessorizer();
  a.createBasicAccessor('id');
  a.cacheAccessor('transform', function getTransform(d) {
    return 'translate(' + d.offset[0] + ',' + d.offset[1] + ')';
  });

  function fillForPressure(cell) {
    if (cell.d.inert) {
      return '#bbb';
    }
    else {
      return 'hsla(200, 100%, 80%, ' + (0.25 + 0.75 * cell.d.p/20.0) + ')';
    }
  }

  var airLayer = d3.select('#air-layer');

  var renderer = createCellGridRenderer({
    cellWidth: 8,
    cellHeight: 8,
    cellClass: 'cell',
    customizeCellRendition: function customize(cell) {
      // Setting the fill for this <g> means <rect>s within it will use that 
      // fill, too.
      d3.select(this).attr('fill', fillForPressure);
    },
    selectors: {
      root: '#air-layer' 
    }
  });

  var cellmap = createCellMapmaker().createMap({
    size: [1000, 1000],
    createDefaultCell: function createZeroCell(coords) {
      return {
        d: {
          p: 0
        },
        nextD: {
          p: 0
        },
        coords: _.cloneDeep(coords)
      };
    },
    isDefault: function cellIsAtZeroPressure(cell) {
      return !cell.d.inert && 
        cell.d.p === 0 && (!cell.nextD || cell.nextD.p === 0);
    }
  });

  var automaton = createAutomaton();
  var airReaction = createAirReaction();

  function loadMap(maptext, done) {
    var parserStream = streampack.createMapParserStream({
      batchSize: 100
    });

    var cellmapWriteStream = createCellmapWriteStream();
    var textReadStream = createTextReadStream(maptext);
    textReadStream.on('end', done);
    // TODO: Make sure cellmapWriteStream and parserStream also emit end events.

    textReadStream.pipe(parserStream);
    parserStream.pipe(cellmapWriteStream);
    // parserStream.write(maptext);
    // parserStream.end();
  }

  function createCellmapWriteStream() {
    var Writable = streampack.stream.Writable;
    var cellmapWriteStream = Writable({objectMode: true});
    cellmapWriteStream._write = addCellsToMap;
    return cellmapWriteStream;
  }

  var lastCellCoordsAdded = [];

  function addCellsToMap(cellPacks, enc, next) {
    cellPacks.forEach(addCellToMap);
    lastCellCoordsAdded = _.pluck(cellPacks, 'coords').map(function str(coords) {
      return coords[0] + ', ' + coords[1];
    });
    next();
  }

  function addCellToMap(cellPack) {
    cellmap.setCell({
      id: cellPack.coords[0] + '_' + cellPack.coords[1],
      d: createCellDataForKey(cellPack.key),
      nextD: createCellDataForKey(cellPack.key),
      coords: cellPack.coords.slice()
    });
  }

  function createCellDataForKey(key) {
    var d = {p: 0};
    if (key === 'x') {
      d.inert = true;
    }
    else if (key === 'l') {
      d.p = 1;
    }
    else if (key === 'm') {
      d.p = 8;
    }
    else if (key === 'h') {
      d.p = 20;
    }
    return d;
  }

  function createTextReadStream(text) {
    var Readable = streampack.stream.Readable;
    var textReadStream = Readable({
      objectMode: true,
      encoding: 'utf8'
    });
    var index = 0;
    textReadStream._read = function readTextChunk(size) {
      if (index >= text.length) {
        this.push(null);
      }
      else {
        this.push(text.substr(index, size));
        index += size;
      }
    };
    return textReadStream;
  }

  function advanceAutomaton() {
    automaton.applyReactionToCells(airReaction, cellmap);
    automaton.updateCellmap(cellmap);
    renderer.renderCells(cellmap.interestingCells());
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

    var req = createRequestMaker().makeRequest({
      method: 'GET',
      url: '../tests/data/airtests-big-tunnel-map.txt',
      mimeType: 'text/plain',
      done: function done(error, maptext) {
        if (error) {
          console.log(error);
        }
        else {
          loadMap(maptext, function initialRenderAfteDelay() {
            // HACK. Once roguemap-parse-stream and cellmapWriteStream emit 
            // 'end' events, remove this setTimeout.
            setTimeout(function initialRender() {
              renderer.renderCells(cellmap.interestingCells());
            },
            500);
          });
        }
      }
    });    
  })();

  return {
    cellmap: cellmap,
    renderer: renderer
  };
};

var airCAController = createAirCAController();

