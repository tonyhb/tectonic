'use strict';

/**
 * DumbResolver uses the first source that satisfies a query. It does no
 * optimization or caching. Hey, it's called dumb for a reason!
 *
 * Use at your own risk. Or your users. It's their data plan.
 */
export default class DumbResolver {

  /**
   * This stores a map of SourceDefinition instances keyed by
   * SourceDefinition.key.
   */
  definitions = new Map()

  definitionsByModel = new Map()

  unresolvedQueries = new Map()
  resolvedQueries = new Map()

  addDefinition(sourceDef) {
    this.definitions.set(sourceDef.key, sourceDef);

    if (sourceDef.isPolymorphic()) {
      Object.keys(sourceDef.returns).forEach(k => {
        const ret = sourceDef.returns[k];
        this.definitionsByModel.set(ret.model, sourceDef.key);
      });
    }
  }

  addQuery(query) {
    // When adding
  }

  resolve(sources) {
  }

}
