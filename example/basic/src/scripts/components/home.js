'use strict';

import React, { Component } from 'react';
const { object } = React.PropTypes;
import load from 'tectonic';

import * as models from 'models';

// This demo expects that you're logged in as user 1
@load({
  user: models.User.getItem({ id: 1 })
})
export default class Home extends Component {
  static propTypes = {
    status: object,
    user: object
  }

  render() {
    const { status, user } = this.props;
    return (
      <div>
        <h1>User stuff</h1>
        <p>User loading status: { status.user } </p>
        <p>User name: <b>{ user && user.name }</b></p>
      </div>
    );
  }
}
