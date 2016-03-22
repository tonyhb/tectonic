'use strict';

import Model from '/src/model';

export const User = new Model('UserModel', {
  id: 0,
  name: '',
  email: ''
});

export const Post = new Model('PostModel', {
  id: 0,
  title: ''
});
