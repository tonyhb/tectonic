'use strict';

import { assert } from 'chai';
import { User } from '/test/models';
import { recordMethods } from '/src/model';

// A model is backed by an immutable record; it provides getters for defined
// data, and to set data you should create a new instance of the model with
// updated data.
describe('Model instance data', () => {
  it('instantiates with default data as described in the model definition', () => {
    const u = new User();
    assert.equal(u.id, 0);
    assert.equal(u.name, '');
    assert.equal(u.email, '');
  });

  it('instantiates with custom data', () => {
    const u = new User({ id: 1, name: 'foo', email: 'foo@example.com' });
    assert.equal(u.id, 1);
    assert.equal(u.name, 'foo');
    assert.equal(u.email, 'foo@example.com');
  });

  it('throws an error if we attempt to set data using = assignment', () => {
    let u = new User();
    assert.throws(
      () => u.name = 'foo',
      'Cannot set on an immutable model.'
    );
  });

  it('defines all immutableJS record methods', () => {
    const u = new User();
    recordMethods.forEach(method => {
      assert.isFunction(u[method]);
    });
  });

  it('allows us to use immutableJS record/map methods such as .set to return a new model instance', () => {
    let first = new User({ id: 1 });
    assert.equal(first.id, 1);
    let second = first.set('id', 2);
    assert.equal(first.id, 1);
    assert.equal(second.id, 2);
  });

  it('User.blank() always returns a new instance with an undefined idAttribute', () => {
    let user = User.blank();
    assert.equal(user.id, undefined);
  });
});
