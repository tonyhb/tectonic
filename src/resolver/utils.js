'use strict';

import Returns, { RETURNS_ALL_FIELDS } from '/src/sources/returns';

/**
 * Predicate which checks that a given source accepts all parameters for a given
 * query.
 *
 * If a source doesn't accept all parameters for a query then the source can't
 * satisfy said query.
 *
 * TODO: How do we mark params as optional?
 *
 * @param SourceDefinition
 * @param Query
 * @return bool
 */
export function doesSourceSatisfyQueryParams(source, query) {
  const queryKeys = Object.keys(query.params)

  if (source.params.length === 0 && queryKeys.length === 0) {
    return true;
  }

  // Iterate through all source keys to see if they're defined in the query.
  return source.params.every(sp => query.params[sp] !== undefined);
}

export function doesSourceSatisfyQueryModel(source, query) {
  const { returns } = source;
  if (returns instanceof Returns) {
    // This only returns one model
    return returns.model === query.model;
  }


  // This source returns more than one model
  return Object.keys(returns).some(k => returns[k].model === query.model);
}

/**
 * Predicate which checks that a given source returns the necessary fields for
 * a query.
 *
 * TODO: PARTIAL - in which a source returns a subset of the fields needed for
 * the query, allowing us to combine multiple sources.
 *
 * @param SourceDefinition
 * @param Query
 * @return bool
 */
export function doesSourceSatisfyAllQueryFields(source, query) {
  // If the source returns all fields this will always satisfy the query
  if (source.returns.fields === RETURNS_ALL_FIELDS) {
    return true;
  }

  // If the query wants all fields, at this point we know the source can't
  // satisfy this. TODO: partial field matching in which we combine API queries
  // to return all fields.
  if (query.fields === RETURNS_ALL_FIELDS) {
    return false;
  }

  // Return whether every field is within this source
  return query.fields.every(f => source.fieldsAsObject[f] !== undefined);
}

// TODO:
// - doesSourceSatisfySomeQueryFields
// - How will we handle relationships within a query?
