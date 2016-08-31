import React, { Component } from 'react';
import { reduxForm } from 'redux-form';
import css from 'react-css-modules';
import styles from './newPost.css';
// Tectonic
import load from 'tectonic';
import { User, Post } from 'models';

@load({
  user: User.getItem({ id: 1 })
})
@reduxForm({
  form: 'newPost',
  fields: [
    'title',
    'body'
  ]
})
@css(styles)
export default class NewPost extends Component {

  static propTypes = {
    // tectonic
    user: User.instanceOf,
    createModel: React.PropTypes.func,
    // redux-form
    form: React.PropTypes.object,
    handleSubmit: React.PropTypes.func
  }

  onSubmit(data) {
    const { user } = this.props;
    const post = new Post({
      ...data,
      author: user.name,
      authorID: user.id
    });

    this.props.createModel(post, (err, result) => {
      debugger;
    });
  }

  render() {
    const {
      fields: {
        title,
        body
      },
      handleSubmit
    } = this.props;

    return (
      <form onSubmit={ handleSubmit(::this.onSubmit) } styleName='form'>
        <label>
          Title
          <input { ...title } />
        </label>

        <label>Body
        <textarea { ...body } />
        </label>
        
        <button type='submit'>save</button>
      </form>
    );
  }
}
