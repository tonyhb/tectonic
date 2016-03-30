'use strict';

import { Model } from 'tectonic-redux';

export const User = new Model('user', {
  id: 0,
  name: '',
  email: ''
});
