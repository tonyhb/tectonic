'use strict';

import TestUtils from 'react-addons-test-utils';
import React from 'react';
import { Provider } from 'react-redux';
import Loader from '/src/component';
import { createNewManager } from '/test/manager';

export const wrap = (jsx, manager = createNewManager()) => {
  return (
    <Provider store={ manager.store }>
      <Loader manager={ manager }>
        { jsx }
      </Loader>
    </Provider>
  );
}

export const render = (jsx, manager = createNewManager()) => {
  return TestUtils.renderIntoDocument(wrap(jsx, manager));
}

export const renderAndFind = (jsx, component, manager = createNewManager()) => {
  const tree = render(jsx, manager);
  return TestUtils.findRenderedComponentWithType(tree, component);
};
