

import {
  RETURNS_ALL_FIELDS,
  GET,
} from '../consts';

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
 * TODO: Should we check that the source **also** allows for all params passed
 * into the query?
 *
 * @param SourceDefinition
 * @param Query
 * @return bool
 */
export function doesSourceSatisfyQueryParams(source, query) {
  const queryKeys = Object.keys(query.params);

  if (source.params.length === 0 && queryKeys.length === 0) {
    return true;
  }

  // Iterate through all source keys to see if they're defined in the query.
  return source.params.every(sp => query.params[sp] !== undefined);
}

export function doesSourceSatisfyQueryModel(source, query) {
  const { model } = source;
  return Object.keys(model).some(k => model[k] === query.model);
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
  let returns = source.returns;

  if (query.fields === undefined) {
    return true;
  }

  if (source.isPolymorphic()) {
    // If this is polymorphic we need to find the Return item which is for the
    // particular query's model
    const key = Object.keys(returns)
      .find(k => returns[k].model === query.model);
    // There is no model for this particular query therefore it can never
    // provide the fields for the model
    if (key === undefined) {
      return false;
    }
    returns = returns[key];
  }

  // If the source returns all fields this will always satisfy the query
  if (returns.fields === RETURNS_ALL_FIELDS) {
    return true;
  }

  // If the query wants all fields, at this point we know the source can't
  // satisfy this. TODO: partial field matching in which we combine API queries
  // to return all fields.
  if (query.fields === RETURNS_ALL_FIELDS) {
    return false;
  }

  // Return whether every field is within this source
  return query.fields.every(f => returns.fieldsAsObject[f] !== undefined);
}

/**
 * If the query requires an item but the source only returns a list this returns
 * false.
 *
 */
export function doesSourceSatisfyQueryReturnType(source, query) {
  // TODO: Revert to allowing a RETURNS_LIST call for a RETURNS_ITEM query;
  // overfetching is OK as the LIST query may already be in flight.
  //
  // In order to allow this we need to smarten passing props down into
  // a component - if the query for ITEM returns a LIST we'll currently pass the
  // entire list down into the component and not the ITEM. That's not correct;
  // we need to figure out the ID to extract and pass that back.

  // Short circuit for queries with no returnType, such as DELETE queries
  if (query.returnType === undefined) {
    return true;
  }

  // Note that query.returnType will be undefined if this is a non-GET query.
  let { returns } = source;

  if (source.isPolymorphic()) {
    const key = Object.keys(returns)
      .find(k => returns[k].model === query.model);
    returns = returns[key];
  }

  return (returns.returnType === query.returnType || query.queryType !== GET);
}

export function doesSourceSatisfyQueryType(source, query) {
  return (source.queryType === query.queryType);
}

// CACHING UTILS
// =============

export function parseCacheControlHeaders(cc) {
  // Take the max-age header, if it exists
  const match = cc.match(/max-age=(\d+)/);
  if (match === undefined) {
    return new Date();
  }

  let seconds = 0;
  if (Array.isArray(match)) {
    seconds = match[1];
  }
  const now = new Date();
  return new Date(now.getTime() + (seconds * 1000));
}
