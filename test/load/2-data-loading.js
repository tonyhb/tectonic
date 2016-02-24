'use strict';

import React, { Component, PropTypes } from 'react';
import load from '../../src/load';
import { renderAndFind } from '../utils';

// Data
import { User } from '../models';

describe('@load: data loading', () => {

  describe('single models', () => {

    it('loads single models when opts is an object', () => {

      @load({ user: User.getItem({ id: 1 }) })
      class Base extends Component {
        static propTypes = {
          loading: PropTypes.object,
          user: User.instanceOf
        }

        render() {
          const { loading, user } = this.props;
          // We inject a `loading` prop which is an object containing loading
          // states for all props specified within @load
          if (loading.user === true) {
            return <p>Loading...</p>;
          }
          return <p>{ this.props.user.name }</p>
        }
      }

      const item = renderAndFind(<Base />);
      assert.defined(item);
      assert.isObject(item.props.loading);
    });

  });

});
