function createFixedCellGridRenderer(opts) {
  var a = createAccessorizer();

  a.cacheAccessor('transform', function getTransform(d) {
    return 'translate(' 
      + d.coords[0] * opts.cellWidth + ',' 
      + d.coords[1] * opts.cellHeight 
      + ') scale(' + opts.cellWidth + ', ' + opts.cellHeight + ')';
  });

  var tileRoot = d3.select(opts.selectors.root);

  // renderCells never removes cell elements. It only hides them.
  function renderCells(cells) {
    var cellRenditions = tileRoot.selectAll('.' + opts.cellClass)
      .data(cells, opts.idFunction);

    var newCellRenditions = cellRenditions.enter()
      .append('g').classed(opts.cellClass, true);

    newCellRenditions
      .append('rect').attr({
        x: 0,
        y: 0,
        width: 1,
        height: 1
      })
      .attr('transform', a.transform);

    cellRenditions.attr('opacity', 1.0);

    if (opts.customUpdate) {
      opts.customUpdate(cellRenditions);
    }

    // Hide exited cells instead of removing.
    cellRenditions.exit()
      .attr('opacity', 0);
  }

  return {
    renderCells: renderCells
  };
}
