/*
 * Support for a "transform" loader interface
 */
(function (global) {
  const systemJSPrototype = global.System.constructor.prototype;

  const instantiate = systemJSPrototype.instantiate;
  systemJSPrototype.instantiate = function (url, parentUrl, config) {
    if (url.slice(-5) === '.wasm')
      return instantiate.call(this, url, parentUrl, config);

    const loader = this;
    return fetch(url, { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok)
        throw Error('Fetch error: ' + res.status + ' ' + res.statusText + (parentUrl ? ' loading from ' + parentUrl : ''));
      return res.text();
    })
    .then(function (source) {
      return loader.transform.call(this, url, source);
    })
    .then(function (source) {
      (0, eval)(source + '\n//# sourceURL=' + url);
      return loader.getRegister();
    });
  };

  // Hookable transform function!
  systemJSPrototype.transform = function (_id, source) {
    return source;
  };
})(typeof self !== 'undefined' ? self : global);
