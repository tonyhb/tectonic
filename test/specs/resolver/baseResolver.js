'use strict';

import { assert } from 'chai';
import sinon from 'sinon';

import { createNewManager } from '/test/manager';
import { User, Post } from '/test/models';
import Query from '/src/query';
import BaseResolver from '/src/resolver/baseResolver.js';
import { PENDING, SUCCESS, ERROR, UNDEFINED_PARAMS } from '/src/status';
import { GET, CREATE, UPDATE, DELETE } from '/src/consts';

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
                success(
                  { id: 1, name: 'foo', email: 'foo@bar.com' },
                  { headers: { 'cache-control': 'max-age=3600' } }
                );
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

    describe('caching', () => {

      it('checks the cache to see if the query has expired', () => {
        const m = resolveAllManager();
        m.addQuery(User.getItem({ id: 1 }));
        const spy = sinon.spy(m.resolver.cache, 'hasQueryExpired');
        m.resolve();
        assert.isTrue(spy.called);
      });

      it('if the query has expired doesnt get query data', () => {
        const m = resolveAllManager();
        const q = User.getItem({ id: 1 })
        assert.isTrue(m.resolver.cache.hasQueryExpired(q, m.store.getState().tectonic));
        const spy = sinon.spy(m.resolver.cache, 'getQueryData');
        m.addQuery(q);
        m.resolve();
        assert.isFalse(spy.called);
      });

      it('checks the cache to see if a request is in-flight for a current query', () => {
        const m = resolveAllManager();
        m.addQuery(User.getItem({ id: 1 }));
        const spy = sinon.spy(m.resolver.cache, 'getQueryStatus');
        m.resolve();
        assert(spy.called);
      });

      describe('parseCacheHeaders', () => {

        it('cache-control', () => {
          const r = new BaseResolver();
          const date = r.parseCacheHeaders({ 'cache-control': 'max-age=60' });
          const now = new Date();
          // Assert that the cache-control date is within 200ms of what we
          // expect
          assert.approximately(
            date.getTime(),
            new Date(now.getTime() + (60 * 1000)).getTime(),
            200
          );
        });

      });

      it('stores cache information for a query', (done) => {
        const m = resolveAllManager();
        const q = User.getItem({ id: 1 })
        m.addQuery(q);
        m.resolve();

        window.setTimeout(() => {
          const expires = m.store.getState().tectonic.getIn(['queriesToExpiry', q.toString()])
          assert.isDefined(expires);
          assert.isTrue(expires > new Date());
          done();
        }, 1500);
      });

      it('uses cached query data where possible', (done) => {
        const m = resolveAllManager();
        let q = User.getItem({ id: 1 })

        m.addQuery(q);
        m.resolve();

        window.setTimeout(() => {
          let q = User.getItem({ id: 1 })

          const expirySpy = sinon.spy(m.resolver.cache, 'hasQueryExpired');
          const queryDataSpy = sinon.spy(m.resolver.cache, 'getQueryData');
          m.addQuery(q);
          m.resolve();
          assert.isTrue(expirySpy.called);
          assert.isTrue(queryDataSpy.called);

          done();
        }, 1500);
      });

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
        assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), PENDING);
        window.setTimeout(() => {
          assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), SUCCESS);
        }, 2000);
      });

      it('sets unresolvable queries to failed', () => {
        const m = resolveAllManager();
        // This resolves in 1sec
        const q = Post.getItem({ id: 1 })
        m.addQuery(q);
        m.resolve();
        assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), ERROR);
      });

      it('sets queries with undefined params to UNDEFINED_PARAMS', () => {
        const m = resolveAllManager();
        // This resolves in 1sec
        const q = User.getItem({ id: undefined })
        m.addQuery(q);
        m.resolve();
        assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), UNDEFINED_PARAMS);
      });
    });
  });

  describe('non-GET queries', () => {

    it('doesnt use a CREATE query which returns an Item for a GET query', () => {
      const m = createNewManager();
      m.fromMock([{
        queryType: CREATE,
        returns: User.item(),
        params: ['id'],
        meta: {},
      }]);
      // This query, apart from the queryType, should match exactly the source
      // above.
      const q = User.getItem({ id: 1});
      m.addQuery(q);
      m.resolve();
      assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), ERROR);
    });

    it('doesnt use GET for a CREATE query', () => {
      const m = createNewManager();
      m.fromMock([{
        queryType: GET,
        returns: User.item(),
        meta: {
          returns: {}
        },
      }]);
      const q = new Query({
        model: User,
        queryType: CREATE,
        body: {
          email: 'foo@example.com',
          name: 'Foo McBar'
        }
      });
      m.addQuery(q);
      m.resolve();
      assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), ERROR);
    });

    it('calls a CREATE query successfully', () => {
      const m = createNewManager();
      m.fromMock([{
        queryType: CREATE,
        returns: User.item(),
        meta: {
          returns: {
            id: '1',
            email: 'foo@example.com',
            name: 'Foo McBar'
          }
        },
      }]);
      const q = new Query({
        model: User,
        queryType: CREATE,
        body: {
          email: 'foo@example.com',
          name: 'Foo McBar'
        }
      });
      m.addQuery(q);
      m.resolve();
      assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), SUCCESS);
    });

    it('calls an UPDATE query (http PUT/PATCH depending on driver) with params', () => {
      const m = createNewManager();
      m.fromMock([
        // Add two definitions so we can ensure it uses the correct one.
        {
          id: 'fail',
          queryType: UPDATE,
          params: 'foo', // incorrect param
          returns: User.item(),
          meta: {
            returns: {
              id: '1'
            }
          },
        },
        {
          id: 'ok',
          queryType: UPDATE,
          params: 'id', // valid param; this source should be used
          returns: User.item(),
          meta: {
            returns: {
              id: '1'
            }
          },
        },
      ]);
      const q = new Query({
        model: User,
        queryType: UPDATE,
        params: {
          id: 1
        },
        body: {
          email: 'foo@example.com',
          name: 'Foo McBar'
        }
      });
      m.addQuery(q);
      m.resolve();
      assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), SUCCESS);
      assert.equal(q.sourceDefinition.id, 'ok');
    });

  });

  describe('callbacks', () => {
    const m = createNewManager();
    m.fromMock([
      {
        returns: User.item(),
        params: 'id',
        meta: {
          returns: {
            id: '1'
          }
        }
      },
      {
        returns: User.list(),
        meta: {} // This will fail as a driver error as we provide no returns
      },
      {
        queryType: UPDATE,
        params: 'foo', // incorrect param
        returns: User.item(),
        meta: {
          returns: {
            id: '1'
          }
        },
      }
    ]);

    it('calls callbacks on success', () => {
      let q = User.getItem({ id: 1 });
      q.callback = () => {};
      const spy = sinon.spy(q, 'callback');
      m.addQuery(q);
      m.resolve();
      assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), SUCCESS);
      assert(spy.withArgs(null, { id: '1' }).calledOnce);
    });


    it('calls callbacks on unresolvable error', () => {
      let q = Post.getItem({ id: 1 });
      q.callback = () => {};
      const spy = sinon.spy(q, 'callback');
      m.addQuery(q);
      m.resolve();
      assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), ERROR);
      assert(spy.withArgs('There is no source definition which resolves the query', null).calledOnce);
    });

    it('calls callbacks on driver error', () => {
      let q = User.getList();
      q.callback = () => {};
      const spy = sinon.spy(q, 'callback');
      m.addQuery(q);
      m.resolve();
      assert.equal(m.store.getState().tectonic.getIn(['status', q.hash()]), ERROR);
      assert(spy.withArgs('either pass success/fail state in query params or provide meta.returns', null).calledOnce);
    });
  });

});
