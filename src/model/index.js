'use strict';

import React from 'react';
import relationships from './relationships.js';
import Returns, {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns.js';
import Query from '/src/query';

export default function(name, fields) {

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
      console.log('creating');
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
    return new Query(model, fields, RETURNS_ITEM, params);
  };

  model.getList = (fields, params) => {
    // In this case we're only passing in parameters to getList:
    // User.getList({ id: 1 });
    if (params === undefined) {
      [fields, params] = [RETURNS_ALL_FIELDS, fields];
    }
    return new Query(model, fields, RETURNS_LIST, params);
  };

  // Define a getter for modelName so that it can't be changed after definition
  Object.defineProperty(model, 'modelName', { get() { return name } });


  /**
   * instanceOf is shorthand for `PropTypes.instanceOf(Model)`.
   */
  model.instanceOf = React.PropTypes.instanceOf(model);

  return model;
}
