import {
  applyMiddleware,
  createStore,
  combineReducers,
} from 'redux';
import { reducer as formReducer } from 'redux-form';
import { reducer } from 'tectonic';
import { reducer as uiReducer } from 'redux-ui';
// Middleware and friends
import createLogger from 'redux-logger';

const logger = createLogger({
  collapsed: (getState, action) => {
    if (action.type.indexOf('redux-ui') > 0) {
      return true;
    }
    return false;
  },
});

const reducers = combineReducers({
  ui: uiReducer,
  form: formReducer,
  tectonic: reducer,
});

const store = createStore(reducers, applyMiddleware(logger));

export default store;
