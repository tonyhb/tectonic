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
 */
export default class Cache {

  /**
   * store holds a reference to the redux store
   */
  store = undefined;

  storeApiData(sourceDef, apiResponse) {
    const payload = this.parseApiData(sourceDef, apiResponse);
    this.store.dispatch({
      type: UPDATE_DATA,
      payload
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
   * @param SourceDefinition
   * @param object
   * @param Date  timestamp to add within cache, defaults to now. Used in
   * testing
   * @return object
   */
  parseApiData(sourceDef, apiResponse, time = new Date()) {
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
        const returnData = this._parseReturnsData(returns, returns.model, apiResponse[key], time);
        toStore[returns.model.modelName] = returnData;
      });
    } else {
      // this returns just one model (whether that's an individual model or
      // a list of the same models)
      const returnData = this._parseReturnsData(sourceDef.returns, sourceDef.returns.model, apiResponse, time);
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
   * @param Returns
   * @param Model
   * @param object API data
   * @param Date  timestamp to add within cache, defaults to now. Used in
   * testing
   * @return object
   */
  _parseReturnsData(returns, model, apiResponse, time = new Date()) {
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
      if (item[idAttr] === undefined) {
        throw new Error(`Unable to process data from API; data is missing the ID attribute`, item);
      }

      const id = item[idAttr];

      toStore[id] = {
        data: item,
        cache: {
          time
        }
      };

      return toStore;
    }, {});
  }

}
