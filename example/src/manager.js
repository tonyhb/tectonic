import {
  Manager,
  BaseResolver,
} from 'tectonic';
import TectonicSuperagent from 'tectonic-superagent';
import store from './store.js';

import { routes as pageRoutes } from './models/page';
import { routes as scanRoutes } from './models/scan';

const manager = new Manager({
  drivers: {
    fromSuperagent: new TectonicSuperagent({
      // transform the request in development to use the local mocked
      // API.
      //
      // Note that here you can do things like add your CSRF token as
      // a header for each request automatically.
      request: (r) => {
        if (process.env.NODE_ENV === 'development') {
          const url = r.url.replace('/api/v1/', '');
          // eslint-disable-next-line no-param-reassign
          r.url = `http://localhost:8081${url}`;
        }
        return r;
      },
    }),
  },
  resolver: new BaseResolver(),
  store,
});

manager.drivers.fromSuperagent([
  ...pageRoutes,
  ...scanRoutes,
]);

export default manager;
