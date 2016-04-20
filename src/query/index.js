'use strict';

import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns.js';
import * as status from '/src/status';

import { GET, CREATE, UPDATE, DELETE } from '/src/consts';

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
   * @param string GET, CREATE, UPDATE, or DELETE from consts above. Specifies
   *               the type of query to be sent across and match for in the
   *               sources list. Defaults to GET
   * @param string RETURNS_ITEM, RETURNS_LIST, or RETURNS NONE. Specifies
   *               whether the GET query is for a single model or list of models
   * @param object   Object of query parameters to values
   */
  constructor({ model, fields, queryType = GET, returnType, params = {} }) {
    model.assertFieldsExist(fields);

    this.model = model;
    this.fields = Array.isArray(fields) ? fields.sort() : fields;
    this.params = params;
    this.returnType = returnType;
    this.queryType = queryType;

    // When the query is resolved and data is found this stores all of the IDs
    // returned by the API for the given model. This is then stored in a map of
    // query => IDs so that when we load props for a component we look up this
    // hash then look up our data.
    //
    // This means that we can query on arbitrary things such as ranges and
    // emails without knowing the IDs to look up, as the API tells us (plus we
    // store all data by ID).
    //
    // By default this is an empty array so we can push to it.
    this.returnedIds = [];
  }

  toString() {
    if (this._toString !== undefined) {
      return this._toString;
    }

    this._toString = `Query(Model: ${this.model.modelName}, ` +
      `Fields: ${this.fields}, ` +
      `Params: ${JSON.stringify(this.params)}, ` +
      `QueryType: ${this.queryType}), ` +
      `ReturnType: ${this.returnType})`;

    return this._toString;
  }

  /**
   * Returns whether the current query instance is the same
   */
  is(item) {
    const { model: m1, fields: f1, params: p1, returnType: rt1, queryType: qt1 } = this;
    const { model: m2, fields: f2, params: p2, returnType: rt2, queryType: qt2 } = item;
    const k1 = Object.keys(p1), k2 = Object.keys(p2);

    // Ensure the models and return types are the same.
    if (m1 !== m2 || rt1 !== rt2 || qt1 !== qt2) {
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
  hash() {
    return this.toString();
  }

}
