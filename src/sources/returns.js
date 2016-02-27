'use strict';

// Used to determine whether any source for an item or list returns all model
// fields
export const RETURNS_ALL_FIELDS = '*';

// Used to determine whether a source returns a single item or a list of items
export const RETURNS_ITEM = 'item';
export const RETURNS_LIST = 'list';

export default class Returns {

  constructor(model, fields, returnType) {
    this.model = model;
    this.returnType = returnType;

    if (fields === RETURNS_ALL_FIELDS) {
      this.fields = fields;
      return;
    }

    // If this only returns a single field we should wrap it in an array.
    if (typeof fields === 'string') {
      fields = [fields];
    }

    // And if this isn't an array already we've been passed a non-string and
    // non-array so throw an error.
    if (!Array.isArray(fields)) {
      throw new Error('Unknown field type ' + typeof fields);
    }

    model.assertFieldsExist(fields);

    // Finally set the fields that this source returns
    this.fields = fields;
  }

}
