'use strict';

import { UPDATE_DATA } from '/src/reducer';
import Returns, {
  RETURNS_LIST,
  RETURNS_ITEM
} from '/src/sources/returns';

/**
 * Cache represents an abstraction over redux' store for saving and reading
 * data.
 *
 * TODO: Reading data
 * TODO: Per-model cache rules
 * TODO: custom cache rules and predicates
 */
export default class Cache {

  /**
   * store holds a reference to the redux store
   */
  store = undefined;

  constructor(store) {
    if (store === undefined || store.dispatch === undefined || store.getState === undefined) {
      throw new Error('Cache must be defined with a redux store');
    }
    this.store = store;
  }

  storeApiData(query, sourceDef, apiResponse) {
    const data = this.parseApiData(query, sourceDef, apiResponse);

    this.store.dispatch({
      type: UPDATE_DATA,
      payload: {
        data,
        query
      }
    });
  }

  /**
   * parseApiData takes an entire API response and formats each model's data in
   * the storage format to store within redux.
   *
   * The return is formatted like so:
   * {
   *   [model.modelName]: {
   *     [id]: {
   *       data: {...},
   *       cache: {...},
   *     },
   *     ...
   *   },
   *   ...
   * }
   *
   * @param Query
   * @param SourceDefinition
   * @param object
   * @param Date  timestamp to add within cache, defaults to now. Used in
   * testing
   * @return object
   */
  parseApiData(query, sourceDef, apiResponse, time = new Date()) {
    let toStore = {};

    if (sourceDef.isPolymorphic()) {
      // The source definition returns more than one model, where each key
      // defines a particular model that it returns.
      //
      // Process all of them and add them to `toStore` so we update the store
      // once.
      Object.keys(sourceDef.returns).forEach(key => {
        const returns = sourceDef.returns[key];
        // Get the return data for this particular key in the
        const returnData = this._parseReturnsData(query, returns, returns.model, apiResponse[key], time);
        toStore[returns.model.modelName] = returnData;
      });
    } else {
      // this returns just one model (whether that's an individual model or
      // a list of the same models)
      const returnData = this._parseReturnsData(query, sourceDef.returns, sourceDef.returns.model, apiResponse, time);
      toStore[sourceDef.returns.model.modelName] = returnData;
    }

    return toStore;
  }

  /**
   * parseReturnsData produces an object we save in the redux store for each
   * Returns instance within a sourceDefinition.
   *
   * For a single Returns instance this will produce an object as follows:
   * {
   *   [id]: {
   *     data: {...},
   *     cache: {...},
   *   }
   * }
   *
   * If the model of the data we're passing matches the queried for model, this
   * also adds the model IDs to the query (each query can specify a SINGLE
   * model). This allows us to cache the model IDs returned for a given query,
   * which aids in lookups.
   *
   * For example, if the query was for a list of Posts and the endpoint returned
   * the User AND the posts, this would add all returned post IDs to the query
   * only.
   *
   * @param Query   Query so we can add the IDs of returned data to the query
   * for caching
   * @param Returns
   * @param Model
   * @param object API data
   * @param Date  timestamp to add within cache, defaults to now. Used in
   * testing
   * @return object
   */
  _parseReturnsData(query, returns, model, apiResponse, time = new Date()) {
    if (returns.returnType === RETURNS_LIST && !Array.isArray(apiResponse)) {
      throw new Error(`Data for returning a list must be an array`, apiResponse);
    }

    if (returns.returnType === RETURNS_ITEM && apiResponse.constructor.toString().indexOf('Object') === -1) {
      throw new Error(`Data for returning an item must be an object`, apiResponse);
    }

    if (returns.returnType === RETURNS_ITEM) {
      // standardize to list so we deal with one case. laziness meeans love
      // homie
      apiResponse = [apiResponse];
    }


    // Take each instance of model data from the API response and save it in an
    // object to store in redux.
    //
    // We store things in a tree of modelName => id => { data: ..., cache: ...
    // }.
    //
    // modelData will contain a map of IDs to data and cache objects
    return apiResponse.reduce((toStore, item) => {
      if (typeof item !== 'object') {
        throw new Error('Unable to process data from API; data is not an object', item);
      }

      const idAttr = model.idAttribute;
      const id = item[idAttr];

      if (id === undefined) {
        throw new Error(`Unable to process data from API; data is missing the ID attribute`, item);
      }

      // Each query needs to store the IDs of the model it queried for.
      if (query.model === model) {
        query.returnedIds.push(id);
      }

      toStore[id] = {
        data: item,
        cache: {
          time
        }
      };

      return toStore;
    }, {});
  }

  /**
   * getQueryData inspects the given state for the current model for the
   * necessary data and returns it if so.
   *
   * @param Query  Query, which must have a filled .returnedIds
   * @param Map    Tectonic's reducer state (store.getState().tectonic)
   */
  getQueryData(query, state) {
    if (query.returnedIds.length === 0) {
      throw new Error(`Unable to pull data for query which has no returnedIds: ${query}`);
    }

    if (query.returnType === RETURNS_ITEM && query.returnedIds.length !== 1) {
      throw new Error(`Invalid returnedIds length for a single item call: ${query.returnedIds}`);
    }

    const { modelName } = query.model;

    if (query.returnType === RETURNS_ITEM) {
      // TODO: cache invalidation
      return state.getIn(['data', modelName, query.returnedIds[0]], 'data');
    }

    return query.returnedIds.map(id => state.getIn(['data', modelName, id, 'data']));
  }

}
