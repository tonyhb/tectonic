'use strict';

import { assert } from 'chai';
import Model from '../../src/model/index.js';
import { User } from '../models';
import React, { Component } from 'react';

import { render } from '../utils';

describe('Model', () => {

  it('throws an error if created without any fields', () => {
    assert.throws(() => Model(), 'A model must contain fields');
  });

  it('stores field definitions from the constructor', () => {
    let a = Model({
      id: 0,
      name: ''
    });
    assert.deepEqual(a.fields(), ['id', 'name']);
  });


  /**
   * Return methods are used within sources to describe which models (and fields
   * of that model) API endpoints return
   */ 
  describe('returns methods', () => {
    it('throws an error if you pass anything but a string or array', () => {
      assert.throws(
        () => User.item(1),
        `Unknown field type`
      );

      assert.throws(
        () => User.item({}),
        `Unknown field type`
      );
    });

    // If you say that a source returns fields which aren't in the model we
    // should throw an error
    it('throws an error if we pass non-existent fields', () => {
      assert.throws(
        () => User.item('nonexistent'),
        `All return fields must be defined within your model. ` +
        `Missing: nonexistent`
      );
    });

  });

});
