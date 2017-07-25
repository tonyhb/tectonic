// @flow

import ProviderGroup from './providerGroup';
import Provider from './provider';
import {
  GET, CREATE, UPDATE, DELETE,
} from '../consts';

import type {
  QueryType,
  ParamsType,
} from '../consts';

import type Model from '../model';
import type Query from '../query';

export type SourceDefinitionOpts = {
  id: string;
  returns: Provider | { [key: string]: Provider } | ?string;
  meta: Object;
  params: ParamsType | ?Array<string> | string;
  optionalParams: ?Array<string> | string;
  driverFunc: Function;

  // model may be explicitly set for non-GET queries; otherwise, for GET queries
  // this is typically resolved from the Returns parameter
  model: ?Class<Model>;
  queryType: QueryType;

  // cacheFor may be set, defining the TTL for the response in seconds
  cacheFor: ?number;
};

/**
 * A source definition is a concrete definition for an API call or endpoint
 * which returns data for the app.
 *
 */
export default class SourceDefinition {
  id: string
  meta: Object
  providers: ProviderGroup
  model: Array<Class<Model>>
  driverFunc: Function
  queryType: QueryType

  cacheFor: ?number

  /**
   * Object of **required** parameters for the source (where values are defaults).
   * These can be query parameters, postdata or parameters for URL replacement.
   */
  params: ParamsType
  _paramNames: Array<string>

  /**
   * Object of optional parameters for the source (where values are defaults)
   */
  optionalParams: ParamsType
  _optionalParamNames: Array<string>

  /**
   * Create a new source definition to be used as a source for an API call.
   *
   * This is always called via the manager and should not be constructed
   * manually. To create a source instantiate your manager with the necessary
   * drivers and use the manager to make many sources:
   *
   * const m = new Manager({
   *   drivers: { myDriver },
   *   resolver: new BaseResolver(),
   *   store: store
   * });
   * m.myDriver([
   *   { ... } // the manager will construct a new source definition from this
   *           // object, automatically adding driverFunc and constructing
   *           // the returns parameter for you.
   * ]);
   */
  constructor({
    id,
    returns,
    meta,
    params,
    optionalParams,
    driverFunc,
    model,
    queryType = GET,
    cacheFor,
  }: SourceDefinitionOpts = {}) {
    if (id === undefined) {
      id = Math.floor(Math.random() * (1 << 30)).toString(16);
    }

    if (typeof returns === 'function') {
      throw new Error(
        'You must pass a concrete return value or object to `returns` ' +
        '(such as Model.item())'
      );
    }

    this.id = id;
    this.providers = new ProviderGroup(returns);
    this.meta = meta;
    this.params = this.constructor.normalizeParams(params);
    this.optionalParams = this.constructor.normalizeParams(optionalParams);
    this.driverFunc = driverFunc;
    // Which CRUD action this refers to
    this.queryType = queryType;
    this.setModelProperty(model);
    this.cacheFor = cacheFor;

    // ensure that after setting properties the definition is valid
    this.validate();
  }

  static normalizeParams(input: ParamsType | ?Array<string> | string): ParamsType {
    if (input === undefined || input === null) {
      return {};
    }

    if (Array.isArray(input)) {
      const result: ParamsType = {};
      input.forEach((val) => { result[val] = undefined; });
      return result;
    }

    if (typeof input === 'string') {
      return { [input]: undefined };
    }

    return input;
  }

  // paramNames returns the keys of `this.params`, ie. required parameter
  // names. Param names are often checked during resolution, therefore this
  // memoization should shave off some CPU cycles in lieu of some memory.
  paramNames(): Array<string> {
    if (this._paramNames !== undefined) {
      return this._paramNames;
    }
    this._paramNames = Object.keys(this.params);
    return this._paramNames;
  }

  optionalParamNames(): Array<string> {
    if (this._optionalParamNames !== undefined) {
      return this._optionalParamNames;
    }
    this._optionalParamNames = Object.keys(this.optionalParams);
    return this._optionalParamNames;
  }

  // addDefaultParams adds missing params and optionalParams to a query
  // given the defaults provided in the source definition.
  addDefaultParams(q: Query) {
    // eslint-disable-next-line
    q.params = assignDefaultParams(this, q.params);
  }

  /**
   * setModelProperty is called in the source definition constructor to set and
   * noramlize from the source definition, if necessary.
   *
   * this.model is used in the resolver to calculate satisfiability
   */
  setModelProperty(model: ?Class<Model> | ?Array<Class<Model>>) {
    if (model === undefined || model === null) {
      this.model = this.providers.models();
      return;
    }

    if (Array.isArray(model)) {
      this.model = model;
      return;
    }

    this.model = [model];
  }

  /**
   * Returns true if this source definition fetches more than one model at
   * a time
   */
  isPolymorphic(): boolean {
    return this.providers.isPolymorphic();
  }

  validate() {
    const chain = [
      this.validateRequiredKeys,
      this.validateReturns,
      this.validateQueryType,
    ];
    chain.forEach(f => f());
  }

  validateRequiredKeys = () => {
    if (this.providers === undefined || this.meta === undefined) {
      throw new Error('Source definitions must contain keys: returns, meta', this);
    }
  }

  validateReturns = () => {
    if (this.queryType === 'GET' && this.providers.returnsNone) {
      throw new Error('Source definitions must contain `returns` key for GET queries', this);
    }
    return;
  }

  validateQueryType = () => {
    const { queryType } = this;
    if (queryType !== GET && queryType !== CREATE &&
        queryType !== UPDATE && queryType !== DELETE) {
      throw new Error(
          'You must specify the type of query using one of GET, CREATE, ' +
          'UPDATE or DELETE'
        );
    }
  }
}

// assignDefaultParams returns a copy of queryParams with defaults assigned
// from the given source definition's params and optionalParams.
export function assignDefaultParams(source: SourceDefinition, queryParams: ParamsType): ParamsType {
  const copy = { ...queryParams };

  source.paramNames().forEach((p) => {
    if (source.params[p] !== undefined && copy[p] === undefined) {
      copy[p] = source.params[p];
    }
  });
  source.optionalParamNames().forEach((p) => {
    if (source.optionalParams[p] !== undefined && copy[p] === undefined) {
      copy[p] = source.optionalParams[p];
    }
  });

  return { ...copy };
}

