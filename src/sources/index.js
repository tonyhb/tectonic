'use strict';

let definitions = new Map();

const processDefinitions = (ctx, definitions) => {
  if ( ! Array.isArray(definitions)) {
    throw new Error('No source definitions provided');
  }

  definitions.forEach(def => {
    if ( ! validateDefinition(def)) {
      throw new Error('Invalid source definition', def);
    }

    if (typeof def.returns === 'object') {
      // TODO: This is a polymorphic data source which returns multiple models
      throw new Error('Polymorphic data sources are not yet supported');
    }

    // Get the fields and modelType from the source definition's return value
    let [fields, modelType] = def.returns();

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
const requiredDefinitionKeys = ['params', 'returns', 'meta'];

/**
 * Validate that a source definition is valid
 *
 * @return boolean
 */
const validateDefinition = (def) => {
  return requiredDefinitionKeys.every(i => def[i] !== undefined);
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
