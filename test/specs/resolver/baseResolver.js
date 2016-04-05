'use strict';

import { assert } from 'chai';

import { createNewManager } from '/test/manager';
import BaseResolver from '/src/resolver/baseResolver.js';
import { User, Post } from '/test/models';

describe('BaseResolver', () => {

  describe('addQuery', () => {

    it('adds queries to .queries', () => {
      const m = createNewManager();
      const q = User.getItem();

      assert.equal(Object.keys(m.resolver.queries).length, 0);
      m.addQuery(q);
      assert.equal(Object.keys(m.resolver.queries).length, 1);
      assert.isDefined(m.resolver.queries[q.hash()]);
      assert.equal(m.resolver.queries[q.hash()], q);
    });

  });

  describe('resolveAll', () => {
    xit('checks the cache to see if data exists for a query', () => {
    });

    xit('checks the cache to see if a request is in-flight for a current query', () => {
    });

    xit('calls driver functions for newly resolved sources', () => {
    });

    xit('dispatches statuses', () => {
    });
  });

});
