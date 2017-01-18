// @flow

import Query from '../query';
import SourceDefinition, {
  assignDefaultParams
} from '../sources/definition';

import type { ParamsType } from '../consts';

// TODO:
// - `doesSourceSatisfySomeQueryFields` for partial matching
// - How will we handle relationships within a query?

/**
 * A quick hashing function which produces a unique hash from a string
 */
export function hash(str: any): number {
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
 * NOTE: This only tests satisfiability of required params, and **mixes in**
 *       default parameters if specified.
 *
 * TODO: Should we check that the source **also** allows for all params passed
 * into the query?
 *
 * @param SourceDefinition
 * @param Query
 * @return bool
 */
export function doesSourceSatisfyQueryParams(source: SourceDefinition, query: Query) {
  // Assign default parameters to a copy - keeping the original query unmodified
  const queryParams = assignDefaultParams(source, query.params);
  const queryKeys = queryParams;
  const params = source.paramNames();

  if (params.length === 0 && queryKeys.length === 0) {
    return true;
  }

  // short circuit without testing
  if (queryParams.length < params.length) {
    return false;
  }

  // Iterate through all source keys to see if they're defined in the query.
  return params.every(sp => queryParams[sp] !== undefined);
}

export function doesSourceSatisfyQueryModel(source: SourceDefinition, query: Query) {
  const { model } = source;
  return model.some(item => item === query.model);
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
export function doesSourceSatisfyAllQueryFields(source: SourceDefinition, query: Query) {
  const { providers } = source;

  if (query.fields === undefined || query.queryType === 'DELETE') {
    return true;
  }

  const provider = providers.providerForModel(query.model);
  // There is no model for this particular query therefore it can never
  // provide the fields for the model
  if (provider === null || provider === undefined) {
    return false;
  }

  // If the source returns all fields this will always satisfy the query
  if (provider.fields === '*') {
    return true;
  }

  // If the query wants all fields, at this point we know the source can't
  // satisfy this. TODO: partial field matching in which we combine API queries
  // to return all fields.
  if (query.fields === '*') {
    return false;
  }

  // Return whether every field is within this source
  return query.fields.every(f => provider.fieldsAsObject[f] !== undefined);
}

/**
 * If the query requires an item but the source only returns a list this returns
 * false.
 *
 */
export function doesSourceSatisfyQueryReturnType(source: SourceDefinition, query: Query) {
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
  const { providers } = source;

  // This assumes that each source definition will only ever return one type of
  // the same model if poylmorphic
  const provider = providers.providerForModel(query.model);
  if (provider === null || provider === undefined) {
    return false;
  }

  return (provider.returnType === query.returnType || query.queryType !== 'GET');
}

export function doesSourceSatisfyQueryType(source: SourceDefinition, query: Query): boolean {
  return (source.queryType === query.queryType);
}

// CACHING UTILS
// =============

export function parseCacheControlHeaders(cc: string): Date {
  // Take the max-age header, if it exists
  const match = cc.match(/max-age=(\d+)/);
  if (match === undefined) {
    return new Date();
  }

  let seconds = 0;
  if (Array.isArray(match)) {
    seconds = parseInt(match[1], 10);
  }
  const now = new Date();
  return new Date(now.getTime() + (seconds * 1000));
}
