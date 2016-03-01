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

class SourceDefinition {
  key = undefined

  // These are the 
  meta = undefined
  returns = undefined
  params = undefined

  constructor({ key, returns, meta, params }) {
    if (key === undefined) {
      key = Math.floor(Math.random() * (1 << 30)).toString(16);
    }

    this.key = key;
    this.returns = returns;
    this.meta = meta;
    this.params = params;

    // ensure that after setting properties the definition is valid
    this.validate();
  }

  isPolymorphic() {
    return this.returns instanceof Returns;
  }

  validate() {
    if (requiredDefinitionKeys.some(i => this[i] === undefined)) {
      throw new Error(
        'Source definitions must contain keys: ' +
        requiredDefinitionKeys.join(', ')
      );
    }

    if ( ! Array.isArray(this.returns) || this.returns.length !== 2) {
      throw new Error(
        'You must pass a concrete return value or object to `returns` ' +
        '(such as Model.item())'
      );
    }
  }
}
