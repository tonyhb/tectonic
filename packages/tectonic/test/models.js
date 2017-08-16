'use strict';

import Model from '../src/model';

export class User extends Model {
  static modelName = 'user';

  static fields = {
    id: 0,
    name: '',
    email: ''
  }

  static getName(user) {
    return user.name;
  }

  maskEmail() {
    const pos = this.email.indexOf('@');
    return this.email[0] + this.email.substr(pos);
  }
};

export class Post extends Model {
  static modelName = 'post';

  static fields = {
    id: 0,
    title: ''
  };

}
