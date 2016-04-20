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

    describe('caching', () => {
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
