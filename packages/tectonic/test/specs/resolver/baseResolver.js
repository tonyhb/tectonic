'use strict';

import { assert } from 'chai';
import sinon from 'sinon';

import { createNewManager } from '../../manager';
import { User, Post } from '../../models';
import Query from '../../../src/query';
import BaseResolver from '../../../src/resolver/baseResolver.js';
import { GET, CREATE, UPDATE, DELETE } from '../../../src/consts';

describe('BaseResolver', () => {
  describe('addQuery', () => {

    it('adds queries to .queries', () => {
      const m = createNewManager();
      const q = User.getItem();

      assert.equal(Object.keys(m.resolver.queries).length, 0);
      m.addQuery(q);
      assert.equal(Object.keys(m.resolver.queries).length, 1);
      assert.isDefined(m.resolver.queries[q.hash()]);
      assert.deepEqual(m.resolver.queries[q.hash()], q);
    });

  });

  describe('resolveAll', () => {

    const resolveAllManager = () => {
      const m = createNewManager();
      m.drivers.fromMock([
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
              }, 50);
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
        },
        // Set up an endpoint that has default optional parameters
        {
          params: ['withDefault'],
          optionalParams: {
            'foo': 'bar',
          },
          returns: User.item(),
          meta: {
            returns: (success) => {
              success(
                { id: 1, name: 'foo', email: 'withdefault@foo.com' },
                { headers: { 'cache-control': 'max-age=3600' } }
              );
            },
          }
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
        }, 75);
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
        }, 75);
      });

      it('uses cache with default params foodd', () => {
        const m = resolveAllManager();
        // create a query which will be supplemented
        const query = User.getItem({ withDefault: true });
        const copy = User.getItem({ withDefault: true });
        m.addQuery(query);

        // The queries should start out with the same toString hash as
        // they have the same params right now - defaults haven't been added.
        assert.equal(query.toString(), copy.toString());

        // Set up a spy to ensure that the query status that's saved uses the
        // hash with default parameters.
        const queryStatusSpy = sinon.spy(m.store, 'dispatch');
        // And set up a spy to ensure that the query passed to cache.storeQuery
        // has all default parameters
        const storeQuerySpy = sinon.spy(m.resolver.cache, 'storeQuery');
        m.resolve();

        // Note that after resolving the query should have changed - adding
        // default parameters modifies by reference so that the query within
        // the decorator is also updated.
        assert.isTrue(query.toString() !== copy.toString());
        assert.deepEqual(query.params, { withDefault: true, foo: 'bar' });
        assert.isTrue(query.toString().indexOf('"foo":"bar"') > 0);

        // Ensure that the query status stored via the reducer was the query
        // with defaults.
        assert.isTrue(queryStatusSpy.called);
        assert.equal(Object.keys(queryStatusSpy.firstCall.args[0].payload).length, 1);
        assert.equal(Object.keys(queryStatusSpy.firstCall.args[0].payload)[0], query.toString());

        // Ensure that the data store query call uses the updated query.
        assert.isTrue(storeQuerySpy.called);
        assert.equal(storeQuerySpy.firstCall.args[0], query);

        // Ensure that our reducer state is correect.
        const state = m.resolver.store.getState().tectonic;
        const ids = state.getIn(['queriesToIds', query.toString()], new Set());
        const expiry = state.getIn(['queriesToExpiry', query.toString()]);
        assert.equal(ids.size, 1);
        assert.isTrue(ids.has('1'));
        assert.isDefined(expiry);

        // And that the original query isn't saved
        assert.isFalse(state.getIn(['queriesToIds', copy.toString()], new Set()).has('1'));
        assert.isUndefined(state.getIn(['queriesToExpiry', copy.toString()]));

        // Then ensure that requerying for this uses the cached data.
        m.addQuery(User.getItem({ withDefault: true }));
        const skipFromCacheSpy = sinon.spy(m.resolver, 'skipFromCache');
        m.resolve();

        // The skip call should be called twice: one for the orignial query
        // without default params and once with.
        assert.isTrue(skipFromCacheSpy.calledTwice);
        assert.equal(skipFromCacheSpy.firstCall.returnValue, false);
        // the second time it should return true to use the cached version
        assert.equal(skipFromCacheSpy.secondCall.returnValue, true);

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
        assert.deepEqual(m.store.getState().tectonic.getIn(['status', q.hash()]), { status: 'PENDING' });
        window.setTimeout(() => {
          assert.deepEqual(m.store.getState().tectonic.getIn(['status', q.hash()]), { status: 'SUCCESS' });
        }, 2000);
      });

      it('sets unresolvable queries to failed', () => {
        const m = resolveAllManager();
        // This resolves in 1sec
        const q = Post.getItem({ id: 1 })
        m.addQuery(q);
        m.resolve();
        assert.deepEqual(
          m.store.getState().tectonic.getIn(['status', q.hash()]),
          { status: 'ERROR', error: 'There is no source definition which resolves the query' }
        );
      });

      it('sets queries with undefined params to UNDEFINED_PARAMS', () => {
        const m = resolveAllManager();
        // This resolves in 1sec
        const q = User.getItem({ id: undefined })
        m.addQuery(q);
        m.resolve();
        assert.deepEqual(m.store.getState().tectonic.getIn(['status', q.hash()]), { status: 'UNDEFINED_PARAMS' });
      });
    });
  });

  describe('non-GET queries', () => {

    it('doesnt use a CREATE query which returns an Item for a GET query', () => {
      const m = createNewManager();
      m.drivers.fromMock([{
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
      assert.deepEqual(
        m.store.getState().tectonic.getIn(['status', q.hash()]),
        { status: 'ERROR', error: 'There is no source definition which resolves the query' }
      );
    });

    it('doesnt use GET for a CREATE query', () => {
      const m = createNewManager();
      m.drivers.fromMock([{
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
      assert.deepEqual(
        m.store.getState().tectonic.getIn(['status', q.hash()]),
        { status: 'ERROR', error: 'There is no source definition which resolves the query' }
      );
    });

    it('calls a CREATE query successfully', () => {
      const m = createNewManager();
      m.drivers.fromMock([{
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
      assert.deepEqual(m.store.getState().tectonic.getIn(['status', q.hash()]), { status: 'SUCCESS' });
    });

    it('calls an UPDATE query (http PUT/PATCH depending on driver) with params', () => {
      const m = createNewManager();
      m.drivers.fromMock([
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
      assert.deepEqual(m.store.getState().tectonic.getIn(['status', q.hash()]), { status: 'SUCCESS' });
      assert.equal(q.sourceDefinition.id, 'ok');
    });

  });

  describe('callbacks', () => {
    const m = createNewManager();
    m.drivers.fromMock([
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
      assert.deepEqual(m.store.getState().tectonic.getIn(['status', q.hash()]), { status: 'SUCCESS' });
      assert(spy.withArgs(null, { id: '1' }).calledOnce);
    });


    it('calls callbacks on unresolvable error', () => {
      let q = Post.getItem({ id: 1 });
      q.callback = () => {};
      const spy = sinon.spy(q, 'callback');
      m.addQuery(q);
      m.resolve();
      assert.deepEqual(
        m.store.getState().tectonic.getIn(['status', q.hash()]),
        { status: 'ERROR', error: 'There is no source definition which resolves the query' }
      );
      assert(spy.withArgs('There is no source definition which resolves the query', null).calledOnce);
    });

    it('calls callbacks on driver error', () => {
      let q = User.getList();
      q.callback = () => {};
      const spy = sinon.spy(q, 'callback');
      m.addQuery(q);
      m.resolve();
      assert.deepEqual(
        m.store.getState().tectonic.getIn(['status', q.hash()]),
        {
          status: 'ERROR',
          code: undefined,
          error: 'either pass success/fail state in query params or provide meta.returns',
        });
      assert(spy.withArgs('either pass success/fail state in query params or provide meta.returns', null).calledOnce);
    });
  });

});
