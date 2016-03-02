'use strict';

import { assert } from 'chai';
import { sources } from '../loadManager';
import { User } from '../models';

describe('source definitions', () => {

  describe('validation', () => {
    it('throws an error when a driver accepts no parameters', () => {
      assert.throws(
        () => sources.fromMock(),
        'Source definitions must be defined in an array'
      );
    });

    it('throws an error if we provide a non-array', () => {
      assert.throws(
        () => sources.fromMock({}),
        'Source definitions must be defined in an array'
      );
    });

    it('throws an error when objects miss required fields', () => {
      assert.throws(
        () => sources.fromMock([{}]),
        'Source definitions must contain keys: returns, meta'
      );

      // No returns
      assert.throws(
        () => sources.fromMock([{meta: {}}]),
        'Source definitions must contain keys: returns, meta'
      );

      // No meta
      assert.throws(
        () => sources.fromMock([{returns: {}}]),
        'Source definitions must contain keys: returns, meta'
      );
    });

    it('throws an error if you pass a function as the `returns` value', () => {
      // FYI, you should call User.item() which is shorthand for all user
      // attributes
      assert.throws(
        () => sources.fromMock([{meta: {}, returns: User.item }]),
        'You must pass a concrete return value or object to `returns` ' +
        '(such as Model.item())'
      );
    });
  });

  describe('storing definitions', () => {
  });

});
