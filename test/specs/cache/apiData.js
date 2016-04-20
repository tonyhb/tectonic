'use strict';

import { assert } from 'chai';

import Cache from '/src/cache';
import SourceDefinition from '/src/sources/definition';
import Returns from '/src/sources/returns';
import {
  RETURNS_ITEM,
  RETURNS_LIST,
  RETURNS_ALL_FIELDS
} from '/src/consts';
// test stuff
import { User, Post } from '/test/models';
import { createStore } from '/test/manager';

describe('parsing cache data', () => {
  const cache = new Cache(createStore());

  describe('_parseReturnsData', () => {

    it('parses a Return of RETURNS_ITEM correctly', () => {
      const sd = new SourceDefinition({
        returns: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_ITEM),
        meta: {}
      });
      const apiResponse = {
        id: 1,
        name: 'foo',
        email: 'foo@bar.com'
      };
      const time = new Date();

      const expected = {
        1: {
          data: apiResponse,
          cache: { time }
        }
      };
      assert.deepEqual(
        cache._parseReturnsData(User.getItem(), sd.returns, User, apiResponse, time),
        expected
      );
    });

    it('parses a Return of RETURNS_LIST correctly', () => {
      const sd = new SourceDefinition({
        returns: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_LIST),
        meta: {}
      });
      const apiResponse = [
        {
          id: 1,
          name: 'foo',
          email: 'foo@bar.com'
        },
        {
          id: 2,
          name: 'baz',
          email: 'baz@bar.com'
        },
      ];
      const time = new Date();

      const expected = {
        1: {
          data: apiResponse[0],
          cache: { time }
        },
        2: {
          data: apiResponse[1],
          cache: { time }
        }
      };
      assert.deepEqual(
        cache._parseReturnsData(User.getList(), sd.returns, User, apiResponse, time),
        expected
      );
    });

    it('throws an error parsing a RETURNS_ITEM when an array is passed', () => {
      // This returns an item therefore the API response should be an object.
      const sd = new SourceDefinition({
        returns: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_ITEM),
        meta: {}
      });
      const apiResponse = [{
        id: 1,
        name: 'foo',
        email: 'foo@bar.com'
      }];

      assert.throws(
        () => cache._parseReturnsData(User.getItem(), sd.returns, User, apiResponse),
        `Data for returning an item must be an object`
      );
    })

    it('throws an error parsing a RETURNS_LIST when an object is passed', () => {
      // This returns an item therefore the API response should be an object.
      const sd = new SourceDefinition({
        returns: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_LIST),
        meta: {}
      });
      const apiResponse = {
        id: 1,
        name: 'foo',
        email: 'foo@bar.com'
      };

      assert.throws(
        () => cache._parseReturnsData(User.getList(), sd.returns, User, apiResponse),
        'Data for returning a list must be an array'
      );
    })

  });

  describe('parseApiData', () => {
    it('parses a polymorphic returns correctly', () => {
      const sd = new SourceDefinition({
        returns: {
          user: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_ITEM),
          posts: new Returns(Post, RETURNS_ALL_FIELDS, RETURNS_LIST),
        },
        meta: {}
      });
      const apiResponse = {
        user: {
            id: 1,
            name: 'foo',
            email: 'foo@bar.com'
          },
        posts: [
          {
            id: 1,
            title: 'some post'
          },
          {
            id: 2,
            title: 'On the mechanics of economic development'
          },
        ]
      };
      const time = new Date();

      const expected = {
        User: {
          1: {
            data: apiResponse.user,
            cache: { time }
          }
        },
        Post: {
          1: {
            data: apiResponse.posts[0],
            cache: { time }
          },
          2: {
            data: apiResponse.posts[1],
            cache: { time }
          },
        }
      };
      assert.deepEqual(
        cache.parseApiData(Post.getList(), sd, apiResponse, time),
        expected
      );
    });
  });

  describe('sets Query.returnedIds', () => {
    it('with a single non-polymorphic query and return', () => {
      const sd = new SourceDefinition({
        returns: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_ITEM),
        meta: {}
      });
      const apiResponse = {
        id: 1,
        name: 'foo',
        email: 'foo@bar.com'
      };
      let query = User.getItem()
      assert.deepEqual([], query.returnedIds);
      cache.parseApiData(query, sd, apiResponse);
      assert.deepEqual(['1'], query.returnedIds);
    });

    it('with a polymorphic query and return', () => {
      const sd = new SourceDefinition({
        returns: {
          user: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_ITEM),
          posts: new Returns(Post, RETURNS_ALL_FIELDS, RETURNS_LIST),
        },
        meta: {}
      });
      const apiResponse = {
        user: {
            id: 1,
            name: 'foo',
            email: 'foo@bar.com'
          },
        posts: [
          {
            id: 1,
            title: 'some post'
          },
          {
            id: 2,
            title: 'On the mechanics of economic development'
          },
        ]
      };

      // With a query for the user
      let query = User.getItem()
      assert.deepEqual([], query.returnedIds);
      cache.parseApiData(query, sd, apiResponse);
      assert.deepEqual(['1'], query.returnedIds);

      query = Post.getList()
      assert.deepEqual([], query.returnedIds);
      cache.parseApiData(query, sd, apiResponse);
      assert.deepEqual(['1', '2'], query.returnedIds);
    });
  });

  it('getQueryData queries data correctly', () => {
    const store = createStore();
    const cache = new Cache(store);
    const query = User.getItem({ id: 1 });
    const sd = new SourceDefinition({
      returns: new Returns(User, RETURNS_ALL_FIELDS, RETURNS_ITEM),
      meta: {}
    });
    const apiResponse = {
      id: 1,
      name: 'foo',
      email: 'foo@bar.com'
    };
    const time = new Date();

    // Store data and set up state
    cache.storeApiData(query, sd, apiResponse);

    const state = store.getState().tectonic;

    assert.deepEqual(state.getIn(['queriesToIds', query.hash()]), ['1']);

    const [data, ok] = cache.getQueryData(query, state);
    assert.isTrue(ok);
    assert.deepEqual(data, apiResponse);
  });

});
