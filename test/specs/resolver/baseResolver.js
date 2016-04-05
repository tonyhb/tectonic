'use strict';

import { assert } from 'chai';
import sinon from 'sinon';

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

    const resolveAllManager = () => {
      const m = createNewManager();
      m.fromMock([
        {
          params: 'id',
          returns: User.item(),
          meta: {}
        },
        {
          params: ['start', 'limit'],
          returns: User.list(),
          meta: {}
        }
      ]);
      return m;
    }

    it('checks the cache to see if data exists for a query', () => {
      const m = resolveAllManager();
      m.addQuery(User.getItem({ id: 1 }));
      const spy = sinon.spy(m.resolver.cache, 'getQueryData');
      m.resolve();
      assert(spy.called);
    });

    it('checks the cache to see if a request is in-flight for a current query', () => {
      const m = resolveAllManager();
      m.addQuery(User.getItem({ id: 1 }));
      const spy = sinon.spy(m.resolver.cache, 'getQueryStatus');
      m.resolve();
      assert(spy.called);
    });

    xit('calls driver functions for newly resolved sources', () => {
    });

    it('dispatches statuses', () => {
      const m = resolveAllManager();
      m.addQuery(User.getItem({ id: 1 }));
      const spy = sinon.spy(m.resolver.store, 'dispatch');
      m.resolve();
      assert(spy.called);
    });
  });

});
