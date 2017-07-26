'use strict';

import { assert } from 'chai';

import Query from '../../../src/query';
import {
  GET, CREATE, UPDATE, DELETE,
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '../../../src/consts';
import { User } from '../../models.js';


describe('query', () => {

  describe('constructor', () => {
    it('throws an error when querying for non-existent model fields', () => {
      assert.throws(
        () => new Query({ model: User, fields: ['foo'] }),
        'All fields must be defined within your model. Missing: foo'
      );
    });

    it('stores callbacks', () => {
      const cb = () => ({});
      const q = new Query({ model: User, callback: cb });
      assert.deepEqual(q.callback, cb);
    });
  });

  describe('.is', () => {
    it('returns true with two equal queries', () => {
      let q1, q2;
      let common = {
        model: User,
        fields: ['name'],
        queryType : GET,
        returnType: RETURNS_ITEM,
        params: { id: 1 }
      };

      // Returning a subset of fields
      q1 = new Query({ ...common });
      q2 = new Query({ ...common });
      assert.isTrue(q1.is(q2));

      common = {
        ...common,
        fields: RETURNS_ALL_FIELDS
      };

      // All fields
      q1 = new Query({ ...common });
      q2 = new Query({ ...common });
      assert.isTrue(q1.is(q2));

      common = {
        ...common,
        fields: RETURNS_ALL_FIELDS,
        returnType: RETURNS_LIST
      };
      delete common.params;

      // No params
      q1 = new Query({ ...common });
      q2 = new Query({ ...common });
      assert.isTrue(q1.is(q2));
    });

    it('returns false with mismatching fields', () => {
      let q1, q2;
      let common = {
        model: User,
        queryType : GET,
        returnType: RETURNS_ITEM,
        params: { id: 1 }
      };

      // Returning a subset of fields
      q1 = new Query({ ...common, fields: ['name'] });
      q2 = new Query({ ...common, fields: ['email'] });
      assert.isFalse(q1.is(q2));

      q1 = new Query({ ...common, fields: RETURNS_ALL_FIELDS });
      q2 = new Query({ ...common, fields: ['email'] });
      assert.isFalse(q1.is(q2));
    });

    it('returns false with mismatching return types', () => {
      let q1, q2;
      let common = {
        model: User,
        queryType : GET,
        fields: ['name'],
        params: { id: 1 }
      };

      q1 = new Query({ ...common, returnType: RETURNS_ITEM });
      q2 = new Query({ ...common, returnType: RETURNS_LIST });
      assert.isFalse(q1.is(q2));
    });

    it('returns false with mismatching params', () => {
      let q1, q2;
      let common = {
        model: User,
        queryType : GET,
        fields: ['name'],
        returnType: RETURNS_ITEM
      };

      q1 = new Query({ ...common, params: { id: 1 } });
      q2 = new Query({ ...common, params: { id: 2 } });
      assert.isFalse(q1.is(q2));

      q1 = new Query({ ...common, params: { id: 1 } });
      q2 = new Query({ ...common, params: { id: 1, name: 'foo' } });
      assert.isFalse(q1.is(q2));

      q1 = new Query({ ...common, params: { id: 1 } });
      q2 = new Query({ ...common, params: { id: 1 } });
      assert.isTrue(q1.is(q2));
    });

    it('matches queryTypes', () => {
      let q1, q2;
      const common = {
        model: User,
        fields: ['name'],
        returnType: RETURNS_ITEM,
        params: { id: 1 }
      };

      q1 = new Query({ ...common, queryType: GET });
      q2 = new Query({ ...common, queryType: UPDATE });
      assert.isFalse(q1.is(q2));

      q1 = new Query({ ...common, queryType: GET });
      q2 = new Query({ ...common, queryType: GET });
      assert.isTrue(q1.is(q2));

      q1 = new Query({ ...common, queryType: UPDATE });
      q2 = new Query({ ...common, queryType: UPDATE });
      assert.isTrue(q1.is(q2));
    });

    it('matches body', () => {
      let q1, q2;
      const common = {
        model: User,
        queryType: CREATE,
      };

      q1 = new Query({ ...common, body: { foo: 'bar' } });
      q2 = new Query({ ...common, body: { wha: 'the' } });
      assert.isFalse(q1.is(q2));

      q1 = new Query({ ...common, body: { foo: 'bar' } });
      q2 = new Query({ ...common, body: { foo: 'bar' } });
      assert.isTrue(q1.is(q2));
    });

  });

  describe('.filter', () => {
    it('pushes to the end of the filters property', () => {
      const query = User.getItem();
      assert.equal(query.filters.length, 0);
      query.filter(User.getName);
      assert.equal(query.filters.length, 1);
      assert.equal(query.filters[0], User.getName);
      query.filter((name) => name.toUpperCase());
      assert.equal(query.filters.length, 2);
    });
  });

});
