'use strict';

import Sources from '/src/sources';

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
 *   import { Manager } from 'tectonic';
 *   import { superagent } from 'tectonic/drivers;
 *   import { DumbResolver } from 'tectonic/resolvers;
 *
 *   const manager = new Manager({
 *     drivers: {
 *       fromSuperagent: superagent
 *     },
 *     resolver: new DumbResolver()
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
    this.store = store;
    this.resolver = resolver;
    this.sources = new Sources();

    if (typeof drivers !== 'object') {
      throw new Error('You must supply at least one driver to instantiate a manager');
    }

    if ( ! this.resolver) {
      throw new Error('You must pass a resolver to instantiate a manager');
    }

    // Make each driver callable via its key bound to our current context. This
    // allows us to add definitions for each driver by calling
    // sources[driverName](), ie: sources.fromSDK([...]);
    Object.keys(drivers).forEach(driver => {
      const driverFunc = drivers[driver];
      // When calling the driver name run processDefinitions to add the
      // definitions to the Source class.
      //
      // This will call the resolver's onAddDefinition function with a 
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
   * resolve calls the Resolver's `resolve` function passing in the map of
   * source definitions previously defined and processed.
   */
  resolve() {
    this.resolver.resolve(this.sources.definitions);
  }

  /**
   * props returns the query data and loading data for a given set of queries.
   *
   */
  props() {
    let props = {
      status: {},
    };

    // TODO: Add loading status for each query (PENDING, SUCCESS, FAILURE)
    // TODO: Check cache for query's data

    return props;
  }

}
