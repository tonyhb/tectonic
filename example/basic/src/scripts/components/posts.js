'use strict';

import React, { Component, PropTypes } from 'react';
import load from 'tectonic-redux';

import * as models from 'models';

@load((props, state) => ({
  user: models.User.getItem({ id: 1 }),
  posts: models.Post.getList({ userId: props.user && props.user.id })
}))
export default class Posts extends Component {
  static propTypes = {
    status: PropTypes.object,
    posts: PropTypes.array
  }

  render() {
    let posts = this.props.posts || [];
    return (
      <div>
        <p>User status: { this.props.status.user }</p>
        <p>Post status: { this.props.status.posts }</p>
        { posts.map(p => <Post post={ p } />) }
      </div>
    );
  }
}

class Post extends Component {
  static propTypes = {
    post: PropTypes.object
  }

  render() {
    const { post } = this.props;

    return (
      <div>
        <h3>{ post.title }</h3>
      </div>
    );
  }
}
