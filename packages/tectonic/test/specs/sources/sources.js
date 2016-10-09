'use strict';

import { assert } from 'chai';
import Sources from '../../../src/sources';
import { User } from '../../models';
import d from '../../mockDriver';

describe('Sources', () => {

  const sources = new Sources();

  describe('processDefinitions validation', () => {
    it('throws an error when a driver accepts no parameters', () => {
      assert.throws(
        () => sources.processDefinitions(d),
        'Source definitions must be defined in an array'
      );
    });

    it('throws an error if we provide a non-array', () => {
      assert.throws(
        () => sources.processDefinitions(d, {}),
        'Source definitions must be defined in an array'
      );
    });

    it('throws an error when objects miss required fields', () => {
      assert.throws(
        () => sources.processDefinitions(d, [{}]),
        'Source definitions must contain keys: returns, meta'
      );

      // No returns
      assert.throws(
        () => sources.processDefinitions(d, [{meta: {}}]),
        'Source definitions must contain keys: returns, meta'
      );

      // No meta
      assert.throws(
        () => sources.processDefinitions(d, [{returns: {}}]),
        'Source definitions must contain keys: returns, meta'
      );
    });

    it('throws an error if you pass a function as the `returns` value', () => {
      // FYI, you should call User.item() which is shorthand for all user
      // attributes
      assert.throws(
        () => sources.processDefinitions(d, [{meta: {}, returns: User.item }]),
        'You must pass a concrete return value or object to `returns` ' +
        '(such as Model.item())'
      );
    });
  });

  describe('storing definitions', () => {
  });

});
