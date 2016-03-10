'use strict';

import { assert } from 'chai';
import React, { Component } from 'react';
import load from '/src/decorator';
import TestUtils from 'react-addons-test-utils';

import { renderAndFind } from '/test/utils';

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

});
