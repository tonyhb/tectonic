'use strict';

import { Map } from 'immutable';

const defaultState = new Map({
  // Status stores a map of query hashes to statuses of said query
  status: new Map(),

  // Data stores all data fetched via tectonic. Its a map keyed by model names,
  // which itself are maps of IDs to an object containing the data *and* cache
  // information.
  //
  // For example:
  //   data = new Map({
  //     'users': new Map({
  //       1: new Map({
  //         data: ...
  //         cache: ...
  //       })
  //   })
  //          
  data: new Map()
});

export const UPDATE_QUERY_STATUSES = '@@tectonic/update-query-statuses';
export const UPDATE_DATA = '@@tectonic/update-data';

const reducer = (state = defaultState, action) => {

  if (action.type === UPDATE_QUERY_STATUSES) {
    // Add all of the queries from action.payload into state.status.
    // Merging retains past data.
    return state.mergeIn(['status'], action.payload);
  }

  return state;
}

export default reducer;
