'use strict';

import Returns from './returns';
import Resolver from '../resolver';

/**
 * These keys are required in every source definition
 */
const requiredDefinitionKeys = ['returns', 'meta'];

/**
 * Validate that a source definition is valid
 */
const validateDefinition = (def) => {
  if (requiredDefinitionKeys.some(i => def[i] === undefined)) {
    throw new Error(
      'Source definitions must contain keys: ' +
      requiredDefinitionKeys.join(', ')
    );
  }

  if ( ! Array.isArray(def.returns) || def.length !== 2) {
    throw new Error(
      'You must pass a concrete return value or object to `returns` ' +
      '(such as Model.item())'
    );
  }
}

/**
 * {
 *   meta: {},
 *   fields: [],
 *   returns:,
 *   transform: (data) => ({...})
 * }
 */
export default class Sources {

  _definitions = new Map()

  /**
   * @param object Object containing keys to driver functions
   */
  constructor(drivers) {
    this.drivers = drivers;
    this.resolver = new Resolver();

    // Make each driver callable via its key bound to our current context. This
    // allows us to add definitions for each driver by calling
    // sources[driverName](), ie: sources.fromSDK([...]);
    Object.keys(drivers).forEach(key => {
      const driverFunc = drivers[key];
      // When calling the driver name run processDefinitions to add the
      // definitions to the Source class
      this[key] = (defs) => this.processDefinitions(driverFunc, defs)
    });
  }

  /**
   * @param sources
   * @param array  array of source definitions
   */
  processDefinitions(driverFunc, defsToProcess) {
    if ( ! Array.isArray(defsToProcess)) {
      throw new Error('Source definitions must be defined in an array');
    }

    defsToProcess.forEach(def => {
      // Ensure that the definition is valid. This will throw an error and
      // prevent any future JS from being called.
      validateDefinition(def);

      if (def.returns instanceof Returns) {
        // This is a non-polymorphic source which only returns one type of model.
        // We can handle this individually.
        return addDefinition(def);
      }

      // This may be a polymorphic source which returns more than one Model. If
      // so, the object's keys should be the same as the source response to
      // assign model attributes:
      //
      // {
      //   user: User.item,
      //   likes: Likes.list
      // }
      //
      // This expects a response from the source to contain an object in the
      // same structure:
      // {
      //   user: {...}, // user attributes
      //   likes: [{...}, {...}], // likes list
      // }
      //
      // We add each of these individually so we can map them by the return
      // model.
      if (typeof def.returns === 'object') {
        Object.keys(def.returns).forEach(returnKey => {
          addDefinition(def.returns[returnKey]);
        });
      }

      throw new Error(
        'Invalid return definition with type of ' +
        typeof def.returns
      );
    });
  }

  addDefinition(def) {
    // Return all existing source definitions which return the given model
    // type, eg. all sources which return a single user (User.item)
    // TODO: Polymorphic API responses
    let modelDefinitions = this._definitions.get(modelType) || [];

    // Add the fields which are returned from this source definition to the
    // object for easier manipulation and iteration later.
    const definition = {
      ...def,
      fields
    };

    // Store this source definition naively.
    //
    // When looking for a suitable source definition we need to take into
    // consideration what the source *returns* and its *parameters*.
    //
    // TODO: Store the definition based on the fields that it returns. We need
    // an efficient way of iterating through all source definitions for a given
    // return type to find the best source or combination of sources which
    // return the requested data.
    modelDefinitions.push(definitions);

    this._definitions.set(modelType, modelDefinitions);
  }

}
