'use strict';

// Used to determine whether any source for an item or list returns all model
// fields
const RETURNS_ALL_FIELDS = '*';

// Used to determine whether a source returns a single item or a list of items
const RETURNS_ITEM = 'item';
const RETURNS_LIST = 'list';

export default class Returns {

  constructor(fields, model, returnType) {
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

    this.assertFieldsExist(fields, model);

    // Finally set the fields that this source returns
    this.fields = fields;
  }

  /**
   * Ensures that all fields exist within the model
   */
  assertFieldsExist(fields, model) {
    const modelFields = model.fields();

    // Ensure that all fields are defined within our model
    const missing = fields.reduce((missing, field) => {
      if (modelFields.indexOf(field) === -1) {
        missing.push(field);
      }
      return missing;
    }, []);

    if (missing.length > 0) {
      throw new Error(
        `All return fields must be defined within your model. Missing: ` +
        missing.join(', ')
      );
    }
  }

}
