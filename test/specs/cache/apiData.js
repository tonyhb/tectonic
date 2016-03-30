'use strict';

import { assert } from 'chai';

import Cache from '/src/cache';
import SourceDefinition from '/src/sources/definition';
import Returns, {
  RETURNS_LIST,
  RETURNS_ITEM,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns';
// test stuff
import { User, Post } from '/test/models';

describe('parsing cache data', () => {
  const cache = new Cache();

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
        cache._parseReturnsData(sd.returns, User, apiResponse, time),
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
        cache._parseReturnsData(sd.returns, User, apiResponse, time),
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
        () => cache._parseReturnsData(sd.returns, User, apiResponse),
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
        () => cache._parseReturnsData(sd.returns, User, apiResponse),
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
        cache.parseApiData(sd, apiResponse, time),
        expected
      );
    });
  });

});
