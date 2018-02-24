// @flow

import d from 'debug';
import { Map } from 'immutable';
import * as utils from './utils';
import { UPDATE_QUERY_STATUSES } from '../reducer';

import type {
  QueryHash,
} from '../consts';
import type Status, { StatusOpts } from '../status/status';
import type Query from '../query';
import type SourceDefinition from '../sources/definition';


if (typeof window !== 'undefined') {
  window.tdebug = d;
}
const debug = d('tectonic:resolver');

const warn = (...args) => {
  if (console && typeof console.warn === 'function') {
    console.warn(...args);
  }
};

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
  cache: Object // TODO: Cache flow type
  store: Object

  // This query chain is a series of functions which need to return true in order
  // for a source to satisfy a query
  satisfiabilityChain = [
    utils.doesSourceSatisfyQueryParams,
    utils.doesSourceSatisfyQueryModel,
    utils.doesSourceSatisfyAllQueryFields,
    utils.doesSourceSatisfyQueryReturnType,
    utils.doesSourceSatisfyQueryType,
  ];

  /**
   * List of queries to resolve. These queries have not yet been resolved
   * therefore cannot have the default values added (as there's no source
   * definition to fill in defaults).
   *
   * Therefore, these hashes are for initial component deuplication only
   * and should not be relied on for later use.
   */
  queries: { [key: QueryHash]: Query } = {}

  /**
   * queriesInFlight is used to store all currently pending queries by hash
   * with default parameters added.
   *
   * We can then check this object to see if a duplicate query is currently
   * pending; if so we can add the duplicate to the pending query's dupe lists
   * so that components are automaticaly deduplicated.
   */
  queriesInFlight: { [key: QueryHash]: Query } = {}

  /**
   * statusMap holds a list of query hashes to their statuses during resolution.
   * This allows us to manipulate the status of queries in resolveAll,
   * resolveItem and unresolvable before dispatching.
   *
   * Note that these hashes must be queries with all default values added.
   *
   */
  statusMap: { [key: QueryHash]: StatusOpts } = {}

  /**
   * This is called ecah time a sourceDefinition is added via the manager. It
   * can be used for optimization.
   */
  onAddSourceDef() {}

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
  addQuery(query: Query) {
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
      this.queries[hash] = query;
      return;
    }
    if (this.queries[hash] === query) {
      // This is an exact dupe of a previously set query; skip
      return;
    }

    // Here this is a technical dupe created by a separate component.

    // If this query is marked so that we ensure it's forced through the
    // resolver we need to update the parent's query status to remove PENDING,
    // SUCCESS etc.
    //
    // We could always randomly change the query's hash if it's forced, however
    // we fetch data for queries using the reducer's queryToIds map - if we
    // randomly change the query hash other "duplicate" but unforced queries
    // will never receive updates.
    if (query._force === true) {
      // Force the parent query through resoution
      this.queries[hash].status = undefined;
    }

    // Mark the query as a dupe.
    this.queries[hash].duplicates.push(query);
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
  resolveAll(sourceMap: Map<*, *>) {
    // Get tectonic state once so we can check the cache for each query's data
    // within this loop.
    const state = this.store.getState().tectonic;

    // All newly resolved queries will be pushed here so we call their source
    // definitions after resolution.
    // TODO: if two different queries use the same sourcedef this will be called
    // twice here.
    const resolvedQueries = [];

    const queryKeys = Object.keys(this.queries);
    if (queryKeys.length === 0) {
      return;
    }

    debug('resolving queries', this.queries);

    queryKeys.forEach((hash) => {
      const q = this.queries[hash];
      // We can remove this query from this.queries as it's processed. The
      // only queries we need to process in the future are based off of
      // dependent data loading, and these will be re-added by future renders of
      // the decorator.
      delete (this.queries[hash]);

      // If the query status is defined internally we can short-circuit; this
      // has already been processed.
      //
      // This allows us to not re-request a query with zero expiry time from a
      // component re-rendering with different props, as this internal property
      // is only set in pre-existing queries.
      if (q.status !== undefined) {
        debug('query already marked internally; skipping', q.toString(), q);
        return;
      }

      let status = this.cache.getQueryStatus(q, state);
      if (this.skipFromCache(q, hash, status, state)) {
        return;
      }

      // Attempt to resolve a single query from the map of source definitions.
      const sd = this.resolveItem(q, sourceMap, status);
      if (sd === undefined || sd === null) {
        // no source definition found for this query so it's unresolvable.
        return;
      }

      // Supplement the query with new all of the default parameters for the
      // source definiton's params and optionalParmas. Use this in place of our
      // query if it's different.
      //
      // This ensures that we're sending and caching the correct query. Note that
      // we'll need to retest cached data with the new supplemented query if it's
      // different as the query's toString() will produce a new string - and
      // that's used as the cache key.
      sd.addDefaultParams(q);
      const newHash = q.toString();

      if (hash !== newHash) {
        // Recheck status and cache information for the new query
        status = this.cache.getQueryStatus(q, state);
        if (this.skipFromCache(q, newHash, status, state)) {
          debug('query with defaults is pending or cached; skipping', q.toString(), q);
          return;
        }
      }

      // Add this query to the reducer's global queryInFlight list for
      // future dupe linking during the PENDING stage
      //
      // Note that we can't use "hash" here - the query's toString value
      // (hash) may have changed due to adding default parameters.
      this.queriesInFlight[q.toString()] = q;

      // Push this to the list which will be processed via drivers
      resolvedQueries.push(q);
      q.sourceDefinition = sd;
      q.updateStatus('PENDING');
      this.statusMap[q.toString()] = {
        status: 'PENDING',
      };

      debug('resolved query', q.toString(), q);
    });

    if (Object.keys(this.statusMap).length > 0) {
      this.store.dispatch({
        type: UPDATE_QUERY_STATUSES,
        payload: { ...this.statusMap },
      });
    }

    // Now we reset the map
    this.statusMap = {};

    resolvedQueries.forEach((query) => {
      const { sourceDefinition: sd } = query;
      if (sd) {
        const success = (data, meta) => this.success(query, sd, data, meta);
        const fail = (data, meta) => this.fail(query, sd, data, meta);
        sd.driverFunc(sd, query, success, fail);
      }
    });
  }

  // skipFromCache is used during resolution to determine whether we can
  // short-circuit and stop resolving a given query if:
  //   - the query has valid, unexpired data in the cache
  //   - a duplicate query is pending
  //
  // This returns a boolean indicating whether we can short circuit
  skipFromCache(query: Query, hash: QueryHash, status: Status, state: Map<*, *>): boolean {
    if (!this.cache.hasQueryExpired(query, state)) {
      // Check if the query is in the cache. getQueryData returns a tuple; if
      // the second parameter of the tuple is true we already have data for this
      // query and can skip it. However, if this returns FALSE we MUST
      // process the query again unless it's in-flight.
      const [ data, ok ] = this.cache.getQueryData(query, state);

      // We have data for this query; this query is resolved and is successful
      if (ok) {
        debug('query has cached data; success', query.toString(), query);
        this.statusMap[hash] = { status: 'SUCCESS' };
        if (typeof query.callback === 'function') {
          query.callback( null, data );
        }
        return true;
      }
    }

    // check if the query status was previously set to pending
    // XXX (tonyhb): there may be a teeny chance of a hidden race condition
    // using the cache here vs this.queriesInFlight. Plz check. Note that
    // this has _not_ been encountered in the wild; this is speculation.
    if (status.isPending()) {
      debug('query already pending and in flight; skipping', query.toString(), query);
      // update the query's internal status to pending, but no need to update
      // the query status as it's already pending
      query.updateStatus('PENDING');

      // If we're here and the query is PENDING this must mean that the
      // internal status of the query didn't get set. Perhaps this was added
      // by a loaded component after the previous in-flight query was
      // resolved?
      // In any case, to ensure that the original query which caused the
      // request cascades down into this one we need to mark this query as
      // a duplicate.
      // Otherwise, this query's internal status will still be set to PENDING
      // (as the parent query doesn't update it) which is inconsistent,
      // causing data not to be passed down in the manager.
      const parent = this.queriesInFlight[query.toString()];
      if (parent === undefined) {
        warn('There is no parent definition found for in-flight query: ', query.toString());
      } else {
        debug('query previously resolved and in-flight; marking dupe', query.toString(), query);
        parent.duplicates.push(query);
      }
      return true;
    }

    return false;
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
  resolveItem(query: Query, sourceMap: Map<*, *>, status: Status): ?SourceDefinition {
    debug('resolving query', query);

    const params = Object.keys(query.params).map(k => query.params[k]);
    if (params.some(v => v === undefined)) {
      // Only udpate the stored query status object if we're changing status to
      // UNDEFINED_PARAMS from another status.
      //
      // If we change the status object from UNDEFINED_PARMAS to
      // UNDEFINED_PARAMS react's equality checking will still think this is
      // a new prop, as objects do not compare.
      //
      // This will cause an inifnite loop in rendering.
      //
      // Note that we don't need to do this for other statuses as setting the
      // query's .status parameter short-circuits reoslution; this is never done
      // for UNDEFINED_PARAMS to ensure re-resolution of the query with new
      // props.
      if (!status.isUndefinedParams()) {
        this.statusMap[query.hash()] = {
          status: 'UNDEFINED_PARAMS',
        };
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn('ignoring query as it has undefined parameters', query);
      }

      debug('ignoring query as it has undefined parameters', query);
      return null;
    }

    // Check each source definition against all predicates in our
    // satisfiability chain. This short-circuits the loop of source
    // definitions returining true on the first source that satisfies the
    // query.
    //
    // This is dumb. You should make a smarter one.
    const sd = Array.from(sourceMap.values()).find(
      sourceDef => this.satisfiabilityChain.every(i => i(sourceDef, query) === true)
    );

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
  unresolvable(query: Query) {
    debug('query unresolvable', query);

    // Call the callback if it exists with an error
    if (typeof query.callback === 'function') {
      query.callback('There is no source definition which resolves the query', null);
    }

    this.statusMap[query.hash()] = {
      status: 'ERROR',
      error: 'There is no source definition which resolves the query',
    };

    query.updateStatus('ERROR');
    warn('There is no source definition which resolves the query', query.toString());
  }

  success(query: Query, sourceDef: SourceDefinition, data: Object | Array<Object>, meta: Object = {}) {
    delete this.queriesInFlight[query.toString()];

    // TODO: Also update all dependencies of this query as success and
    // re-resolve

    // meta should contain things like headers for cache invalidation. we parse
    // the `expires` and `cache-control` headers from meta.headers to determine
    // the expiry date.
    //
    // by default this will return now, meaning this query will never be cached
    const expires = this.parseCacheHeaders(meta.headers);

    query.updateStatus('SUCCESS');
    this.cache.storeQuery(query, sourceDef, data, expires);

    if (typeof query.callback === 'function') {
      query.callback(null, data);
    }
  }

  fail(query: Query, sourceDef: SourceDefinition, data: string, meta: {status?: number} = {}) {
    delete this.queriesInFlight[query.toString()];

    // TODO: Also update all dependencies of this query as failed
    warn(`Query failed on ${query.toString()} using sourceDefinition ${sourceDef.toString()}: ${data.toString()}`);

    this.store.dispatch({
      type: UPDATE_QUERY_STATUSES,
      payload: {
        [query.hash()]: {
          status: 'ERROR',
          code: meta.status,
          error: data,
        },
      },
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
  parseCacheHeaders(headers: Object = {}) {
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
