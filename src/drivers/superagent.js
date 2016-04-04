'use strict';

// TODO: Make this a separate package
// import sa from 'superagent';

/**
 * fromSuperagent is a driver for using superagent with Tectonic.
 *
 * Query parameters will be added to the request automatically.
 *
 * Usage:
 *
 * manager.fromSuperagent([
 *   {
 *     params: ['id'],
 *     meta: {
 *       url: '/api/v0/users/:id',
 *       // use this to transform API responses
 *       transform: (data) => data,
 *       // this function accepts a superagent request to modify
 *       request: (r) => r
 *         .set('X-API-Key', 'foobar')
 *         .set('Accept', 'application/json'),
 *   }
 * ])
 */
const fromSuperagent = (sourceDef, query, success, fail) => {
  let {
    meta: { url, transform, request }
  } = sourceDef;

  // Parse query params
  const params = url.match(/:\w+/g);
  params.forEach(p => {
    let key = p.replace(':', '');
    url = url.replace(p, query.params[key]);
  });

  // TODO: Add query parameters to URL

  // If we have modifications to the request from the sourcedefinition we should
  // apply them here.
  if (request) {
    request = request(sa.get(url));
  } else {
    request = sa.get(url);
  }

  request.end((err, res) => {
    // If this errored call fail
    if (err !== null) {
      console.warn('Error with superagent request: ', err);
      return fail(err);
    }

    if (sourceDef.meta.transform) {
      return success(sourceDef.transform(res.body));
    }

    return success(res.body);
  });
};

export default fromSuperagent;
