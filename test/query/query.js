'use strict';

import { assert } from 'chai';

import Query from '../../src/query.js';
import { User } from '../models.js';
import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '../../src/sources/returns.js';


describe('query', () => {

  describe('constructor', () => {
    it('throws an error when querying for non-existent model fields', () => {
      assert.throws(
        () => new Query(User, ['foo']),
        'All fields must be defined within your model. Missing: foo'
      );
    });
  });

  describe('.is', () => {
    it('returns true with two equal queries', () => {
      let q1, q2;

      // Returning a subset of fields
      q1 = new Query(User, ['name'], RETURNS_ITEM, { id: 1 });
      q2 = new Query(User, ['name'], RETURNS_ITEM, { id: 1 });
      assert.isTrue(q1.is(q2));

      // All fields
      q1 = new Query(User, RETURNS_ALL_FIELDS, RETURNS_ITEM, { id: 1 });
      q2 = new Query(User, RETURNS_ALL_FIELDS, RETURNS_ITEM, { id: 1 });
      assert.isTrue(q1.is(q2));

      // No params
      q1 = new Query(User, RETURNS_ALL_FIELDS, RETURNS_LIST);
      q2 = new Query(User, RETURNS_ALL_FIELDS, RETURNS_LIST);
      assert.isTrue(q1.is(q2));
    });

    it('returns false with mismatching fields', () => {
      let q1, q2;

      // Returning a subset of fields
      q1 = new Query(User, ['name'], RETURNS_ITEM, { id: 1 });
      q2 = new Query(User, ['email'], RETURNS_ITEM, { id: 1 });
      assert.isFalse(q1.is(q2));

      q1 = new Query(User, RETURNS_ALL_FIELDS, RETURNS_ITEM, { id: 1 });
      q2 = new Query(User, ['email'], RETURNS_ITEM, { id: 1 });
      assert.isFalse(q1.is(q2));
    });

    it('returns false with mismatching return types', () => {
      let q1, q2;

      q1 = new Query(User, ['name'], RETURNS_ITEM, { id: 1 });
      q2 = new Query(User, ['name'], RETURNS_LIST, { id: 1 });
      assert.isFalse(q1.is(q2));
    });

    it('returns false with mismatching params', () => {
      let q1, q2;

      q1 = new Query(User, ['name'], RETURNS_ITEM, { id: 1 });
      q2 = new Query(User, ['name'], RETURNS_ITEM, { id: 2 });
      assert.isFalse(q1.is(q2));

      q1 = new Query(User, ['name'], RETURNS_ITEM, { id: 1 });
      q2 = new Query(User, ['name'], RETURNS_ITEM, { id: 1, name: 'foo' });
      assert.isFalse(q1.is(q2));
    });

  });

});
