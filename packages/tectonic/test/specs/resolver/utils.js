'use strict';

import { assert } from 'chai';

import * as utils from '../../../src/resolver/utils';
import SourceDefinition from '../../../src/sources/definition';
import Query from '../../../src/query';
import Provider from '../../../src/sources/provider.js';
import {
  GET, UPDATE, CREATE, DELETE,
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '../../../src/consts';
import { User, Post } from '../../models';

describe('resolver utils', () => {

  describe('doesSourceSatisfyQueryParams', () => {

    it('returns true when there are no params',  () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {}
      });
      const q = new Query({
        model: User,
        fields: RETURNS_ALL_FIELDS,
        returnType: RETURNS_ITEM
      });
      assert.isTrue(utils.doesSourceSatisfyQueryParams(s, q));
    });

    it('returns true when the the source and query have the same params',  () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {},
        params: ['id']
      });
      const q = new Query({
        model: User,
        fields: RETURNS_ALL_FIELDS,
        returnType: RETURNS_ITEM,
        params: { id: 1 },
      });
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
      const q = new Query({
        model: User,
        fields: RETURNS_ALL_FIELDS,
        returnType: RETURNS_ITEM,
        params: { id: 1 },
      });
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
      const q = new Query({
        model: User,
        fields: RETURNS_ALL_FIELDS,
        returnType: RETURNS_ITEM,
        params: {
          id: 1,
          limit: 10
        },
      });
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
      const q = new Query({
        model: User,
        fields: RETURNS_ALL_FIELDS,
        returnType: RETURNS_ITEM,
        params: { limit: 10 }
      });
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
      const q = new Query({
        model: User,
        fields: ['name'],
        returnType: RETURNS_ITEM
      });
      assert.isTrue(utils.doesSourceSatisfyAllQueryFields(s, q));
    });

    it('returns false when source returns subet of fields and query needs all', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(['name']),
        meta: {}
      });
      const q = new Query({
        model: User,
        fields: RETURNS_ALL_FIELDS,
        returnType: RETURNS_ITEM
      });
      assert.isFalse(utils.doesSourceSatisfyAllQueryFields(s, q));
    });

    it('returns true when source returns same subset as query', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(['id']),
        meta: {}
      });
      const q = new Query({
        model: User,
        fields: ['id'],
        returnType: RETURNS_ITEM
      });
      assert.isTrue(utils.doesSourceSatisfyAllQueryFields(s, q));
    });

    it('returns false when source returns different subset to query', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(['name']),
        meta: {}
      });
      const q = new Query({
        model: User,
        fields: ['id'],
        returnType: RETURNS_ITEM
      });
      assert.isFalse(utils.doesSourceSatisfyAllQueryFields(s, q));
    });

    it('works with polymorphic queries', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: {
          user: User.item(),
          posts: Post.list()
        },
        params: ['start', 'end'],
        meta: {}
      });
      const q = Post.getList({ start: 1, end: 2 });
      assert.isTrue(utils.doesSourceSatisfyAllQueryFields(s, q));
    });
  });

  describe('doesSourceSatisfyQueryReturnType', () => {
    it('returns false if the query returns a list and the source returns an item', () => {
      const s = new SourceDefinition({
        id: 1,
        returns: User.item(),
        meta: {}
      });
      const q = new Query({
        model: User,
        fields: ['id'],
        returnType: RETURNS_LIST
      });
      assert.isFalse(utils.doesSourceSatisfyQueryReturnType(s, q));
    });
  });

  // Which aspect of crud the query represents
  describe('doesSourceSatisfyQueryType', () => {
    // TODO: Test that model.getItem/getList adds GET query type
    it('returns true if queryType matches', () => {
      const s = new SourceDefinition({
        queryType: GET,
        returns: User.item(),
        meta: {}
      });
      const q = User.getItem(1);
      assert.isTrue(utils.doesSourceSatisfyQueryType(s, q));
    });

    it ('returns false with a queryType mismatch', () => {
      let s, q;
      // Get vs Update
      s = new SourceDefinition({
        queryType: UPDATE,
        returns: User.item(),
        meta: {}
      });
      q = User.getItem(1);
      assert.isFalse(utils.doesSourceSatisfyQueryType(s, q));

      // Get vs Create
      s = new SourceDefinition({
        queryType: CREATE,
        returns: User.item(),
        meta: {}
      });
      q = new Query({
        model: User,
        fields: ['id'],
        returnType: RETURNS_ITEM,
        queryType: GET
      });
      assert.isFalse(utils.doesSourceSatisfyQueryType(s, q));
    });

  });

});
