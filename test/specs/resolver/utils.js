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

  });

});
