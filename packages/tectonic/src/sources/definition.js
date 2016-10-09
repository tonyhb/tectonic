// @flow

import ProviderGroup from './providerGroup';
import Provider from './provider';
import {
  GET, CREATE, UPDATE, DELETE,
} from '../consts';

import type {
  QueryType,
} from '../consts';
import type Model from '../model';

type ConstructorOpts = {
  id: string;
  returns: Provider | { [key: string]: Provider } | ?string;
  meta: Object;
  params: ?Array<string>;
  optionalParams: ?Array<string>;
  driverFunc: Function;

  // model may be explicitly set for non-GET queries; otherwise, for GET queries
  // this is typically resolved from the Returns parameter
  model: ?Class<Model>;
  queryType: QueryType;
};

/**
 * A source definition is a concrete definition for an API call or endpoint
 * which returns data for the app.
 *
 */
export default class SourceDefinition {
  id: string
  meta: Object
  returns: ProviderGroup
  model: Array<Class<Model>>
  driverFunc: Function
  queryType: QueryType

  /**
   * Array of **required** parameters for the source.
   * These can be query parameters, postdata or parameters for URL replacement.
   */
  params: Array<string>

  /**
   * Array of optional parameters for the source
   */
  optionalParams: Array<string>

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
  }: ConstructorOpts = {}) {
    if (id === undefined) {
      id = Math.floor(Math.random() * (1 << 30)).toString(16);
    }

    this.id = id;
    this.returns = new ProviderGroup(returns);
    this.meta = meta;
    this.params = params || [];
    this.optionalParams = optionalParams || [];
    this.driverFunc = driverFunc;
    // Which CRUD action this refers to
    this.queryType = queryType;
    this.setModelProperty(model);

    if (typeof this.params === 'string') {
      this.params = [this.params];
    }
    if (typeof this.optionalParams === 'string') {
      this.optionalParams = [this.optionalParams];
    }

    // ensure that after setting properties the definition is valid
    this.validate();
  }

  /**
   * setModelProperty is called in the source definition constructor to set and
   * noramlize from the source definition, if necessary.
   *
   * this.model is used in the resolver to calculate satisfiability
   */
  setModelProperty(model: ?Class<Model> | ?Array<Class<Model>>) {
    if (model === undefined || model === null) {
      this.model = this.returns.models();
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
    return this.returns.isPolymorphic();
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
    if (this.returns === undefined || this.meta === undefined) {
      throw new Error('Source definitions must contain keys: meta, returns', this);
    }
  }

  validateReturns = () => {
    if (this.queryType === 'GET' && this.returns.returnsNone) {
      throw new Error('Source definition must contain `returns` key for GET queries', this);
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
