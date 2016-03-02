'use strict';

import { assert } from 'chai';
import React, { Component, PropTypes } from 'react';
import load from '../../src/load';
import { renderAndFind } from '../utils';

// Data
import { User } from '../models';

describe('@load: data loading', () => {

  describe('single models', () => {

    it('loads single models when opts is an object', () => {

      class Base extends Component {
        static propTypes = {
          status: PropTypes.object,
          user: User.instanceOf
        }

        render() {
          const { status, user } = this.props;
          // We inject a `loading` prop which is an object containing loading
          // states for all props specified within @load
          if (status.user === "PENDING") {
            return <p>Loading...</p>;
          }
          return <p>{ this.props.user.name }</p>
        }
      }

      const WrappedBase = load({ user: User.getItem({ id: 1 }) })(Base);
      const item = renderAndFind(<WrappedBase />, Base);

      assert.isDefined(item);
      assert.isObject(item.props.status);
      assert.isObject(item.props.user);
    });

  });

});
