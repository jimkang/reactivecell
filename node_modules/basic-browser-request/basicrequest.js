function createRequestMaker() {
  function makeRequest(opts) {
    opts = defaults(opts, {mimeType: 'application/json'});

    var xhr = new XMLHttpRequest();
    xhr.open(opts.method,  opts.url);
    if (opts.method === 'POST') {
      xhr.setRequestHeader('content-type', opts.mimeType);
    }
    else if (opts.method === 'GET') {
      xhr.setRequestHeader('accept', opts.mimeType);
    }

    var timeoutKey = null;

    xhr.onload = function requestDone() {
      clearTimeout(timeoutKey);
      
      if (this.status === 200) {

        var resultObject = this.responseText;
        if (opts.mimeType === 'application/json') {
          resultObject = JSON.parse(resultObject);
        }
        opts.done(null, resultObject);
      }
      else {
        opts.done('Error while making request. XHR status: ' + this.status, null);
      }
    };

    if (opts.onData) {
      var lastReadIndex = 0;
      xhr.onprogress = function progressReceived() {
        opts.onData(this.responseText.substr(lastReadIndex));
        lastReadIndex = this.responseText.length;
      };   
    }
   
    xhr.send(opts.method === 'POST' ? opts.body : undefined);

    if (opts.timeLimit > 0) {
      timeoutKey = setTimeout(cancelRequest, opts.timeLimit);
    }

    function cancelRequest() {
      xhr.abort();
      clearTimeout(timeoutKey);
      opts.done('Timed out', null);
    }

    return {
      url: opts.url,
      cancelRequest: cancelRequest
    };
  }

  // From Underscore, more or less.
  function defaults(obj, source) {
    if (source) {
      for (var prop in source) {
        if (obj[prop] === undefined) {
          obj[prop] = source[prop];
        }
      }
    }
    return obj;
  }  

  return {
    makeRequest: makeRequest
  };
}

