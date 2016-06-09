import { assert } from 'chai';
import sinon from 'sinon';

import PropInspector from '/src/decorator/propInspector.js';
import { User, Post } from '/test/models';
import { createNewManager } from '/test/manager';

describe('propInspector', () => {

  it('assigns .queryFunc ', () => {
    const queryFunc = () => {};
    const pi = new PropInspector({ queryFunc });

    assert.deepEqual(pi.queryFunc, queryFunc);
  });

  describe('computeDependencies', () => {
    const props = { a: 1 };
    const queryFunc = (props) => ({
      user: User.getItem({ id: 1 }),
      posts: Post.getList({ name: props.user && props.user.name }),
    });

    it('creates an accessor object in this.accessor', () => {
      const pi = new PropInspector({ queryFunc });
      assert.isUndefined(pi.accessor);
      pi.computeDependencies(props);
      assert.isDefined(pi.accessor);
    });

    it('accessor has getters set for each key in queryFunc', () => {
      const pi = new PropInspector({ queryFunc });
      pi.computeDependencies(props);

      assert.isObject(pi.accessor.user);
      assert.isObject(pi.accessor.posts);
      assert.isUndefined(pi.accessor.random);

      // Each field within the model accessor should be a function; this
      // function does relatioship mapping.
      assert.isFunction(pi.accessor.user.name);
      assert.isUndefined(pi.accessor.user.foo);
    });

    // TODO: assert results

    it('continues to pass parent props while comparing in deepEqual', () => {
      const m = createNewManager();
      const props = { id: 1 };
      const queryFunc = (props) => ({
        user: User.getItem({ id: props.id })
      });
      const spy = sinon.spy(queryFunc);
      const pi = new PropInspector({ queryFunc: spy });

      pi.computeDependencies(props, m);
      assert.isTrue(spy.called);
      // the 'id' prop from a parent param should be passed into queryFunc each
      // time the dependencies are computed
      assert.equal(spy.secondCall.args[0].id, 1);
    });
  });

});
