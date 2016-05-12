'use strict';

import Sources from '/src/sources';
import Cache from '/src/cache';
import { PENDING, SUCCESS } from '/src/status';
import { RETURNS_ITEM } from '/src/consts';

/**
 * The manager is the single interface for tectonic. It handles:
 *  - Adding API endpoints as sources from various drivers
 *  - Passing queries to the resolver
 *  - Calling resolve using previously defined sources to load data
 *  - Instantiating and handling the cache [todo]
 *
 * Example usage:
 *
 *   'use strict';
 *
 *   import { Manager, BaseResolver } from 'tectonic';
 *   import superagent from 'tectonic-superagent';
 *
 *   const manager = new Manager({
 *     drivers: {
 *       fromSuperagent: superagent
 *     },
 *     resolver: new BaseResolver()
 *   });
 *
 *   manager.fromSuperagent([
 *     {...} // List superagent sources
 *   ]);
 *
 *   ... // Wrap your root component like so:
 *   <Loader manager={ manager }>
 *     ...
 *   </Loader>
 *
 */
export default class Manager {


  constructor({ store, drivers, resolver }) {
    if (typeof drivers !== 'object') {
      throw new Error('You must supply at least one driver to instantiate a manager');
    }

    if ( ! resolver) {
      throw new Error('You must pass a resolver to instantiate a manager');
    }

    this.cache = new Cache(store)
    this.store = store;
    this.resolver = resolver;
    this.sources = new Sources();
    // Add the store to the resolver for dispatching actions
    this.resolver.store = store;
    // And add the cache to the resolver for querying and adding data
    this.resolver.cache = this.cache;

    // Make each driver callable via its key bound to our current context. This
    // allows us to add definitions for each driver by calling
    // sources[driverName](), ie: sources.fromSDK([...]);
    Object.keys(drivers).forEach(driver => {
      const driverFunc = drivers[driver];
      // When calling the driver name run processDefinitions to add the
      // definitions to the Source class.
      this[driver] = (defs) =>
        this.sources.processDefinitions(driverFunc, defs, this.resolver);
    });
  }

  /**
   * addQuery adds a query to the resolver from within the @load decoator.
   *
   * @param Query
   */
  addQuery(query) {
    this.resolver.addQuery(query, this.sources.definitions);
  }

  /**
   * resolve calls the Resolver's `resolveAll` function passing in the map of
   * source definitions previously defined and processed.
   */
  resolve() {
    this.resolver.resolveAll(this.sources.definitions);
  }

  /**
   * props returns the query data and loading data for a given set of queries.
   *
   * @param object Object of prop names => queries
   * @param Immutable.Map tectonic state
   * @param bool   whether to ignore cache when loading data. this should be
   *               true when fetching props for rendering a component only
   *               - this will always happen after a cache has become invalid.
   *               however, when using query props inside a decorator this
   *               should be false so that stale props are never passed into
   *               a Query constructor.
   */
  props(queries, state = undefined) {
    const { cache } = this;
    let props = {
      status: {},
    };

    if ( ! queries) {
      return props;
    }

    if (state === undefined) {
      state = this.store.getState().tectonic;
    }

    Object.keys(queries).forEach(prop => {
      const query = queries[prop];
      let status;

      // ignoreCache will be 
      const ignoreCache = query.status === SUCCESS;

      // If this has expired and we're respecting the cache set the status to
      // pending. It doesn't matter what we have stored; the state is not
      // updated when a query expires.
      if (this.cache.hasQueryExpired(query, state) && !ignoreCache) {
        status = PENDING;
      } else {
        // We inject statuses for each query into this.props; get the status
        // for the query.
        status = cache.getQueryStatus(query, state);
      }

      props.status[prop] = status;

      // If this query was a success load the data.
      if (status === SUCCESS) {
        let [data, _] = cache.getQueryData(query, state);
        props[prop] = data;
      } else {
        // Add an empty model as the prop so that this.props.model.x works
        if (query.returnType === RETURNS_ITEM) {
          props[prop] = query.model.blank();
        } else {
          props[prop] = [];
        }
      }
    });

    return props;
  }

}
