'use strict';

import * as utils from './utils';

// This query chain is a series of functions which need to return true in order
// for a source to satisfy a query
const satisfiabilityChain = [
  utils.doesSourceSatisfyQueryParams,
  utils.doesSourceSatisfyQueryModel,
  utils.doesSourceSatisfyQueryFields
];

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
   *
   * @param SourceDefinition
   */
  onAddDefinition(sourceDef) {
    if (sourceDef.isPolymorphic()) {
      // This source returns more than one model;
      // add all return items within the source definition
      Object.keys(sourceDef.returns).forEach(k => {
        const ret = sourceDef.returns[k];
        this.addDef({ model: ret.model, id: sourceDef.id });
      });
      return;
    }

    this.addDef({
      model: sourceDef.returns.model,
      id: sourceDef.id
    });
  }

  addDef({ model, id }) {
    const { definitionsByModel: defs } = this;
    let items = defs.get(id) || [];
    items.push(id);
    defs.set(model, items);
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

      if (defs === undefined || defs.length === 0) {
        return console.warn(
          'There is no source definition which resolves the query',
          q.toString()
        );
      }

      defs.forEach(id => {
        const def = sourceMap.get(id);
      });

    });
  }

}
