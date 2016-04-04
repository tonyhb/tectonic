'use strict';

import { assert } from 'chai';
import React, { Component, PropTypes } from 'react';
import TestUtils from 'react-addons-test-utils';

import load from '/src/decorator';
import * as status from '/src/status';

// test
import { User, Post } from '/test/models';
import { createNewManager } from '/test/manager';
import { renderAndFind } from '/test/utils';

describe('@load: e2e end-to-end test', () => {

  it('queries a single model on a non-polymorphic source', () => {
    // This is the data returned from the API and should be within the
    // components props.
    const data = {
      id: 1,
      name: 'works',
      email: 'some@example.com'
    };

    const manager = createNewManager();
    // Define sources for loading data.
    manager.fromMock([
      {
        id: 'userSource',
        meta: {
          // The mock driver is set up to return whatever is in meta.returns
          // (after checking query params)
          returns: data
        },
        params: ['id'],
        returns: User.item()
      }
    ]);

    assert.isDefined(manager.sources.definitions.get('userSource'));

    class Base extends Component {
      static propTypes = {
        status: PropTypes.object,
        user: PropTypes.object
      }

      render() {
        const { user } = this.props;
        // We inject a `status` prop which is an object containing loading
        // states for all props specified within @load
        if (this.props.status.user === status.PENDING) {
          return <p>Loading...</p>;
        }
        return <p>{ this.props.user.name }</p>
      }
    }

    // This lets us ascertain whether the returnedIds was filled correctly,
    // plus inspect the store based on the query.
    let query = User.getItem({ id: 1 });

    const WrappedBase = load({
      user: query
    })(Base);
    const item = renderAndFind(<WrappedBase />, Base, manager);

    // The resolver doesn't start resolving until 5 ms in
    window.setTimeout(() => {
      assert.equal(item.props.status.user, status.SUCCESS);
      assert.deepEqual(item.props.user, data);
    }, 5);
  });


  it('queries a single model on a polymorphic source', () => {
    // This is the data returned from the API and should be within the
    // components props.
    const data = {
      user: {
        id: 1,
        name: 'works',
        email: 'some@example.com'
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

    const manager = createNewManager();
    // Define sources for loading data.
    manager.fromMock([
      {
        meta: {
          // The mock driver is set up to return whatever is in meta.returns
          // (after checking query params)
          returns: data
        },
        params: ['start', 'end'],
        returns: {
          user: User.item(),
          posts: Post.list()
        }
      }
    ]);

    class Base extends Component {
      static propTypes = {
        status: PropTypes.object,
        posts: PropTypes.array
      }

      render() {
        return <p>stuff</p>;
      }
    }

    // This lets us ascertain whether the returnedIds was filled correctly,
    // plus inspect the store based on the query.
    let query = Post.getList({ start: 1, end: 2 });

    const WrappedBase = load({
      posts: query
    })(Base);
    const item = renderAndFind(<WrappedBase />, Base, manager);

    window.setTimeout(() => {
      assert.equal(item.props.status.posts, status.SUCCESS);
      assert.deepEqual(item.props.posts, data.posts);
    }, 10);
  });

  it('queries with dependent data based off of a previous API call', () => {
    // This is the data returned from the API and should be within the
    // components props.
    const data = {
      user: {
        id: 1,
        name: 'works',
        email: 'some@example.com'
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

    const manager = createNewManager();
    // Define sources for loading data.
    manager.fromMock([
      {
        meta: {
          returns: data.user
        },
        returns: User.item(),
      },
      {
        meta: {
          returns: data.posts
        },
        params: ['userID'],
        returns: Post.list(),
      }
    ]);

    class Base extends Component {
      static propTypes = {
        status: PropTypes.object,
        posts: PropTypes.array
      }

      render() {
        return <p>stuff</p>;
      }
    }
    const WrappedBase = load((state, props) => ({
      user: User.getItem(),
      posts: Post.getList({ userID: props.user && props.user.id })
    }))(Base);
    const item = renderAndFind(<WrappedBase />, Base, manager);

    window.setTimeout(() => {
      assert.deepEqual(item.props.posts, data.posts);
    }, 10);
  });
});
