'use strict';

import { assert } from 'chai';
import React, { Component, PropTypes } from 'react';
import Status from '../../../src/status/status';
import load from '../../../src/decorator';
import TestUtils from 'react-addons-test-utils';
import { createNewManager } from '../../manager';
import { User, Post } from '../../models';
import { renderAndFind } from '../../utils';

describe('@load: query func using redux state', () => {
  // This is the data returned from the API and should be within the
  // components props.
  const data = {
    id: 1,
    name: 'works',
    email: 'some@example.com'
  };

  it('should allow the query func inside @load to use state to create queries', (done) => {
    const manager = createNewManager();
    // Define sources for loading data.
    manager.drivers.fromMock([
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
    // Create some redux state so that we can test @load((props, state) => ({}))
    manager.store.dispatch({
      type: 'MISC',
      payload: { user: 'foo' }
    });

    class Base extends Component {
      static propTypes = {
        status: PropTypes.object,
        user: PropTypes.object
      }
      render() {
        const { user } = this.props;
        if (this.props.status.user.isPending()) {
          return <p>Loading...</p>;
        }
        return <p>{ this.props.user.name }</p>
      }
    }

    const WrappedBase = load((props, state) => {
      // assert we can see state
      assert.deepEqual(state.misc, { user: 'foo' } );

      // asser that after a valid query, new state is passed into @load
      if (props.status) {
        assert.isTrue(props.status.user.isSuccess());
        assert.deepEqual(state.tectonic.toJS().data.user['1'].data, data);
      }

      return {
        user: User.getItem({ id: state.misc.user }),
      };
    })(Base);
    const item = renderAndFind(<WrappedBase />, Base, manager);

    assert.isDefined(item);
    window.setTimeout(() => {
      done();
    }, 15);
  });

});
