'use strict';

export function doesSourceSatisfyQueryParams(source, query) {
  const queryKeys = Object.keys(query.params)

  if (sourceKeys.length === 0 && queryKeys.length === 0) {
    return true;
  }

  // Iterate through all source keys to see if they're defined in the query.
  return source.params.every(sp => query[sp] !== undefined);
}

export function doesSourceSatisfyQueryFields(source, query) {
}
