'use strict';

import * as status from '/src/status';
import {
  GET,
  CREATE,
  UPDATE,
  DELETE,
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/consts';
import deepEqual from 'deep-equal';

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
   * @param object Object of query parameters to values
   * @param object Body to be sent in request, used for POST, PUT etc.
   */
  constructor({ model, fields, queryType = GET, returnType, params = {}, body, callback }) {
    model.assertFieldsExist(fields);

    this.model = model;
    this.fields = Array.isArray(fields) ? fields.sort() : fields;
    this.params = params;
    this.returnType = returnType;
    this.queryType = queryType;
    this.body = body;

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
      `Body: ${JSON.stringify(this.body)}, ` +
      `QueryType: ${this.queryType}), ` +
      `ReturnType: ${this.returnType})`;

    return this._toString;
  }

  /**
   * Returns whether the current query instance is the same
   */
  is(item) {
    const comparisons = [
      'model',
      'fields',
      'params',
      'returnType',
      'queryType',
      'body'
    ];

    return comparisons.every(field => {
      return deepEqual(this[field], item[field]) === true;
    });
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
