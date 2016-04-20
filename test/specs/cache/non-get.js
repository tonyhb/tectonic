'use strict';

import { assert } from 'chai';
import sinon from 'sinon';

import Cache from '/src/cache';
import Query from '/src/query';
import SourceDefinition from '/src/sources/definition';
import Returns from '/src/sources/returns';
import {
  CREATE,
  UPDATE,
  DELETE,
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/consts';
// test stuff
import { User, Post } from '/test/models';
import { createStore } from '/test/manager';

describe('cache for non-GET requests', () => {
  const store = createStore()
  const cache = new Cache(store);
  const spy = sinon.spy(cache, 'cachedQueryIds');

  let query = new Query({
    queryType: CREATE,
    model: User,
    body: {
      id: 1
    }
  });

  it('should never call cachedQueryIds for non-get requests and always returns false', () => {
    // cachedQueryIds is called to determine which data to pull from the cache
    // for any given query. For non-GET queries this should never even be
    // called.
    [CREATE, UPDATE, DELETE].forEach(type => {
      // Set the query type.
      query.queryType = type;
      // Get query data
      const [data, ok] = cache.getQueryData(query, store.getState().tectonic);
      // Ensure cachedQueryIds was never called.
      assert.isFalse(spy.called);
      spy.reset();
      // Assert that the tuple returned [undefined, false]
      assert.isFalse(ok);
      assert.isUndefined(data);
    });
  });

  it('storeApiData should be a no-op with no response data (ie http 204)', () => {
    // ie delete requests shouldn't be kept in the cache - we should only keep
    // the query status in the cache
    //
    // To store data we call dispatch; this should never be called with no api
    // response.
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const sd = new SourceDefinition({
      returns: User.item(),
      meta: {}
    });
    cache.storeApiData(query, sd, undefined);
    assert.isFalse(dispatchSpy.called);
  });

});

// TODO:
// baseResolver should always call non-GET queries.
