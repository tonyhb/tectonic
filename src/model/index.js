'use strict';

import React from 'react';
import { Record } from 'immutable';

import relationships from './relationships.js';
import Returns from '/src/sources/returns.js';
import Query from '/src/query';
import {
  GET,
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/consts';

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
  'toObject'
];

export default function(name, fields, opts = {}) {

  if (!name) {
    throw new Error('A model must be defined with a name');
  }

  if (typeof fields !== 'object') {
    throw new Error('A model must contain fields');
  }

  // Create a new immutable record which is the basis for storing data within
  // our model. 
  const BaseRecord = new Record(fields, name); 

  /**
   * NewModel represents a class for a single model type.
   *
   * The class has static properties for model-specific data such as:
   * - declaring model relationships
   * - accessing model data such as available fields/attributes
   *
   * The class has instance methods for instance-specific data. This refers to
   * a concrete instance of a particular model, for example "user 1".
   */
  let model = class Model {

    /**
     * Set during construction, this is the immutable record which backs storing
     * attributes for the model instance
     *
     */
    record;

    /**
     * constructor is called when we create a new instance of the model with
     * data:
     *
     * let currentUser = new User({ id: 1 });
     *
     * We need to add our data to baseRecord, and define setters and getters for
     * each field within this model.
     */
    constructor(data) {
      if (data instanceof BaseRecord) {
        // This allows us to create copies of the model from immutableJS record
        // methods.
        this.record = data;
      } else {
        // Set data normally, such as new User({ id: 1 });
        this.record = new BaseRecord(data);
      }

      this.constructor.fields().forEach(field => {
        setProp(this, field);
      });

      // For each immutableJS record method create a function which proxies the
      // call to the immutableJS record then creates a new model instance with
      // the resulting record
      recordMethods.forEach(method => {
        this[method] = function() {
          let record = this.record[method].apply(this.record, arguments);
          return new this.constructor(record);
        }.bind(this);
        this.toJS = function() {
          return this.record.toJS.apply(this.record, arguments);
        }
      });
    }

    values() {
      return this.record.toObject()
    }

    // Define a getter for modelName so that it can't be changed after definition
    static get modelName() { return name }

    // Define a method on the class to get the ID attribute. This
    // defaults to 'id' and is used for storing and looking up data in the
    // store.
    //
    // Note: ALL queries must return the ID attribute.
    static get idAttribute() { return opts.idAttribute || 'id'; }


    /**
     * Blank returns a copy of the fields as they are defined in the model.
     * Note that the idAttriute is *always* undefined
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
      return new this(new BaseRecord({ [this.idAttribute]: undefined }));
    }

    static fields() { return Object.keys(fields); }
    static relationships() { return relationships(this, arguments); }

    /**
     * Ensures that all fields in the given array exist within the model
     *
     * @param array
     */
    static assertFieldsExist(fields = []) {
      if (fields === RETURNS_ALL_FIELDS) {
        return;
      }

      const modelFields = this.fields();

      // Ensure that all fields are defined within our model
      const missing = fields.reduce((missing, field) => {
        if (modelFields.indexOf(field) === -1) {
          missing.push(field);
        }
        return missing;
      }, []);

      if (missing.length > 0) {
        throw new Error(
          `All fields must be defined within your model. Missing: ` +
          missing.join(', ')
        );
      }
    }

  };

  // Return definitions
  model.item = (fields = RETURNS_ALL_FIELDS) =>
    new Returns(model, fields, RETURNS_ITEM)

  model.list = (fields = RETURNS_ALL_FIELDS) =>
    new Returns(model, fields, RETURNS_LIST)

  model.getItem = (fields, params) => {
    // In this case we're only passing in parameters to getItem:
    // User.getItem({ id: 1 });
    if (params === undefined) {
      [fields, params] = [RETURNS_ALL_FIELDS, fields];
    }
    return new Query({
      model,
      fields,
      params,
      queryType: GET,
      returnType: RETURNS_ITEM
    });
  };

  model.getList = (fields, params) => {
    // In this case we're only passing in parameters to getList:
    // User.getList({ id: 1 });
    if (params === undefined) {
      [fields, params] = [RETURNS_ALL_FIELDS, fields];
    }
    return new Query({
      model,
      fields,
      params,
      queryType: GET,
      returnType: RETURNS_LIST
    });
  };


  /**
   * instanceOf is shorthand for `PropTypes.instanceOf(Model)`.
   */
  model.instanceOf = React.PropTypes.instanceOf(model);

  return model;
}

function setProp(prototype, name) {
  Object.defineProperty(prototype, name, {
    get: function() {
      return this.record.get(name);
    },
    set: function(value) {
      throw new Error('Cannot set on an immutable model.');
    }
  });
}
