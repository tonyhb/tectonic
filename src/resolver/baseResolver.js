'use strict';

import * as utils from './utils';
import { UPDATE_QUERY_STATUSES } from '/src/reducer';
import { PENDING, SUCCESS, ERROR, UNDEFINED_PARAMS } from '/src/status';
import { GET } from '/src/consts';
import d from 'debug';
if (typeof window !== 'undefined') {
  window.tdebug = d;
}
const debug = d('tectonic:resolver');

/**
 * BaseResolver is a simple resolver which batches new queries from the
 * decorator then resolves all queries using a simple first-match solution.
 *
 * This should be extended to add advanced resolution algorithms.
 *
 * The resolver has four core roles:
 * 1. Matching queries with source definitions
 * 3. Dispatching query statuses
 * 2. Tracking which source definition calls are in-flight (so that we only make
 *    one request on each render)
 * 4. calling source definitions and handling success/failure statuses
 */
export default class BaseResolver {
  // cache and store are set from the manager
  cache = undefined
  store = undefined

  // This query chain is a series of functions which need to return true in order
  // for a source to satisfy a query
  satisfiabilityChain = [
    utils.doesSourceSatisfyQueryParams,
    utils.doesSourceSatisfyQueryModel,
    utils.doesSourceSatisfyAllQueryFields,
    utils.doesSourceSatisfyQueryReturnType,
    utils.doesSourceSatisfyQueryType
  ];

  /**
   * List of queries to resolve
   */
  queries = {}

  /**
   * statusMap holds a list of query hashes to their statuses during resolution.
   * This allows us to manipulate the status of queries in resolveAll,
   * resolveItem and unresolvable before dispatching.
   *
   */
  statusMap = {}

  /**
   * This is called ecah time a sourceDefinition is added via the manager. It
   * can be used for optimization.
   */
  onAddSourceDef(sourceDef) {
    // This
  }

  /**
   * addQuery is called (via the decorator and manager) to batch queries for
   * resolving.
   *
   * It stores each query in a map using the query's .toString() value as the
   * key. This deduplicates queries.
   *
   * @param Query
   * @param Map  A list of all sources passed from the manager
   */
  addQuery(query, sourceMap) {
    // TODO: Figure out a better way of deduping queries (alongisde setting
    // statuses in the query directly to force stale caches to match).
    //
    // Here, if the query has already been added by many components, we add
    // references to the duplicate queries so we can set STATUS to success on
    // each query when it's resolved.
    //
    // This prevents each separate component with dupe queries from
    // re-requesting data.
    const hash = query.toString();

    if (this.queries[hash] === undefined) {
      this.queries[query.toString()] = query;
    } else {
      this.queries[query.toString()].duplicates.push(query);
    }
  }

  /**
   * resolveAll iterates through all queries to resolve them with
   * a sourceDefinition.
   *
   * This resolver uses the following process for resolution:
   * 
   * 1. Check the cache to see if we have valid data
   *    Yes: Query resolved
   *    No: continue steps
   * 2. Check the cache to see if the query is already in-flight (status ===
   *    PENDING).
   *    Yes: the query has been resolved on a previous render and a request is
   *    in flight. No need to resolve.
   *    No: continue steps
   * 3. Iterate through sourceMap and test each source agains tquery for
   *    resolution
   *    No: query is unresolvable. End item.
   * 4. Assign sourcemap to query
   *
   * @param Map
   */
  resolveAll(sourceMap) {
    // Get tectonic state once so we can check the cache for each query's data
    // within this loop.
    const state = this.store.getState().tectonic;

    // All newly resolved queries will be pushed here so we call their source
    // definitions after resolution.
    // TODO: if two different queries use the same sourcedef this will be called
    // twice here.
    let resolvedQueries = [];

    const queryKeys = Object.keys(this.queries);
    if (queryKeys.length === 0) {
      return;
    }

    debug('resolving queries', this.queries);

    queryKeys.forEach(hash => {
      const q = this.queries[hash];
      // We can remove this query from this.queries as it's processed. The
      // only queries we need to process in the future are based off of
      // dependent data loading, and these will be re-added by future renders of
      // the decorator.
      delete(this.queries[hash]);

      // If the query status is SUCCESS internally we can short-circuit. This
      // allows us to not re-request a query with zero expiry time from
      // a component re-rendering with different props.
      if (q.status === SUCCESS) {
        debug('query already marked as success; skipping', q.toString(), q);
        return;
      }

      // Only check query data if the query has data that is NOT stale; ie we
      // have cached data
      if ( ! this.cache.hasQueryExpired(q, state)) {
        // Check if the query is in the cache. getQueryData returns a tuple; if
        // the second parameter of the tuple is true we already have data for this
        // query and can skip it. However, if this returns FALSE we MUST
        // process the query again unless it's in-flight.
        const [data, ok] = this.cache.getQueryData(q, state);

        // We have data for this query; this query is resolved and is successful
        if (ok) {
          debug('query has cached data; success', q.toString(), q);
          this.statusMap[hash] = SUCCESS;
          return;
        }
      } else {
          debug('query has stale data', q.toString(), q);
      }

      // check if the query status was previously set to pending
      const status = this.cache.getQueryStatus(q, state);
      if (status === PENDING) {
        debug('query already pending and in flight; skipping', q.toString(), q);
        // no need to update the query status as it's already pending
        return;
      }

      // If the query previously failed we should skip it if this is a GET
      // request.
      // TODO: test this is only for get requests
      if (status === ERROR && q.queryType === GET) {
        q.status = ERROR;
        debug('query previously failed; skipping', q);
        return;
      }

      // Attempt to resolve a single query from the map of source definitions.
      const sd = this.resolveItem(q, sourceMap)
      if (sd !== undefined) {
        q.sourceDefinition = sd;
        resolvedQueries.push(q);
        this.statusMap[hash] = PENDING;
        debug('resolved query', q.toString(), q);
      }
    });

    if (Object.keys(this.statusMap).length > 0) {
      this.store.dispatch({
        type: UPDATE_QUERY_STATUSES,
        payload: { ...this.statusMap }
      });
    }

    // Now we reset the map
    this.statusMap = {};

    resolvedQueries.forEach(query => {
      const { sourceDefinition: sd } = query;
      const success = (data, meta) => this.success(query, sd, data, meta);
      const fail = (data, meta) => this.fail(query, sd, data, meta);
      sd.driverFunc(sd, query, success, fail);
    });
  }

  /**
   * resolveItem is called on a query if the query has no data within the cache.
   *
   * This should be overwritten to provide smarter resolving in future
   * resolvers.
   *
   * @param Query
   * @param Map
   * @return SourceDefinition  sourcedef of query
   */
  resolveItem(query, sourceMap) {
    debug('resolving query', query);
    const sd = Array.from(sourceMap.values()).find(sourceDef => {
      // Check each source definition against all predicates in our
      // satisfiability chain. This short-circuits the loop of source
      // definitions returining true on the first source that satisfies the
      // query.
      //
      // This is dumb. You should make a smarter one.
      return this.satisfiabilityChain.every(i => i(sourceDef, query) === true);
    });

    if (sd === undefined) {
      this.unresolvable(query);
    }

    // return undefined or sourcedefinition
    return sd;
  }

  /**
   * unresolvable is called when a query is unresolvable. This could be due to
   * two things:
   *
   * 1. the query depends on other, as of yet unresolved/uncalled, queries. when
   *    other queries are solved and have the data they need this query may have
   *    all required parameters for their source definition
   *
   * 2. there is no valid source definition for a query.
   *
   * if a query has parameters specified with `undefined` values this assumes
   * that the query depends on other data which isn't yet available and
   * **doesn't** emit a warning.
   *
   * if all parameters are supplied and this is called we asssume there is no
   * source available for the given query and issue a console.warning.
   */
  unresolvable(query) {
    const params = Object.keys(query.params).map(k => query.params[k]);

    if (params.some(v => v === undefined)) {
      // some query params are undefined; issue a debug and ignore.
      this.statusMap[query.hash()] = UNDEFINED_PARAMS;
      debug('ignoring query as it has undefined parameters', query);
      return;
    }

    debug('query unresolvable', query);

    // Call the callback if it exists with an error
    if (typeof query.callback === 'function') {
      // TODO improve error
      query.callback('There is no source definition which resolves the query', null);
    }

    this.statusMap[query.hash()] = ERROR;
    query.status = ERROR;
    console.warn && console.warn(
      'There is no source definition which resolves the query',
      query.toString()
    );
  }

  success(query, sourceDef, data, meta = {}) {
    // TODO: Also update all dependencies of this query as success and
    // re-resolve

    // meta should contain things like headers for cache invalidation. we parse
    // the `expires` and `cache-control` headers from meta.headers to determine
    // the expiry date.
    //
    // by default this will return now, meaning this query will never be cached
    const expires = this.parseCacheHeaders(meta.headers);

    if (data) {
      // TODO: test errors thrown here trigger failure 
      try {
        query.updateStatus(SUCCESS);
        this.cache.storeApiData(query, sourceDef, data, expires);
      } catch (e) {
        console.warn(e);
        query.updateStatus(ERROR);
        return this.fail(query, sourceDef, e);
      }
    }

    if (typeof query.callback === 'function') {
      query.callback(null, data);
    }
  }

  fail(query, sourceDef, data) {
    // TODO: Also update all dependencies of this query as failed
    console.warn(`Query failed on ${query} using sourceDefinition ${sourceDef}: ${data}`);

    this.store.dispatch({
      type: UPDATE_QUERY_STATUSES,
      payload: {
        [query.hash()]: ERROR
      }
    });

    if (typeof query.callback === 'function') {
      query.callback(data, null);
    }
  }

  /**
   * parseCacheHeaders allows us to determine when a successful query should be
   * cached until
   *
   * @param object object of response headers
   * @return Date  date to cache until. if no cache information can be
   * determined this will return now
   */
  parseCacheHeaders(headers = {}) {
    const cc = headers['cache-control'];
    if (cc) {
      return utils.parseCacheControlHeaders(cc);
    }
    const expires = new Date(headers.expires);
    if (expires > new Date()) {
      return expires;
    }
    return new Date();
  }

}
