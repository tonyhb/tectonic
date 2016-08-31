/**
 * These specs assert that we calculate depedency trees for queries correctly.
 *
 * They should cover query construction, hierarchies, and all associated
 * classes working together such as PropInspector.
 *
 * In essence, they should be end-to-end query tree tests.
 */

import { assert } from 'chai';

import Query from '/src/query';
import PropInspector from '/src/decorator/propInspector.js';
import { User, Post } from '/test/models';

describe('query trees', () => {
  const props = { a: 1 };
  // const queryFunc = (props) => ({
    // user: User.getItem({ id: 1 }),
    // post: Post.getList({ name: props.user && props.user.name }),
  // });
  const queryFunc = (props) => {
    return {
      user: User.getItem({ id: 1 }),
      post: Post.getItem({ name: props.user && props.user.name }),
      // this next query is bullshit and is only used to test a->b->c 
      userFromPost: User.getItem({ name: props.post && props.post.title })
    }
  };

  it('creating a query via PropInspector correctly creates relationships', () => {
    const pi = new PropInspector({ queryFunc });
    const deps = pi.computeDependencies(props);

    assert.isDefined(deps.user);
    assert.isDefined(deps.post);
    assert.isDefined(deps.post.parent);
    assert.isArray(deps.user.children);

    // Relationships should be correct
    assert.deepEqual(deps.user.children, [deps.post]);
    assert.deepEqual(deps.post.parent, deps.user);

    // post -> userFromPost
    assert.deepEqual(deps.post.children, [deps.userFromPost]);
    assert.deepEqual(deps.userFromPost.parent, deps.post);

    // And the actual name prop of post should be undefined
    assert.deepEqual(deps.post.params, { name: undefined });
  });

});
