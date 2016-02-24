'use strict';

import React from 'react';
import sources from './sources.js';
import relationships from './relationships.js';

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
    static sources = () => sources(this, arguments)
    static relationships = () => relationships(this, arguments)

    /**
     * Loads a single resource via the list of sources available
     */
    static getItem = () => {
      // @TODO: Load a single item
    }
  };

  /**
   * instanceOf is shorthand for `PropTypes.instanceOf(Model)`.
   */
  model.instanceOf = React.PropTypes.instanceOf(model);

  return model;
}
