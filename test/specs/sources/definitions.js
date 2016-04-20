'use strict';

import { assert } from 'chai';
import SourceDefinition from '/src/sources/definition.js';
import { User } from '/test/models';
import { GET } from '/src/consts';

describe('SourceDefinition', () => {

  describe('constructor', () => {
    it('automatically assigns queryType of GET if it doesnt exist', () => {
      const sd = new SourceDefinition({
        meta: {},
        returns: User.item()
      });
      assert.equal(sd.queryType, GET);
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
        'Source definitions must contain keys: returns, meta'
      );
      // No meta
      assert.throws(
        () => new SourceDefinition({returns: {}}),
        'Source definitions must contain keys: returns, meta'
      );
    });

    // TODO: Test that RETURNS_NONE is only applicable with non-GET sources
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
    it('turns a single param into an array', () => {
      const def = new SourceDefinition({
        params: 'id',
        returns: User.item(),
        meta: {}
      });
      assert.deepEqual(def.params, ['id']);
    });

    it('turns a single optionalParam into an array', () => {
      const def = new SourceDefinition({
        optionalParams: 'id',
        returns: User.item(),
        meta: {}
      });
      assert.deepEqual(def.optionalParams, ['id']);
    });
  });

});
