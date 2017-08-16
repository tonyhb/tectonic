'use strict';

import { assert } from 'chai';
import SourceDefinition from '../../../src/sources/definition.js';
import Query from '../../../src/query';
import Model from '../../../src/model';
import { User, Post } from '../../models';
import { GET, UPDATE, CREATE, DELETE, RETURNS_NONE } from '../../../src/consts';

describe('SourceDefinition', () => {

  describe('constructor', () => {
    it('automatically assigns queryType of GET if it doesnt exist', () => {
      const sd = new SourceDefinition({
        meta: {},
        returns: User.item()
      });
      assert.equal(sd.queryType, GET);
    });

    it('allows Provider to be undefined when the queryType is DELETE', () => {
      const sd = new SourceDefinition({
        meta: {},
        queryType: DELETE
      });
      assert.equal(sd.providers.returnsNone, true);
    });
  });

  describe('normalizeParams', () => {
    it('normalizes an array of params to an object of undefined default values', () => {
      const input = ['a', 'b'];
      const expected = {a: undefined, b: undefined};
      assert.deepEqual(SourceDefinition.normalizeParams(input), expected);
    });

    it('converts a string', () => {
      const input = 'a';
      const expected = {a: undefined};
      assert.deepEqual(SourceDefinition.normalizeParams(input), expected);
    });
  });

  describe('addDefaultParams', () => {
    it('adds required params to a query', () => {
      // minimum required constructor opts
      const params = {
        foo: 'ruffleburg',
      };

      const q = new Query({ model: User, queryType: 'GET' });
      const sd = new SourceDefinition({
        meta: {},
        returns: User.item(),
        params,
      });

      assert.deepEqual(q.params, {});
      sd.addDefaultParams(q);
      assert.deepEqual(q.params, params);
    });

    it('adds optional params to a query', () => {
      // minimum required constructor opts
      const params = {
        foo: 'ruffleburg',
      };

      const q = new Query({ model: User, queryType: 'GET' });
      const sd = new SourceDefinition({
        meta: {},
        returns: User.item(),
        optionalParams: params,
      });

      assert.deepEqual(q.params, {});
      sd.addDefaultParams(q);
      assert.deepEqual(q.params, params);
    });
  });

  describe('validation', () => {
    it('throws an error when objects miss required fields', () => {
      assert.throws(
        () => new SourceDefinition({}),
        'Source definitions must contain keys: returns, meta'
      );
      // No returns
      assert.throws(
        () => new SourceDefinition({meta: {}}),
        'Source definitions must contain `returns` key for GET queries'
      );
      // No meta
      assert.throws(
        () => new SourceDefinition({returns: {}}),
        'Source definitions must contain keys: returns, meta'
      );
    });

    it('throws an error if returns is ommited for GET queryType', () => {
      assert.throws(
        () => new SourceDefinition({
          meta: {},
          queryType: GET
        }),
        'Source definitions must contain `returns` key for GET queries'
      );
    });

    it('throws an error with an unknown query type', () => {
      assert.throws(
        () => new SourceDefinition({
          meta: {},
          queryType: 'fuck you'
        }),
        'You must specify the type of query using one of GET, CREATE, ' +
        'UPDATE or DELETE'
      );
    });
  });

  describe('id generation', () => {
    it('generates a new ID if an ID isnt defined', () => {
      const def = new SourceDefinition({
        returns: User.item(),
        meta: {}
      });
      assert.isDefined(def.id);
    });

    it('uses an existing ID if defined within constructor', () => {
      const def = new SourceDefinition({
        id: 'foo',
        returns: User.item(),
        meta: {}
      });
      assert.equal(def.id, 'foo');
    });
  });

  describe('param normalization', () => {
    it('turns params into an object', () => {
      const def = new SourceDefinition({
        params: ['id'],
        returns: User.item(),
        meta: {}
      });
      assert.deepEqual(def.params, {'id': undefined});
    });

    it('turns optionalParams into an object', () => {
      const def = new SourceDefinition({
        optionalParams: ['id'],
        returns: User.item(),
        meta: {}
      });
      assert.deepEqual(def.optionalParams, {'id': undefined});
    });
  });

  describe('setModelProperty', () => {
    it('sets model from single returns', () => {
      const def = new SourceDefinition({
        meta: {},
        returns: User.item(),
      });
      assert.deepEqual(def.model, [User]);
    });

    it('sets .model from polymorphic returns', () => {
      const def = new SourceDefinition({
        meta: {},
        returns: {
          users: User.item(),
          posts: Post.list(),
        },
      });
      assert.deepEqual(def.model, [User, Post]);
    });

    it('sets .model from constructor opts', () => {
      let def = new SourceDefinition({
        meta: {},
        queryType: DELETE,
        model: [User],
      });
      assert.deepEqual(def.model, [User]);

      def = new SourceDefinition({
        meta: {},
        queryType: DELETE,
        model: User,
      });
      assert.deepEqual(def.model, [User]);
    });
  });

});
