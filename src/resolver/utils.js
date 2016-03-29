'use strict';

import Returns, {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns';

// TODO:
// - `doesSourceSatisfySomeQueryFields` for partial matching
// - How will we handle relationships within a query?

/**
 * A quick hashing function which produces a unique hash from a string
 *
 * @param string
 * @return int
 */
export function hash(str) {
  return str.toString().split('').reduce((sum, n) => {
    sum = ((sum << 5) - sum) + n.charCodeAt(0);
    return sum & sum;
  });
}

/**
 * Predicate which checks that a given query contains all required params
 * for the source
 *
 * If a query doesn't provide all required parameters for a source then the 
 * source can't satisfy said query.
 *
 * NOTE: This only tests satisfiability of required params.
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
  return query.fields.every(f => source.returns.fieldsAsObject[f] !== undefined);
}

/**
 * If the query requires an item but the source only returns a list this returns
 * false.
 *
 */
export function doesSourceSatisfyQueryReturnType(source, query) {
  if (source.returns.returnType === RETURNS_ITEM
    && query.returnType === RETURNS_LIST) {
    return false;
  }
  return true;
}
