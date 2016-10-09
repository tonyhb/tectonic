'use strict';

import { assert } from 'chai';

import Model from '../../../src/model';

class Foo extends Model {
  static modelName = 'foo';

  static fields = {
    id: 0,
    name: ''
  };

  foo() {
    return 'foo';
  }
}

class Bar extends Foo {
  bar() {
    return 'bar';
  }
}

describe('extending models', () => {
  it('inherits from parent class', () => {
    const a = new Bar();
    assert.deepEqual(a.constructor.fields, {id: 0, name: ''});
    assert.deepEqual(a.constructor.fieldNames(), ['id', 'name']);
    assert.equal(a.constructor.modelName, 'foo');
  });
  it('can call parent methods', () => {
    const a = new Bar();
    assert.equal(a.foo(), 'foo');
    assert.equal(a.bar(), 'bar');
  });
});
