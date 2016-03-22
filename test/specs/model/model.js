'use strict';

import { assert } from 'chai';
import Model from '/src/model';
import { User } from '/test/models';
import React, { Component } from 'react';

import { render } from '/test/utils';

describe('Model', () => {

  it('throws an error if created without any fields', () => {
    assert.throws(() => Model(), 'A model must contain fields');
  });

  it('has a meta property', () => {
    let a = new Model('TestModel', {
      id: 0
    });

    assert.property(a, 'meta');
  });

  it('instance has a name', () => {
    let name = 'TestModel';
    let a = new Model(name, {
      id: 0
    });

    assert.equal(name, a.meta.name);
  });

  it('stores field definitions from the constructor', () => {
    let a = new Model('StoresTest', {
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

  });

});
