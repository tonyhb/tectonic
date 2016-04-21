'use strict';

import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/consts';

/**
 * Returns defines a single entity returned from an API response.
 *
 * If an API response returns more than one entity (ie. a post with embedded
 * comments), the source definition should use an object with many Return
 * classes:
 *
 * returns: {
 *   post: Post.item(),
 *   comments: Post.comments.list()
 * }
 *
 */
export default class Returns {

  model = undefined
  returnType = undefined
  fields = undefined

  // Stores all field names as a key within an object.
  fieldsAsObject = {}

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

    // Store each field as the key to an object for O(1) lookups when testing
    // query field satisfiability
    fields.forEach(f => this.fieldsAsObject[f] = true);

    // Finally set the fields that this source returns
    this.fields = fields;
  }

}
