'use strict';

import React, { Component, PropTypes } from 'react';
import Manager from '/src/manager';

/**
 * Loader is a top-level wrapper component which provides react context for
 * the Manager.
 *
 * This allows our @load wrapper to issue queries to Manager which then
 * resolves these queries via `resolvers`.
 */
export default class Loader extends Component {

  static propTypes = {
    manager: PropTypes.instanceOf(Manager)
  }

  static childContextTypes = {
    manager: PropTypes.instanceOf(Manager)
  }

  getChildContext() {
    return {
      manager: this.props.manager
    }
  }

  // TODO: set up context to pass down source into @load component
  render = () => this.props.children;
} 
