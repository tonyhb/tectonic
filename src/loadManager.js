'use strict';

/**
 * The manager is the coordinator which stores all sources, queries and the
 * cache.
 */
export default class LoadManager {

  constructor({ sources, resolver }) {
    this.sources = sources;
    this.resolver = resolver;

    // TODO: Allow use of many resolvers
    if (resolver && resolver.onAddDefinition) {
      sources.onAddDefinition = resolver.onAddDefinition.bind(resolver);
    }

  }

  /**
   * Shorthand used when adding a query to our resolvers via the higher-order
   * component
   *
   */
  addQuery(query) {
    this.resolver.addQuery(query, this.sources.definitions);
  }

  resolve() {
    this.resolver.resolve(this.sources.definitions);
  }

}
