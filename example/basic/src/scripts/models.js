'use strict';

import { Model } from 'tectonic-redux';

export const User = new Model('user', {
  id: 0,
  name: '',
  email: ''
});

export const Post = new Model('post', {
  id: 0,
  title: '',
  body: ''
});
