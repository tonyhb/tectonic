'use strict';

import { assert } from 'chai';
import SourceDefinition from '../../src/sources/definition.js';
import { User } from '../models';

describe('SourceDefinition', () => {

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

});
