'use strict';

import { assert } from 'chai';
import React, { Component, PropTypes } from 'react';
import TestUtils from 'react-addons-test-utils';
import { renderAndFind } from '/test/utils';

import load from '/src/decorator';
import * as status from '/src/status';

// Data
import { User, Post } from '/test/models';

describe('@load: status props', () => {

  it('it injects status into this.props', (done) => {
    class Base extends Component {
      static propTypes = {
        status: PropTypes.object,
        user: User.instanceOf
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

    const WrappedBase = load({
      user: User.getItem({ id: 1 }),
      post: Post.getItem({ id: 1 }),
    })(Base);
    const item = renderAndFind(<WrappedBase />, Base);

    assert.isDefined(item);
    assert.isObject(item.props.status);

    // TODO: Remove timeout within decorator/index.addAndResolveQueries
    window.setTimeout(() => {
      // Right now we've not defined a sourcedefinition, so this should error
      assert.isDefined(item.props.status.user);
      assert.equal(item.props.status.user, status.ERROR);
      assert.equal(item.props.status.post, status.ERROR);
      done();
    }, 10);
  });

});
