'use strict';

import TestUtils from 'react-addons-test-utils';
import React from 'react';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import Loader from '/src/component';
import loadManager from '/src/manager';

const store = createStore(combineReducers({
  data: (state = {}) => state
}));

export const wrap = (jsx) => {
  return (
    <Provider store={ store }>
      <Loader loadManager={ loadManager }>
        { jsx }
      </Loader>
    </Provider>
  );
}

export const render = (jsx) => {
  return TestUtils.renderIntoDocument(wrap(jsx));
}

export const renderAndFind = (jsx, component) => {
  const tree = render(jsx);
  return TestUtils.findRenderedComponentWithType(tree, component);
};
