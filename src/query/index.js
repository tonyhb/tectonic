'use strict';

import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns.js';
import * as status from '/src/status';

/**
 * Query represents an API query to be resolved by the resolver. It is generated
 * directly from a model and contains thing such as fields required, parameters,
 * and whether we're loading a single item or a list.
 *
 * Queries are added to the resolver via the @load component and manager. It is
 * the resolver's responsibility to identify which sources satisfy the query.
 */
export default class Query {

  /**
   * When resolved we set the query's sourceDefinition property for tracking.
   */
  sourceDefinition = undefined

  /**
   * @param Model
   * @param array|string   Array of fields or RETURNS_ALL_FIELDS
   * @param RETURNS_ITEM|RETURNS_LIST   query for a single model or list
   * @param object   Object of query parameters to values
   */
  constructor(model, fields, returnType, params = {}) {
    model.assertFieldsExist(fields);

    this.model = model;
    this.fields = Array.isArray(fields) ? fields.sort() : fields;
    this.params = params;
    this.returnType = returnType;
  }

  toString() {
    if (this._toString !== undefined) {
      return this._toString;
    }

    this._toString = `Query(Model: ${this.model.modelName}, ` +
      `Fields: ${this.fields}, ` +
      `Params: ${JSON.stringify(this.params)}, ` +
      `ReturnType: ${this.returnType})`;

    return this._toString;
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

  /**
   * hash returns a hashed value of toString() that can be used to uniquely
   * identify this query.
   *
   * This is memoized for speed.
   */
  hashQuery() {
    if (this._hashQuery !== undefined) {
      return this._hashQuery;
    }

    this._hashQuery = this.toString().split('').reduce((sum, n) => {
      sum = ((sum << 5) - sum) + n.charCodeAt(0);
      return sum & sum;
    });

    return this._hashQuery;
  }


}
