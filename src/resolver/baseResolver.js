'use strict';

import * as utils from './utils';
import { UPDATE_QUERY_STATUSES } from '/src/reducer';
import { PENDING, SUCCESS, ERROR, UNDEFINED_PARAMS } from '/src/status';

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
    utils.doesSourceSatisfyQueryReturnType
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
    this.queries[query.toString()] = query;
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

    queryKeys.forEach(hash => {
      const q = this.queries[hash];
      const [data, ok] = this.cache.getQueryData(q, state);

      // We can remove this query from this.queries as it's processed. The
      // only queries we need to process in the future are based off of
      // dependent data loading, and these will be re-added by future renders of
      // the decorator.
      delete(this.queries[hash]);

      // We have data for this query; this query is resolved and is successful
      if (ok) {
        this.statusMap[hash] = SUCCESS;
        return;
      }

      // check if the query status was previously set to pending
      if (this.cache.getQueryStatus(q, state) === PENDING) {
        console.debug('query already pending and in flight; skipping', q);
        // no need to update the query status as it's already pending
        return;
      }

      // Attempt to resolve a single query from the map of source definitions.
      const sd = this.resolveItem(q, sourceMap)
      if (sd !== undefined) {
        q.sourceDefinition = sd;
        resolvedQueries.push(q);
        this.statusMap[hash] = PENDING;
      }
    });

    this.store.dispatch({
      type: UPDATE_QUERY_STATUSES,
      payload: this.statusMap
    });

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
      console.debug && console.debug('ignoring query as it has undefined parameters', query);
      return;
    }

    this.statusMap[query.hash()] = ERROR;
    console.warn && console.warn(
      'There is no source definition which resolves the query',
      query.toString()
    );
  }

  success(query, sourceDef, data, meta) {
    // TODO: meta should contain things like headers for cache invalidation
    // which can be used for single resources only
    // TODO: Also update all dependencies of this query as failed
    this.cache.storeApiData(query, sourceDef, data);
  }

  fail(query, sourceDef, data) {
    console.warn(`Query failed on ${query} using sourceDefinition ${sourceDef}: ${data}`);

    this.store.dispatch({
      type: UPDATE_QUERY_STATUSES,
      payload: {
        [query.hash()]: ERROR
      }
    });
  }

}
