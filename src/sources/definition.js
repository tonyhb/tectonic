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
   * Array of parameters for the source
   */
  params = undefined

  constructor({ id, returns, meta, params }) {
    if (id === undefined) {
      id = Math.floor(Math.random() * (1 << 30)).toString(16);
    }

    this.id = id;
    this.returns = returns;
    this.meta = meta;
    this.params = params;

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

    if (returns instanceof Returns) {
      return;
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
