// @flow

import deepEqual from 'deep-equal';
import SourceDefinition from '../sources/definition';
import Model from '../model';
import {
  GET,
} from '../consts';

import type {
  Id,
  QueryType,
  StatusType,
  ReturnType,
  ReturnsAllFields,
  ParamsType,
  QueryHash,
} from '../consts';

export type QueryOpts = {
  model: Class<Model> | Model;
  queryType: QueryType;
  returnType?: ?ReturnType;
  fields?: Array<string> | ?ReturnsAllFields;
  params?: ?ParamsType;
  body?: any,
  callback?: Function, // todo: callback function
  modelId?: ?Id,
};

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
  sourceDefinition: ?SourceDefinition = undefined

  /**
   * Represents the query status for an individual query.
   *
   * This is **extremely important** due to nuances: if this is SUCCESS, the
   * manager will **always** load data for this query from the store regardless
   * of cache validation.
   *
   * Background:
   *
   * - If a query response has a max-age of 0 we should discard the data on
   *   another page load OR component mount, but ignore caching when loading
   *   props for rendering or dependent data.
   *
   * - We only set the query status directly after resolving a query. This means
   *   that we can guarantee that a query instance with status of SUCCESS is
   *   fresh and can ignore the cache
   */
  status: ?StatusType;

  /**
   * Duplicates stores references to other query instances which are duplicates
   * of this query. When we update the status property we also update the status
   * of each duplicate.
   *
   * See baseResolver.addQuery for more information.
   */
  duplicates: Array<Query> = []

  /**
   * _force represents whether this query will be forced through the
   * resolver instead of deduplicating when other components have already
   * requested this data.
   *
   * in essence this ensures that the parent query has its internal status set
   * to `undefined`, which forces re-resolution of the query.
   *
   * This is set to true when using the props.load() function passed from the
   * decorator; queries called this way should always be resolved. If we didn't
   * do this, the query may be marked as a duplicate to a parent which has its
   * internal status set to SUCCESS. This bypasses the resolver *and* the cache.
   *
   * Note that a duplicated query still respects the cache; it should only be
   * forced to run through the resolver individually.
   *
   * By default this deduplicates the query.
   */
  _force: boolean = false

  model: Class<Model>
  modelId: ?Id
  queryType: QueryType
  returnType: ?ReturnType
  body: any
  // params contains both required and optional params
  params: ParamsType = {}
  // TODO: ReturnsNoFields, for deletes. This shouldn't be "undefined"
  fields: Array<string> | ReturnsAllFields
  returnedIds: Set<any>

  children: Array<Query>
  callback: ?Function

  /**
   * @param Model  model class
   * @param array|string   Array of fields or RETURNS_ALL_FIELDS
   * @param string GET, CREATE, UPDATE, or DELETE from consts above. Specifies
   *               the type of query to be sent across and match for in the
   *               sources list. Defaults to GET
   * @param string RETURNS_ITEM, RETURNS_LIST, or RETURNS NONE. Specifies
   *               whether the GET query is for a single model or list of models
   * @param object Object of query parameters to values
   * @param object Body to be sent in request, used for POST, PUT etc.
   * @param mixed  ID of the model instance for UPDATE and DELETE queries
   */
  constructor({ model, fields, queryType = GET, returnType, params, body, callback, modelId }: QueryOpts = {}) {
    if (model instanceof Model) {
      this.modelId = (model: Object)[model.constructor.idField];
      this.model = model.constructor;
    } else if (typeof model === 'function') {
      this.model = (model: Class<Model>);
      this.modelId = modelId;
    }

    if (params === undefined || params === null) {
      this.params = {};
    } else if (typeof params === 'object') {
      this.params = params;
    }

    this.model.assertFieldsExist(fields);
    this.fields = Array.isArray(fields) ? fields.sort() : '*';
    this.returnType = returnType;
    this.queryType = queryType;
    this.body = body;
    this.callback = callback;
    this.children = [];

    // To create query trees we need to iterate through each param and see if
    // the value is a function; if it is we assume this was created via
    // PropInspector and calculates this Query's parent query.
    Object.keys(this.params).forEach((p) => {
      const param = this.params[p];
      if (typeof param === 'function') {
        // Call the accessor generated by PropInspector using this query as the
        // context. This will create the parent-child tree relationships.
        this.params[p] = param.call(this);
      }
    });

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
    //
    // Also, by making this an ES6 set we guarantee uniqueness so as to not
    // check the
    this.returnedIds = new Set();
  }

  toString(): QueryHash {
    let fields;
    if (Array.isArray(this.fields)) {
      fields = this.fields.join(', ');
    } else {
      fields = this.fields;
    }

    let { returnType } = this;
    if (returnType === null || returnType === undefined) {
      returnType = '';
    }

    return `Query(Model: ${this.model.modelName}, ` +
      `Fields: ${fields}, ` +
      `Params: ${JSON.stringify(this.params)}, ` +
      `Body: ${JSON.stringify(this.body)}, ` +
      `QueryType: ${this.queryType}), ` +
      `ReturnType: ${returnType})`;
  }

  /**
   * Returns whether the current query instance is the same
   */
  is(item: Query) {
    const comparisons = [
      'model',
      'fields',
      'params',
      'returnType',
      'queryType',
      'body',
    ];

    return comparisons.every(field => deepEqual((this: Object)[field], (item: Object)[field]) === true);
  }

  /**
   * hash returns a hashed value of toString() that can be used to uniquely
   * identify this query.
   *
   * This is memoized for speed.
   */
  hash(): QueryHash {
    return this.toString();
  }

  updateStatus(to: StatusType) {
    this.status = to;
    this.duplicates.forEach((dupe) => { dupe.status = to; });
  }

  /**
   * force ensures the query runs through resolution instead of short circuiting
   * because of internal statuses being set on the parent query.
   */
  force() {
    this._force = true;
  }

}
