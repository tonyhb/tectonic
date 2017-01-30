'use strict';

import { assert } from 'chai';
import React, { Component } from 'react';
import load from '../../../src/decorator';
import TestUtils from 'react-addons-test-utils';
import {
  renderAndFind,
} from '../../utils';

describe('@load: basic component rendering', () => {

  it('should render the wrapped component', () => {
    class Basic extends Component {
      render = () => <p>Hi</p>;
    }

    // Create a wrapped version of our component not using the decorator so we
    // can ensure we render and find base Basic component
    const Wrapped = load()(Basic);
    const item = renderAndFind(<Wrapped />, Basic);
    assert.isDefined(item);
  });

  it('should pass down props to the wrapped component', () => {
    class Child extends Component {
      render = () => <p>Child</p>;
    }
    const WrappedChild = load()(Child);
    class Parent extends Component {
      render = () => <WrappedChild foo='bar' />;
    }

    const item = renderAndFind(<Parent />, Child);
    assert.equal(item.props.foo, 'bar');
  });

  it('throws an error when @load doesnt return an object fron a function', () => {
    class Child extends Component {
      render = () => <p>Child</p>;
    }
    const WrappedChild = load(() => {})(Child);
    assert.throws(() => {
      const item = renderAndFind(<WrappedChild />, Child);
    }, '@load decorator function must return an object');
  });

  it('throws an error with no context.manager defined', () => {
    class Child extends Component {
      render = () => <p>Child</p>;
    }
    const WrappedChild = load()(Child);
    assert.throws(
      () => TestUtils.renderIntoDocument(<WrappedChild />),
    );
  });

});
