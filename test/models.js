'use strict';

import Model from '/src/model';

export const User = new Model('User', {
  id: 0,
  name: '',
  email: ''
});

export const Post = new Model('Post', {
  id: 0,
  title: ''
});
