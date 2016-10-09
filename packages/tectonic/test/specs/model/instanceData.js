'use strict';

import { assert } from 'chai';
import { User } from '../../models';
import Model, { recordMethods } from '../../../src/model';

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

  it('allows us to get all values as an object', () => {
    const u = new User({ id: 1, name: 'foo' });
    assert.deepEqual(
      u.values(),
      {
        id: 1,
        name: 'foo',
        email: ''
      }
    );
  });

  it('User.blank() always returns a new instance with an undefined idAttribute', () => {
    let user = User.blank();
    assert.equal(user.id, undefined);
  });

  describe('sub-models', () => {
    class A extends Model {
      static modelName = 'a';
      static fields = {
        id: '',
        foo: '',
      }

      sayHi() {
        return 'hi';
      }
    }
    class B extends Model {
      static modelName = 'b';
      static fields = {
        id: '',
        a: new A(),
        baz: '',
      }
    }

    it('sets sub-models in .blank', () => {
      const b = B.blank();
      assert.deepEqual(
        b.values(),
        {
          id: undefined,
          baz: '',
          a: {
            id: undefined,
            foo: '',
          },
        }
      );
      assert.equal(b.a.sayHi(), 'hi');
    });

    it('sets sub-models from constructor', () => {
      const item = new B({
        id: 'b',
        baz: 'lol',
        a: {
          id: 'a',
          foo: 'test',
        },
      });

      assert.deepEqual(
        item.values(),
        {
          id: 'b',
          baz: 'lol',
          a: {
            id: 'a',
            foo: 'test',
          },
        }
      );

      assert.equal(item.a.sayHi(), 'hi');
    });
  });

});
