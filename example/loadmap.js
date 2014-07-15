function loadMap(opts, done) {
  // opts:
  // maptext: text of the map to be loaded
  // cellmap: cellmap to load cells into
  // createCellDataForKey: callback that creates cell data objects for a given 
  // key from the map
  var parserStream = streampack.createMapParserStream({
    batchSize: 100
  });

  var cellmapWriteStream = createCellmapWriteStream();
  var textReadStream = createTextReadStream(opts.maptext);
  textReadStream.on('end', done);
  // TODO: Make sure cellmapWriteStream and parserStream also emit end events.

  textReadStream.pipe(parserStream);
  parserStream.pipe(cellmapWriteStream);
  // parserStream.write(maptext);
  // parserStream.end();

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
    var cell;
    if (opts.createCellDataForKey) {
      cell = {
        id: cellPack.coords[0] + '_' + cellPack.coords[1],
        d: opts.createCellDataForKey(cellPack.key),
        nextD: opts.createCellDataForKey(cellPack.key),
        coords: cellPack.coords.slice()
      };
    }
    else {
      cell = opts.cellmap.getCell(cellPack.coords);
      opts.updateCellDataForKey(cellPack.key, cell.d);
      opts.updateCellDataForKey(cellPack.key, cell.d);
    }
    opts.cellmap.setCell(cell);
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
}

function loadMapFromURL(opts, done) {
  var req = createRequestMaker().makeRequest({
    method: 'GET',
    url: opts.url,
    mimeType: 'text/plain',
    done: function xhrDone(error, maptext) {
      if (error) {
        console.log(error);
      }
      else {
        var loadMapOpts = _.cloneDeep(opts);
        loadMapOpts.maptext = maptext;
        loadMap(loadMapOpts, done);
      }
    }
  });
}
