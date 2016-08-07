'use strict';

import { User } from '/test/models';

class Admin extends User {
  foo() {
    return 'bar';
  }
}

describe('extending models', () => {
  it('inherits from parent class', () => {
  });
});
