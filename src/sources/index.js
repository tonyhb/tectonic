'use strict';

let definitions = new Map();

/**
 * @param sources
 * @param array  array of source definitions
 */
const processDefinitions = (ctx, toProcess) => {
  if ( ! Array.isArray(toProcess)) {
    throw new Error('Source definitions must be defined in an array');
  }

  toProcess.forEach(def => {
    validateDefinition(def);

    // Get the fields and modelType from the source definition's return value
    let [fields, modelType] = def.returns;

    // Return all existing source definitions which return the given model
    // type, eg. all sources which return a single user (User.item)
    // TODO: Polymorphic API responses
    let modelDefinitions = definitions.get(modelType) || [];

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

    definitions.set(modelType, modelDefinitions);
  });
}

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

  /**
   * @param object Object containing keys to driver functions
   */
  constructor(drivers) {
    this.drivers = drivers;

    // Make each driver callable via its key bound to our current context
    Object.keys(drivers).forEach(key => {
      this[key] = (...args) => {
        drivers[key](this, ...args);
        processDefinitions(this, ...args)
      }
    });
  }

}
