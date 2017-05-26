'use strict';

import sa from 'superagent';


// TectonicSuperagent is a class which, when constructed, returns a standard
// tectonic driver function
export default class TectonicSuperagent {

  constructor(opts = {}) {

    const inst = this;

    const driverFunc = (sourceDef, query, success, fail) => {
      let {
        meta: { url, transform, method, headers, request }
      } = sourceDef;

      url = inst.parseUrlParams({ url, query }, opts);
      url = inst.removeUnspecifiedParams(url, opts)
      console.log(url)
      // Normalize method type
      method = method ? method.toUpperCase() : 'GET';

      // Create a new request
      let r = sa(method, url);
      if (headers) {
        r.set(headers);
      }

      // When constructing the driver if we were passed a request transformer
      // use it
      if (opts.request) {
        r = opts.request(r);
      }

      // Similarly, if there's a meta.request parameter we should use it to 
      // transform the request for this particular source only
      if (typeof request === 'function') {
        r = request(r);
      }

      if (query.body) {
        r.send(query.body);
      }


      r.end((err, res) => {
        // If this errored call fail
        if (err !== null) {

          // Pass the error into the global onError handler if it exists
          if (opts.onError) {
            opts.onError(err, res);
          }

          return fail(err, res);
        }

        if (transform) {
          return success(transform(res), res);
        }

        return success(res.body, res);
      });
    }

    return driverFunc;
  }

  // Parse query params. Only allow query params starting with a letter so that
  // we keep ports:
  // http://localhost:8080/?id=:id1 only replaces id1.
  parseUrlParams({ url, query }) {
    const params = url.match(/:([a-zA-Z](\w+)?)/g) || [];
    params.forEach(p => {
      let key = p.replace(':', '');
      url = url.replace(p, query.params[key]);
    });
    return url;
  }

  /**
   * Removes unspecified params. It can remove them all (unsafe), or remove if
   * it's the last param.
   * @param {string} url
   * @param {string} type
   */
  removeUnspecifiedParams (url, { removeParams }) {
    const unspec = '/undefined'
    const isLast = (url, unspec) => {
      return url.length - url.indexOf(unspec) - unspec.length === 0
    }

    switch (removeParams) {
      case 'unsafe':
        return url.replace(unspec, '')
      case 'safe':
        const index = url.indexOf(unspec)
        if (index === -1) return url
        else if (!isLast(url, unspec)) throw new Error('Unspecified param')
        else return url.replace(unspec, '')
      case undefined:
        return url
      default:
        throw new Error('Invalid removeParams option')
    }
  }
}
