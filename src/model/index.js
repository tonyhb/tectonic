'use strict';

import React from 'react';
import relationships from './relationships.js';
import Returns, {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '../sources/returns.js';

export default function(fields) {

  if (typeof fields != 'object') {
    throw new Error('A model must contain fields');
  }

  /**
   * NewModel represents a class for a single model type.
   *
   * The class has static properties for model-specific data such as:
   * - declaring model relationships
   * - accessing model data such as available fields/attirbutes
   *
   * The class has instance methods for instance-specific data. This refers to
   * a concrete instance of a particular model, for example "user 1".
   */
  let model = class Model {
    constructor(data) {
      // @TODO: add data to this specific model
    }

    static fields = () => Object.keys(fields)
    static relationships = () => relationships(this, arguments)

    /**
     * Loads a single resource via the list of sources available
     */
    static getItem = () => {
      // @TODO: Load a single item
    }
  };

  // Return definitions
  model.item = (fields = RETURNS_ALL_FIELDS) =>
    new Returns(fields, model, RETURNS_ITEM)

  model.list = (fields = RETURNS_ALL_FIELDS) =>
    new Returns(fields, model, RETURNS_LIST)

  /**
   * instanceOf is shorthand for `PropTypes.instanceOf(Model)`.
   */
  model.instanceOf = React.PropTypes.instanceOf(model);

  return model;
}
