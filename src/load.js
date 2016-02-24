'use strict';

import React, { Component } from 'react';
import { connect } from 'react-redux';

export default function load(thunk) {
  // TODO: 
  // 1. Instantiate a wrapper component
  // 2. Connect wrapper component with Redux' store
  // 3. Call the thunk with store.getState() and this.props
  // 4. Take result of thunk and transform into an array (if it's not already)
  // 5. Iterate through array and figure out how to call and load data

  return (WrappedComponent) =>

    @connect()
    class LoadComponent extends Component {
      render() {
        return <WrappedComponent { ...this.props } />
      }
    }

}
