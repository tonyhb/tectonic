'use strict';

/**
 * DumbResolver uses the first source that satisfies a query. It does no
 * optimization or caching. Hey, it's called dumb for a reason!
 *
 * Use at your own risk. Or your users. It's their data plan.
 */
export default class DumbResolver {

  /**
   * This map is keyed by model classes to a list of SourceDefinition IDs which
   * return those specific models
   */
  definitionsByModel = new Map()

  unresolvedQueries = []
  resolvedQueries = []

  /**
   * This will be called by the manager each time a source definition is added
   * to the manager's list of sources.
   */
  onAddDefinition(sourceDef) {
    if (sourceDef.isPolymorphic()) {
      // This source returns more than one model;
      // add all return items within the source definition
      Object.keys(sourceDef.returns).forEach(k => {
        const ret = sourceDef.returns[k];
        this.definitionsByModel.set(ret.model, sourceDef.key);
      });
    } else {
      this.definitionsByModel.set(sourceDef.returns.model, sourceDef.key);
    }
  }

  /**
   * This is called each time a query is added to the resolver. We're also
   * passed all sources from definitionMap for instantly resolving a query if
   * possible.
   *
   * @param Query
   * @param Map
   */
  addQuery(query, sourceMap) {
    this.unresolvedQueries.push(query);
  }

  /**
   *
   */
  resolve(sourceMap) {
    const { 
      unresolvedQueries,
      definitionsByModel
    } = this;

    if (unresolvedQueries.length === 0) {
      return;
    }

    this.unresolvedQueries.forEach(q => {
      let defs = definitionsByModel.get(q.model);
      console.log(defs);
    });
  }

}
