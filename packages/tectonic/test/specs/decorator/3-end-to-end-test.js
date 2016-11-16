'use strict';

import { assert } from 'chai';
import React, { Component, PropTypes } from 'react';
import TestUtils from 'react-addons-test-utils';

import load from '../../../src/decorator';
import Status from '../../../src/status/status';

// test
import { User, Post } from '../../models';
import { createNewManager } from '../../manager';
import { renderAndFind } from '../../utils';

describe('@load: e2e end-to-end test', () => {

  it('queries a single model on a non-polymorphic source', (done) => {
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
        if (this.props.status.user.isPending()) {
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
      assert.deepEqual(item.props.status.user, new Status({ status: 'SUCCESS' }));
      assert.deepEqual(item.props.user.toJS(), data);
      done();
    }, 5);
  });


  it('queries a single model on a polymorphic source', (done) => {
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
      assert.deepEqual(item.props.status.posts, new Status({ status: 'SUCCESS' }));
      // We return models which are not deepEqual to our expected data;
      // iterate through them and turn them into a POJO for comparison
      const posts = item.props.posts.map(i => i.toJS());
      assert.deepEqual(posts, data.posts);
      done();
    }, 10);
  });

  describe('dependent data', () => {
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

    // Define sources for loading data.
    const manager = createNewManager();
    manager.fromMock([
      {
        meta: {
          returns: (success) => {
            window.setTimeout(() => success(data.user), 5);
          }
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


    it('queries with dependent data based off of a previous API call', (done) => {
      class Base extends Component {
        static propTypes = {
          status: PropTypes.object,
          posts: PropTypes.array
        }

        render() {
          return <p>stuff</p>;
        }
      }
      const WrappedBase = load(props => ({
        user: User.getItem(),
        posts: Post.getList({ userID: props.user && props.user.id }),
      }))(Base);
      const item = renderAndFind(<WrappedBase />, Base, manager);

      window.setTimeout(() => {
        // We return models which are not deepEqual to our expected data;
        // iterate through them and turn them into a POJO for comparison
        const posts = item.props.posts.map(i => i.toJS());
        assert.deepEqual(posts, data.posts);
        done();
      }, 50);
    });

    it('computes dependent data when mounted components props change', (done) => {
      // Here we want to assert that a rendered component which uses a dependent
      // data re-fetches when necessary via componentWillReceiveProps.
      class Child extends Component {
        render() { return <p>Yo</p>; }
      }
      const WrappedChild = load((props) => {
        // At the start this should be users; after 20ms we will attempt to load
        // posts
        if (props.dataToLoad === 'user') {
          return {
            user: User.getItem(),
          };
        };
        return {
          posts: Post.getList({ userID: 1 }),
        };
      })(Child);

      // Create a container that will, after 20ms, change prop passed to Child
      // from 'user' to 'posts'
      class Container extends Component {
        state = {
          data: 'user',
        }

        componentDidMount() {
          window.setTimeout(() => this.setState({ data: 'posts' }), 20);
        }

        render() {
          return <WrappedChild dataToLoad={ this.state.data }/>;
        }
      }

      const item = renderAndFind(<Container />, Child, manager);
      assert.isTrue(item.props.status.user.isPending());

      window.setTimeout(() => {
        assert.isFalse(item.props.status.user.isPending());
        assert.isTrue(item.props.status.user.isSuccess());

        assert.isTrue(Object.keys(item.props).indexOf('user') > -1);
        assert.isTrue(Object.keys(item.props).indexOf('posts') === -1);
        assert.deepEqual(item.props.user.values(), data.user);
      }, 10);

      window.setTimeout(() => {
        assert.isTrue(Object.keys(item.props).indexOf('posts') > -1);
        const posts = item.props.posts.map(i => i.toJS());
        assert.deepEqual(posts, data.posts);
        done();
      }, 30)

    });

  });
});
