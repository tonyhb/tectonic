'use strict';

import Sources from '/src/sources';
import Cache from '/src/cache';
import { SUCCESS } from '/src/status';
import { RETURNS_ITEM } from '/src/sources/returns';

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
   */
  props(queries, state = undefined) {
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
      const status = state.getIn(['status', query.toString()]);
      props.status[prop] = status;
      // If this query was a success load the data.
      if (status === SUCCESS) {
        let [data, _] = this.cache.getQueryData(query, state);
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
