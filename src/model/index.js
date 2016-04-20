'use strict';

import React from 'react';
import relationships from './relationships.js';
import Returns, {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns.js';
import Query from '/src/query';
import { GET } from '/src/consts';

export default function(name, fields, opts = {}) {

  if (!name) {
    throw new Error('A model must be defined with a name');
  }

  if (typeof fields !== 'object') {
    throw new Error('A model must contain fields');
  }

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
    constructor(data) {
      // @TODO: add data to this specific model
      console.log('TODO: Add data to model instance');
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
     */
    static blank() {
      return {
        ...fields,
        [this.idAttribute]: undefined
      };
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
