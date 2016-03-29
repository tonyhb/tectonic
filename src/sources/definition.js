'use strict';

import Returns from './returns';

/**
 * These keys are required in every source definition
 */
const requiredDefinitionKeys = ['returns', 'meta'];

/**
 * A source definition is a concrete definition for an API call or endpoint
 * which returns data for the app.
 *
 */
export default class SourceDefinition {
  id = undefined

  meta = undefined
  returns = undefined

  /**
   * Array of **required** parameters for the source.
   * These can be query parameters, postdata or parameters for URL replacement.
   */
  params = undefined

  /**
   * Array of optional parameters for the source
   */
  optionalParams = undefined

  driverFunc = undefined

  /**
   * @param string   unique ID of source definition
   * @param Returns  instance of Returns listing what this source returns
   * @param object   object containing unique source driver functionality
   * @param array    array of query parameters for the API call
   * @param function driver function to call to invoke the source
   */
  constructor({ id, returns, meta, params, optionalParams, driverFunc }) {
    if (id === undefined) {
      id = Math.floor(Math.random() * (1 << 30)).toString(16);
    }

    this.id = id;
    this.returns = returns;
    this.meta = meta;
    this.params = params || [];
    this.optionalParams = optionalParams || [];
    this.driverFunc = driverFunc;

    // ensure that after setting properties the definition is valid
    this.validate();
  }

  isPolymorphic() {
    return !(this.returns instanceof Returns);
  }

  validate() {
    if (requiredDefinitionKeys.some(i => this[i] === undefined)) {
      throw new Error(
        'Source definitions must contain keys: ' +
        requiredDefinitionKeys.join(', ')
      );
    }

    const { returns } = this;

    // If this is a single Returns instance this is valid
    if (returns instanceof Returns) {
      return;
    }

    // Otherwise this should be an object in which all values are Returns
    // instances
    if (typeof returns !== 'object') {
      throw new Error(
        'You must pass a concrete return value or object to `returns` ' +
        '(such as Model.item())'
      );
    }

    Object.keys(returns).forEach(item => {
      if (!(returns[item] instanceof Returns)) {
        throw new Error(
          'You must pass a concrete return value or object to `returns` ' +
          '(such as Model.item())'
        );
      }
    });
  }
}
