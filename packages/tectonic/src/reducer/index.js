'use strict';

import { Map } from 'immutable';
import { SUCCESS } from '/src/status';

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
  // Note that when a model is deleted we update the model map's .deleted
  // property to true:
  //
  //   data = new Map({
  //     'users': new Map({
  //       1: new Map({
  //         data: ...,
  //         cache: ...,
  //         deleted: true,
  //       })
  //   })
  //          
  // Any time these are re-queried from the resolver these are wholesale
  // replaced, removing the `deleted` entry
  data: new Map(),

  // Stores a list of queries to the model IDs they returned
  queriesToIds: new Map(),

  // TODO: Merge queriesToId, Status and queriesToExpiry into one map
  queriesToExpiry: new Map(),
});

export const UPDATE_QUERY_STATUSES = '@@tectonic/update-query-statuses';
export const UPDATE_DATA = '@@tectonic/update-data';
export const DELETE_DATA = '@@tectonic/delete-data';

const reducer = (state = defaultState, action) => {

  if (action.type === UPDATE_QUERY_STATUSES) {
    // Add all of the queries from action.payload into state.status.
    // Merging retains past data.
    return state.mergeIn(['status'], action.payload);
  }

  // This is called when a query is successful, so we update data, queriesToIds
  // and the status of the query
  if (action.type === UPDATE_DATA) {
    const { query, data, expires } = action.payload;

    return state.withMutations(s => {
      s.mergeDeep({ data: data });
      s.setIn(['queriesToIds', query.toString()], query.returnedIds);
      s.setIn(['queriesToExpiry', query.toString()], expires);
      s.setIn(['status', query.toString()], SUCCESS);
    });
  }

  if (action.type === DELETE_DATA) {
    const { modelName, modelId } = action.payload;
    return state.mergeIn(['data', modelName, modelId], {deleted: true});
  }

  return state;
}

export default reducer;
