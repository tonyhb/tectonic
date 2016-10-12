'use strict';

import { assert } from 'chai';

import { User } from '../../models.js';
import Provider from '../../../src/sources/provider.js';
import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '../../../src/consts';

describe('provider', () => {

  describe('validation', () => {
    it('throws an error if you pass anything but a string or array', () => {
      assert.throws(
        () => new Provider(User, 1, RETURNS_ITEM)
        `Unknown field type`
      );
      assert.throws(
        () => new Provider(User, {}, RETURNS_ITEM)
        `Unknown field type`
      );

      // Test User.item
      assert.throws(
        () => User.item(1)
        `Unknown field type`
      );
      assert.throws(
        () => User.item({})
        `Unknown field type`
      );
    });

    // If you say that a source returns fields which aren't in the model we
    // should throw an error
    it('throws an error if we pass non-existent fields', () => {
      assert.throws(
        () => User.item('nonexistent'),
        `All fields must be defined within your model. ` +
        `Missing: nonexistent`
      );
    });

  });

});
