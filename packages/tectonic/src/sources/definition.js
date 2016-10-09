import Returns from './returns';
import {
  GET, CREATE, UPDATE, DELETE,
  RETURNS_NONE,
} from '../consts';

/**
 * These keys are required in every source definition
 */
const requiredDefinitionKeys = ['returns', 'meta'];

/**
 * A source definition is a concrete definition for an API call or endpoint
 * which returns data for the app.
 *
 */
export default class SourceDefinition {
  id = undefined

  meta = undefined
  returns = undefined

  model = undefined

  /**
   * Array of **required** parameters for the source.
   * These can be query parameters, postdata or parameters for URL replacement.
   */
  params = undefined

  /**
   * Array of optional parameters for the source
   */
  optionalParams = undefined

  driverFunc = undefined

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
   *
   * @param {string} o.id - unique ID of source definition; randomly generated if
   * ommitted
   * @param {(Returns|Object)} o.returns - instance of Returns or object of
   * many Returns as values
   * @param {Object} o.meta - object containing unique source driver functionality
   * @param {Array} o.params - array of **required** parameters for the API call
   * @param {Array} o.optionalParams - array of optional params for the API call
   * @param {Function} o.driverFunc - driver function to call to invoke the source
   * @param {string} o.queryType - the type of query (GET, UPDATE, CREATE, DELETE)
   * @param {Model} o.model - the model class which this API references
   */
  constructor({ id, returns, meta, params, optionalParams, driverFunc, queryType = GET, model }) {
    if (id === undefined) {
      id = Math.floor(Math.random() * (1 << 30)).toString(16);
    }

    // If the queryType is UPDATE, CREATE or DELETE (ie. not GET) then the
    // server *is* allowed to respond with 204 no content. This means that
    // `returns` can be undefined for non-GET queries; we must automatically
    // transform this into RETURNS_NONE.
    if (queryType !== GET && returns === undefined) {
      returns = RETURNS_NONE;
    }

    this.id = id;
    // XXX Potentially create a parent class for polymorphic returns so it's not
    // a POJO
    this.returns = returns;
    this.model = model;
    this.meta = meta;
    this.params = params || [];
    this.optionalParams = optionalParams || [];
    this.driverFunc = driverFunc;
    // Which CRUD action this refers to
    this.queryType = queryType;
    this.setModelProperty();

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
  setModelProperty() {
    const { model, returns } = this;

    if (model !== undefined && model.idField !== undefined) {
      // The user specified a `model` type in the source definition but didn't
      // enclose it in an array.
      this.model = [model];
      return;
    }

    if (Array.isArray(model)) {
      // this.model is already a normalized array of models that the source
      // definition uses
      return;
    }

    if (returns === undefined || returns === RETURNS_NONE) {
      // we can't calculate the model that this source definition uses, so we
      // bail out
      return;
    }

    // If models aren't explicitly defined (ie. GET source definitions can list
    // a `returns` property, not a `model` property) we take it from returns
    if (returns instanceof Returns) {
      this.model = [returns.model];
      return;
    }

    if (returns !== undefined) {
      // polymorphic returns; extract all models this source returns
      this.model = Object.keys(returns).map(k => returns[k].model);
    }
  }

  /**
   * Returns true if this source definition fetches more than one model at
   * a time
   */
  isPolymorphic() {
    return this.returns !== RETURNS_NONE && !(this.returns instanceof Returns);
  }

  validate() {
    const chain = [
      ::this.validateRequiredKeys,
      ::this.validateReturns,
      ::this.validateQueryType,
    ];
    chain.forEach(f => f());
  }

  validateRequiredKeys() {
    if (requiredDefinitionKeys.some(i => this[i] === undefined)) {
      throw new Error(
        `Source definitions must contain keys: ${
        requiredDefinitionKeys.join(', ')}`,
        this
      );
    }
  }

  validateReturns() {
    const { returns, queryType } = this;

    if (queryType !== GET && returns === RETURNS_NONE) {
      return;
    }

    // If this is a single Returns instance this is valid
    if (returns instanceof Returns) {
      return;
    }

    // Otherwise this should be an object in which all values are Returns
    // instances
    if (typeof returns !== 'object') {
      throw new Error(
        'You must pass a concrete return value or object to `returns` ' +
        '(such as Model.item())'
      );
    }

    Object.keys(returns).forEach((item) => {
      if (!(returns[item] instanceof Returns)) {
        throw new Error(
          'You must pass a concrete return value or object to `returns` ' +
          '(such as Model.item())'
        );
      }
    });

    return;
  }

  validateQueryType() {
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
