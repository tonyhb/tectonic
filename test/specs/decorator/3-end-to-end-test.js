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
    assert.isDefined(manager.resolver.definitionsByModel.get(User));

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

    assert.equal(item.props.status.user, status.SUCCESS);
    assert.deepEqual(item.props.user, data);

  });

});
