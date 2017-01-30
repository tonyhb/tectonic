'use strict';

import { assert } from 'chai';
import Model from '../../../src/model';
import { User, Post } from '../../models';
import React, { Component } from 'react';
import Provider from '../../../src/sources/provider';
import {
  GET,
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '../../../src/consts';

import { render } from '../../utils';

describe('Model', () => {

  it('provides the model class from the constructor', () => {
    let a = new User();
    assert.equal(a.constructor, User);
  })

  it('throws an error if created without a name', () => {
    assert.throws(() => {
      class Foo extends Model {};
      const bar = new Foo();
    }, 'Models must have a static modelName property defined');
  });

  it('throws an error if created without fields', () => {
    assert.throws(() => {
      class Foo extends Model {
        static modelName = 'foo';
      };
      const bar = new Foo();
    }, 'Models must have fields defined with default values');
  });

  it('instance has a name', () => {
    let name = 'TestModel';
    class A extends Model {
      static modelName = name;
      static fields = {
        id: 0
      };
    };
    assert.equal(name, A.modelName);
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
      let query = User.getList({ id: 1 }, ['name']);
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
      let query = User.getItem({ id: 1 }, ['name']);
      assert.equal(query.returnType, RETURNS_ITEM);
      assert.deepEqual(query.fields, ['name']);
    });
  });

  /**
   * Return methods are used within sources to describe which models (and fields
   * of that model) API endpoints return
   */ 
  describe('returns methods', () => {
    describe('getItem', () => {
      it('throws an error without a modelName attribute', () => {
        class Foo extends Model{}
        assert.throws(
          () => Foo.item(),
          'models must have a static modelName attribute defined',
        );
      });

      it('returns a provider with type RETURNS_ITEM', () => {
        const expected = new Provider(User, RETURNS_ALL_FIELDS, RETURNS_ITEM);
        assert.deepEqual(expected, User.item());
      });
    });

    describe('getList', () => {
      it('throws an error without a modelName attribute', () => {
        class Foo extends Model{}
        assert.throws(
          () => Foo.list(),
          'models must have a static modelName attribute defined',
        );
      });

      it('returns a provider with type RETURNS_LIST', () => {
        const expected = new Provider(User, RETURNS_ALL_FIELDS, RETURNS_LIST);
        assert.deepEqual(expected, User.list());
      });
    });
  });

  it('has an instanceOf class prop', () => {
    assert.isDefined(User.instanceOf)
    assert.equal(User.instanceOf(User), React.PropTypes.instanceOf(User)(User))
    assert.equal(User.instanceOf(true), React.PropTypes.instanceOf(User)(true))
    assert.equal(Post.instanceOf(User), React.PropTypes.instanceOf(Post)(User))
  });

});
