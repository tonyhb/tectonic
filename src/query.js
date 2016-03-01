'use strict';

import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from './sources/returns.js';

export default class Query {

  constructor(model, fields, returnType, params = {}) {
    model.assertFieldsExist(fields);

    this.model = model;
    this.fields = Array.isArray(fields) ? fields.sort() : fields;
    this.params = params;
    this.returnType = returnType;
  }

  /**
   * Returns whether the current query instance is the same 
   */
  is(item) {
    const { model: m1, fields: f1, params: p1, returnType: rt1 } = this;
    const { model: m2, fields: f2, params: p2, returnType: rt2 } = item;
    const k1 = Object.keys(p1), k2 = Object.keys(p2);

    // Ensure the models and return types are the same.
    if (m1 !== m2 || rt1 !== rt2) {
      return false;
    }

    // If both queries ask for a subset of fields ensure they're the same.
    if (Array.isArray(f1) && Array.isArray(f2)) {
      // If the fields are different sizes then we have a new query
      if (f1.length !== f2.length) {
        return false;
      }

      // Ensure that the query is asking for the same fields
      if ( ! f1.every((field, idx) => f2[idx] === field)) {
        return false;
      }
    } else if (f1 !== RETURNS_ALL_FIELDS || f2 !== RETURNS_ALL_FIELDS) {
      return false;
    }

    if (k1.length !== k2.length) {
      return false;
    }

    // Ensure the parameters are the same
    return k1.every(param => p1[param] === p2[param]);
  }

}
