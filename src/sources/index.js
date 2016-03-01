'use strict';

import Returns from './returns';
import Resolver from '../resolver';

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
   * @param object Object containing keys to driver functions
   */
  constructor(drivers) {
    this.drivers = drivers;
    // TODO: Resolver drivers
    this.resolver = new Resolver();

    // Make each driver callable via its key bound to our current context. This
    // allows us to add definitions for each driver by calling
    // sources[driverName](), ie: sources.fromSDK([...]);
    Object.keys(drivers).forEach(key => {
      const driverFunc = drivers[key];
      // When calling the driver name run processDefinitions to add the
      // definitions to the Source class
      this[key] = (defs) => this.processDefinitions(driverFunc, defs)
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
    const { resolver } = this;

    defsToProcess.forEach(def => {
      resolver.addDefinition(new SourceDefinition(def));
    });
  }

}
