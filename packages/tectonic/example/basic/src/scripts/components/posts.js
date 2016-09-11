'use strict';

import React, { Component, PropTypes } from 'react';
import load from 'tectonic';

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
        <p>User name: { this.props.user && this.props.user.name }</p>
        <p>Post status: { this.props.status.posts }</p>
        { posts.map(p => <Post post={ p } key={ p.id } />) }
      </div>
    );
  }
}

@load()
class Post extends Component {
  static propTypes = {
    post: PropTypes.object,
    deleteModel: PropTypes.func
  }

  deletePost(evt) {
    evt.preventDefault();
    this.props.deleteModel({
      model: this.props.post,
      params: {
        id: this.props.post.id,
      }
    });
  }

  render() {
    const { post } = this.props;

    return (
      <div style={ { display: 'flex' } }>
        <div>
          <h3>{ post.title }</h3>
          <p>Excerpt: "{ post.getExcerpt() }"</p>
        </div>
        <div>
          <a href='#' onClick={ ::this.deletePost }>
            Delete
          </a>
        </div>
      </div>
    );
  }
}
