'use strict';

import { assert } from 'chai';

import Query, { GET, CREATE, UPDATE, DELETE } from '/src/query';
import { User } from '/test/models.js';
import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns.js';


describe('query', () => {

  describe('constructor', () => {
    it('throws an error when querying for non-existent model fields', () => {
      assert.throws(
        () => new Query({ model: User, fields: ['foo'] }),
        'All fields must be defined within your model. Missing: foo'
      );
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

  });

});
