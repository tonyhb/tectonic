'use strict';

import { assert } from 'chai';
import Model from '/src/model';
import { User } from '/test/models';
import React, { Component } from 'react';
import { GET } from '/src/consts';
import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns';

import { render } from '/test/utils';

describe('Model', () => {

  it('throws an error if created without any fields', () => {
    assert.throws(() => Model('name'), 'A model must contain fields');
  });

  it('throws an error if created without a name', () => {
    assert.throws(
      () => new Model('', { id: 0 }),
      'A model must be defined with a name'
    );
  });

  it('instance has a name', () => {
    let name = 'TestModel';
    let a = new Model(name, {
      id: 0
    });

    assert.equal(name, a.modelName);
  });

  it('stores field definitions from the constructor', () => {
    let a = new Model('StoresTest', {
      id: 0,
      name: ''
    });
    assert.deepEqual(a.fields(), ['id', 'name']);
  });

  describe('getList', () => {
    it('adds params', () => {
      let query = User.getList({ id: 1 });
      assert.deepEqual(query.params, { id: 1 });
    });

    it('adds GET queryType', () => {
      let query = User.getList({ id: 1 });
      assert.equal(query.queryType, GET);
    });

    it('adds RETURNS_LIST returnType and RETURNS_ALL_FIELDS', () => {
      let query = User.getList({ id: 1 });
      assert.equal(query.returnType, RETURNS_LIST);
      assert.equal(query.fields, RETURNS_ALL_FIELDS);
    });

    it('adds fields if specified', () => {
      let query = User.getList(['name'], { id: 1 });
      assert.deepEqual(query.fields, ['name']);
    });
  });

  describe('getItem', () => {
    it('adds params', () => {
      let query = User.getItem({ id: 1 });
      assert.deepEqual(query.params, { id: 1 });
    });

    it('adds GET queryType', () => {
      let query = User.getItem({ id: 1 });
      assert.equal(query.queryType, GET);
    });

    it('adds RETURNS_ITEM returnType and RETURNS_ALL_FIELDS', () => {
      let query = User.getItem({ id: 1 });
      assert.equal(query.returnType, RETURNS_ITEM);
      assert.equal(query.fields, RETURNS_ALL_FIELDS);
    });

    it('adds fields if specified', () => {
      let query = User.getItem(['name'], { id: 1 });
      assert.equal(query.returnType, RETURNS_ITEM);
      assert.deepEqual(query.fields, ['name']);
    });
  });

  /**
   * Return methods are used within sources to describe which models (and fields
   * of that model) API endpoints return
   */ 
  describe('returns methods', () => {
  });

});
