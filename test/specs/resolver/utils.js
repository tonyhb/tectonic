'use strict';

import { assert } from 'chai';

import * as utils from '/src/resolver/utils';
import SourceDefinition from '/src/sources/definition';
import Query from '/src/query';
import Returns, {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns.js';

import { User } from '/test/models';

describe('resolver utils', () => {

  describe('doesSourceSatisfyQueryParams', () => {

    it('returns true when there are no params',  () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {}
      });
      const q = new Query(
        User,
        RETURNS_ALL_FIELDS,
        RETURNS_ITEM
      );
      assert.isTrue(utils.doesSourceSatisfyQueryParams(s, q));
    });

    it('returns true when the the source and query have the same params',  () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {},
        params: ['id']
      });
      const q = new Query(
        User,
        RETURNS_ALL_FIELDS,
        RETURNS_ITEM,
        { id: 1 }
      );
      assert.isTrue(utils.doesSourceSatisfyQueryParams(s, q));
    });

    it('returns true when all required parameters are passed without optional params', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {},
        params: ['id'],
        optionalParams: ['limit']
      });
      const q = new Query(
        User,
        RETURNS_ALL_FIELDS,
        RETURNS_ITEM,
        {
          id: 1
        }
      );
      assert.isTrue(utils.doesSourceSatisfyQueryParams(s, q));
    });

    it('returns true when all required parameters are passed with optional params', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {},
        params: ['id'],
        optionalParams: ['limit']
      });
      const q = new Query(
        User,
        RETURNS_ALL_FIELDS,
        RETURNS_ITEM,
        {
          id: 1,
          limit: 10
        }
      );
      assert.isTrue(utils.doesSourceSatisfyQueryParams(s, q));
    });

    it('returns false when only optional parameters are passed', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {},
        params: ['id'],
        optionalParams: ['limit']
      });
      const q = new Query(
        User,
        RETURNS_ALL_FIELDS,
        RETURNS_ITEM,
        {
          limit: 10
        }
      );
      assert.isFalse(utils.doesSourceSatisfyQueryParams(s, q));
    });
  });

  describe('doesSourceSatisfyAllQueryFields', () => {
    it('returns true when source returns all and query returns a subset',  () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {}
      });
      const q = new Query(
        User,
        ['name'],
        RETURNS_ITEM
      );
      assert.isTrue(utils.doesSourceSatisfyAllQueryFields(s, q));
    });

    it('returns false when source returns subet and query needs all', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(['name']),
        meta: {}
      });
      const q = new Query(
        User,
        RETURNS_ALL_FIELDS,
        RETURNS_ITEM
      );
      assert.isFalse(utils.doesSourceSatisfyAllQueryFields(s, q));
    });

    it('returns true when source returns same subset to query', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(['id']),
        meta: {}
      });
      const q = new Query(
        User,
        ['id'],
        RETURNS_ITEM
      );
      assert.isTrue(utils.doesSourceSatisfyAllQueryFields(s, q));
    });

    it('returns false when source returns different subset to query', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(['name']),
        meta: {}
      });
      const q = new Query(
        User,
        ['id'],
        RETURNS_ITEM
      );
      assert.isFalse(utils.doesSourceSatisfyAllQueryFields(s, q));
    });
  });

  describe('doesSourceSatisfyQueryReturnType', () => {
    it('returns false if the query returns a list and the source returns an item', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {}
      });
      const q = new Query(
        User,
        ['id'],
        RETURNS_LIST
      );
      assert.isFalse(utils.doesSourceSatisfyQueryReturnType(s, q));
    });
  });
});
