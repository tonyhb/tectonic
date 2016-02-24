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

});
