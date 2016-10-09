

import React from 'react';
import { Record } from 'immutable';

import Returns from '../sources/returns';
import Query from '../query';
import {
  GET,
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS,
} from '../consts';

// recordMethods defines all immutableJS record methods that we want to
// replicate within our model.
// This will allow us to do things such as:
//
//   let u = new User({ id: 1 });
//   u = u.set({ id: 2 });
//   // u is another User instance with a new immutable record backing attrs
export const recordMethods = [
  'deleteIn',
  'removeIn',
  'merge',
  'mergeWith',
  'mergeIn',
  'mergeDeep',
  'mergeDeepWith',
  'mergeDeepIn',
  'set',
  'setIn',
  'update',
  'updateIn',
  'withMutations',
  'asMutable',
  'asImmutable',
  'toObject',
];

/**
 * modelRecords stores a list of model names to the immutable record class
 */
const modelRecords = {};

function setProp(prototype, name) {
  Object.defineProperty(prototype, name, {
    get() {
      return this.record.get(name);
    },
    set() {
      throw new Error('Cannot set on an immutable model.');
    },
  });
}

export default class Model {
  static modelName;

  static fields;

  static idField = 'id';

  static instanceOf = React.PropTypes.instanceOf(this);

  record;

  constructor(data) {
    const { modelName } = this.constructor;
    let ModelRecord = modelRecords[modelName];

    // Create a new immutable record which is the basis for storing data within
    // our model.
    if (ModelRecord === undefined) {
      ModelRecord = new Record(this.constructor.fields, modelName);
      modelRecords[modelName] = ModelRecord;
    }

    // validation
    if (modelName === undefined) {
      throw new Error('Models must have a static modelName property defined');
    }
    if (typeof this.constructor.fields !== 'object') {
      throw new Error('Models must have fields defined with default values');
    }
    if (this.constructor.fields[this.constructor.idField] === undefined) {
      throw new Error('Must supply an ID field for this model');
    }

    if (data !== undefined) {
      if (data instanceof ModelRecord) {
        // This allows us to create copies of the model from immutableJS record
        // methods.
        this.record = data;
      } else {
        // Set data normally, such as new User({ id: 1 });

        // create new submodels if necessary
        this.constructor.submodelFieldNames().forEach((field) => {
          // TODO: a better way of determining whether something is a model
          // other than values; instanceof this.constructor doesn't work as they
          // may be different models
          if (data[field] !== undefined && data[field].values === undefined) {
            data[field] = new this.constructor.fields[field].constructor(data[field]);
          }
        });

        // Apply per-model filtering before setting data. This lets us rename
        // fields per-model, for example if the API response always includes
        // '.size' which is disallowed using immutable records.
        if (typeof this.constructor.filter === 'function') {
          data = this.constructor.filter(data);
        }

        this.record = new ModelRecord(data);
      }
    } else {
      this.record = new ModelRecord();
    }

    // This creates getters for each field in the model, allowing us to read
    // data from the model record directly
    this.constructor.fieldNames().forEach((field) => {
      setProp(this, field);
    });

    // For each immutableJS record method create a function which proxies the
    // call to the immutableJS record then creates a new model instance with
    // the resulting record.
    recordMethods.forEach((method) => {
      this[method] = function (...args) {
        const record = this.record[method](...args);
        return new this.constructor(record);
      }.bind(this);
    });

    this.toJS = function (...args) {
      return this.record.toJS(...args);
    };
  }

  values() {
    const data = this.record.toObject();
    this.constructor.submodelFieldNames().forEach((field) => {
      data[field] = data[field].values();
    });
    return data;
  }

  unsetId() {
    this.record = this.record.set(this.constructor.idField, undefined);
    return this;
  }

  /**
   * Blank returns a copy of the fields as they are defined in the model.
   * Note that the idField is *always* undefined
   *
   * This is used when evaluating the decorator queries: we need an undefined
   * ID to determine whether calls are dependent.
   *
   * In this example:
   *
   * @load((props, state) => {
   *   a: User.item({ name: state.router.params.name }),
   *   b: Post.item({ authorId: a.id })
   * })
   *
   * query B depends on A being resolved (a.id is undefined).
   *
   * Any time a parameter is undefined within tectonic we assume that it
   * depends on a previous query and can be resolved after they have
   * completed.
   *
   * TODO: should all attributes be undefined? this would skew from
   * immutable's defaults.
   */
  static blank() {
    const model = new this(this.fields).unsetId();
    this.submodelFieldNames().forEach((field) => {
      model.set(field, model[field].unsetId());
    });
    return model;
  }

  static fieldNames() {
    return Object.keys(this.fields);
  }

  /**
   * submodelFieldNames returns an array of fields which have Model data types.
   *
   * @return {Array}
   */
  static submodelFieldNames() {
    if (this.submodelFields !== undefined) {
      return this.submodelFields;
    }

    this.submodelFields = [];

    Object.keys(this.fields).forEach((k) => {
      const item = this.fields[k];
      if (typeof item.values === 'function') {
        this.submodelFields.push(k);
      }
    });

    return this.submodelFields;
  }

  /**
   * Ensures that all fields in the given array exist within the model
   *
   * @param array
   */
  static assertFieldsExist(fields = []) {
    if (fields === RETURNS_ALL_FIELDS) {
      // by default this is true; all fields requires nothing
      // from this predicate
      return;
    }

    const modelFields = this.fieldNames();

    // Ensure that all fields are defined within our model
    const missing = fields.reduce((items, field) => {
      if (modelFields.indexOf(field) === -1) {
        items.push(field);
      }
      return items;
    }, []);

    if (missing.length > 0) {
      throw new Error(
        `All fields must be defined within your model. Missing: ${
        missing.join(', ')}`
      );
    }
  }

  static item(fields = RETURNS_ALL_FIELDS) {
    return new Returns(this, fields, RETURNS_ITEM);
  }

  static list(fields = RETURNS_ALL_FIELDS) {
    return new Returns(this, fields, RETURNS_LIST);
  }

  static getItem(fields, params) {
    // In this case we're only passing in parameters to getItem:
    // User.getItem({ id: 1 });
    if (params === undefined) {
      [fields, params] = [RETURNS_ALL_FIELDS, fields];
    }
    return new Query({
      model: this,
      fields,
      params,
      queryType: GET,
      returnType: RETURNS_ITEM,
    });
  }

  static getList(fields, params) {
    // In this case we're only passing in parameters to getList:
    // User.getList({ id: 1 });
    if (params === undefined) {
      [fields, params] = [RETURNS_ALL_FIELDS, fields];
    }
    return new Query({
      model: this,
      fields,
      params,
      queryType: GET,
      returnType: RETURNS_LIST,
    });
  }
}
