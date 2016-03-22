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
   * This map is keyed by model classes to an array of SourceDefinition IDs 
   * which return those specific models
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
   * @param Object  Object of source definition IDs to the SourceDefinition instance
   */
  resolve(sourceMap) {
    const { 
      unresolvedQueries,
      definitionsByModel
    } = this;

    if (unresolvedQueries.length === 0) {
      return;
    }

    this.unresolvedQueries = this.unresolvedQueries.filter((q) => {
      return (this.resolveItem(q, sourceMap) === false);
    });
  }

  /**
   * Takes a query and sourcemap and attempts to resolve a query naively by
   * using the first source that satisfies the query.
   *
   * @param Quer
   * @param Map    Map of source IDs to Source instances
   * @return bool  
   */
  resolveItem(query, sourceMap) {

    const {
      definitionsByModel
    } = this;

    // Get all source definitions that return the current model
    let defs = definitionsByModel.get(query.model);

    if (defs === undefined || defs.length === 0) {
      // This query cannot be satisfied as none of the added sources return this
      // model type
      return this.unresolvable(query);
    }

    // Iterate through all definition IDs which return the query's model,
    // passing the source definition and query through our satisfiability chain.
    // This will stop at the definition ID of the source that first satisfies
    // our query, making sourceDef the 
    let sourceDef;
    let id = defs.find(id => {
      sourceDef = sourceMap.get(id);
      return satisfiabilityChain.every(i => i(sourceDef, query) === true);
    });

    if (id === undefined) {
      return this.unresolvable(query);
    }

    // TODO:
    // - Push source to call with params
    // - Push query to resolved
    // - How do we link query to source call?

  }

  /**
   * unresolvable is called when a query can't be resolved with the current
   * sources list
   *
   * @param Query
   */
  unresolvable(query) {
    console.warn(
      'There is no source definition which resolves the query',
      query.toString()
    );
    return false;
  }

}
