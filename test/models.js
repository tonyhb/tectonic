'use strict';

import Model from '/src/model';

export const User = new Model({
  id: 0,
  name: '',
  email: ''
});

export const Post = new Model({
  id: 0,
  title: ''
});
