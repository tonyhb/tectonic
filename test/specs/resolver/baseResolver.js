'use strict';

import { assert } from 'chai';
import sinon from 'sinon';

import { createNewManager } from '/test/manager';
import BaseResolver from '/src/resolver/baseResolver.js';
import { User, Post } from '/test/models';
import { PENDING, SUCCESS, ERROR, UNDEFINED_PARAMS } from '/src/status';

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
          meta: {
            returns: (success) => {
              window.setTimeout(() => {
                success({ id: 1, name: 'foo', email: 'foo@bar.com' });
              }, 1000);
            }
          }
        },
        {
          params: ['start', 'limit'],
          returns: User.list(),
          meta: {}
        },
        {
          params: 'userId',
          meta: {},
          returns: Post.list()
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

    describe('statuses', () => {
      it('sets statuses with params and sourcedefs to pending and success after resolving', () => {
        const m = resolveAllManager();
        // This resolves in 1sec
        const q = User.getItem({ id: 1 })
        m.addQuery(q);
        m.resolve();
        assert(m.store.getState().tectonic.getIn(['status', q.hash()]), PENDING);
        window.setTimeout(() => {
          assert(m.store.getState().tectonic.getIn(['status', q.hash()]), SUCCESS);
        }, 2000);
      });

      it('sets unresolvable queries to failed', () => {
        const m = resolveAllManager();
        // This resolves in 1sec
        const q = Post.getItem({ id: 1 })
        m.addQuery(q);
        m.resolve();
        assert(m.store.getState().tectonic.getIn(['status', q.hash()]), ERROR);
      });

      it('sets queries with undefined params to UNDEFINED_PARAMS', () => {
        const m = resolveAllManager();
        // This resolves in 1sec
        const q = User.getItem({ id: undefined })
        m.addQuery(q);
        m.resolve();
        assert(m.store.getState().tectonic.getIn(['status', q.hash()]), UNDEFINED_PARAMS);
      });
    });
  });

});
