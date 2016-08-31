'use strict';

import DumbResolver from './dumbResolver';

/**
 * Resolver is a generic interface for a concrete resolver clas which adds
 * queries to a list then resolves each query via a list of available sources
 * passed to `resolve`.
 *
 * A resolver's sole job is to figure out which sources to use for the given
 * queries.
 *
 */
export default class Resolver {

  constructor(driver) {
    if (driver === undefined) {
      driver = new DumbResolver();
    }
    this.driver = driver;
  }

  addDefinition(sourceDef) {
    return this.driver.addDefinition(sourceDef);
  }

  addQuery(query) {
    return this.driver.addQuery(query);
  }

  resolve(sources) {
    return this.driver.resolve(sources);
  }

}
