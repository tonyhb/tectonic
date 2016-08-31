'use strict';

import SourceDefinition from './definition.js';

/**
 * {
 *   meta: {},
 *   fields: [],
 *   returns:,
 *   transform: (data) => ({...})
 * }
 */
export default class Sources {

  /**
   * This stores a map of SourceDefinition instances keyed by
   * SourceDefinition.id
   */
  definitions = new Map()

  /**
   * Convert a list of source definitions into a SourceDefinition classes,
   * storing them by their ID in this.definitions.
   *
   * This will call the resolver's `onAddDefinition` function passing the
   * SourceDefinnition as an argument. The resolver can use this to optimize
   * query resolution at their discretion.
   *
   * @param function driver function to invoke when the source is used
   * @param array array of source definitions
   * @param Resolver concrete instance of the resolver being used in the manager
   */
  processDefinitions(driverFunc, defsToProcess, resolver) {
    if ( ! Array.isArray(defsToProcess)) {
      throw new Error('Source definitions must be defined in an array');
    }

    // TODO: Test that this stores definitions
    defsToProcess.forEach(def => {
      // Add the driver function to the source
      def.driverFunc = driverFunc;

      const item = new SourceDefinition(def)
      this.definitions.set(item.id, item);

      // TODO: Test that this is called
      if (resolver && typeof resolver.onAddDefinition === 'function') {
        resolver.onAddDefinition(item);
      }
    });
  }

}
