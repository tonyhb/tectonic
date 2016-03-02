'use strict';

import Returns from './returns';
import Resolver from '../resolver';
import SourceDefinition from './definition.js';

/**
 * Validate that a source definition is valid
 */
const validateDefinition = (def) => {
}

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
   * If defined this callback will be invoked with a SourceDefinition each
   * time a new definition is added to the definitions map.
   *
   * This allows custom resolvers to implement custom data structures for
   * storing definitions, such as mapping models to their source definitions for
   * faster lookup.
   */
  onAddDefinition = undefined

  /**
   * @param object Object containing keys to driver functions
   */
  constructor(drivers) {
    this.drivers = drivers;

    // Make each driver callable via its key bound to our current context. This
    // allows us to add definitions for each driver by calling
    // sources[driverName](), ie: sources.fromSDK([...]);
    Object.keys(drivers).forEach(driver => {
      const driverFunc = drivers[driver];
      // When calling the driver name run processDefinitions to add the
      // definitions to the Source class
      this[driver] = (defs) => this.processDefinitions(driverFunc, defs)
    });
  }

  /**
   * @param sources
   * @param array  array of source definitions
   */
  processDefinitions(driverFunc, defsToProcess) {
    if ( ! Array.isArray(defsToProcess)) {
      throw new Error('Source definitions must be defined in an array');
    }

    // TODO: Test that this stores definitions
    defsToProcess.forEach(def => {
      const item = new SourceDefinition(def)
      this.definitions.set(item.id, item);

      // TODO: Test that this is called
      if (this.onAddDefinition) {
        this.onAddDefinition(item);
      }
    });
  }

}
