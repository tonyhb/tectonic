# Installation

Welcome to Tectonic!  This guide will walk you through installing Tectonic in
your redux app.  It shouldn't take more than 20 minutes for you to get started
with making your first request.  Installation happens over a few steps:

1. Write out your models and add some default values to them.
2. Add the tectonic reducer to your store
3. Set up the manager by specifying drivers and your redux store
4. Specify your API endpoints as source definitions
5. Add the manager to the root of your project

Let's get started!

---

# 1. Define some models

One of the core aspects of tectonic are models.  Similar to models in
frameworks such as rails, a model defines a particular resource in your app
- such as a user.

You can define a model by extending tectonic's base model class and adding
the model's fields:

```
import { Model } from 'tectonic';

export class User extends Model {

  // 'modelName' is a required field and must be unique among all models
  static modelName = 'user';

  // 'fields' define the attributes that this model can hold, along with
  // any default values for a new, empty model.  These default vaues are
  // also passed to a component when data is pending.
  static fields = {
    id: undefined,
    name: 'Anonymoose',
    email: '',
  }

  getObfuscatedEmail() {
    if (this.email.indexOf('@') < 0) {
      return '';
    }
    return `${this.email[0]}...${this.email.substr('@')}`
  }
}
```

Models are **immutable by default**; internally these models extend ImmutableJS
records.

You can also define functions for each model, as demonstrated above.  This
helps co-locate all model related code without repetition, keeping your
components free from data logic.

For more information about the model API view API-MODEL.md.

---

# 2. Add the tectonic reducer to your store

Add the tectonic reducer using the **tectonic** key within combineReducers.
This is important: the manager always expects it to be named tectonic.

```
// within store.js

import {
  applyMiddleware,
  createStore,
  combineReducers,
} from 'redux';
import { reducer as tectonicReducer } from 'tectonic';

// tectonic *must* be added under the "tectonic" namespace
const reducers = combineReducers({
  tectonic: tectonicReducer,
  ...
});

// create a store with your optional middleware
const store = createStore(reducers);

export default store;
```

Awesome stuff - the reducer is added! Now we can set up the manager.

---

# 3. Set up the manager

The MANAGER joins all tectonic components together, and specifies all of the options of Tectonic.  Let's add a manager to our project:

```
// manager.js

import { Manager, Resolver } from 'tectonic';
import TectonicSuperagent from 'tectonic-superagent'; // superagent driver
// your store with the tectonic middleware added
import store from './store.js';

// create a new manager with all of the options provided
const manager = new Manager({
  // the resolver matches queries against your source definitions (API endpoints)
  // and invokes them.
  resolver: new Resolver(),

  // drivers specifies all of the drivers for use when data loading.  each
  // source definition must use one of these drivers.
  drivers: {
    // install the superagent driver with default options. For more options
    // such as global request modifiers (eg. to add headers to every request)
    // see the tectonic-superagent documentation.
    fromSuperagent: new TectonicSuperagent(),
  },

  // give the manager access to your redux store so we can save data within
  // the tectonic reducer
  store: store,
});

export default manager;
```

That's literally it.  Generally the only thing you're going to customize here
are the drivers.  Now that you've got a manager instance we can specify some
source definitions for loading data (eg. your API endpoints).

For more information on the manager API head to MANAGER-API

---

# 4. Specify API endpoints

Now we need to define some sources for our data so that tectonic can make
requests. These SOURCE DEFINITIONS are important in tectonic; each QUERY
that you make to load or update data is matched against every SOURCE DEFINITION
to find the correct API endpoint to hit.

For example, when you ask to load a single user item with an ID of "1" we look
through all of your sources for an API endpoint that will return a user item,
and ensure that the API endpoint accepts "id" as a parameter.

Before you begin make sure that you have some drivers defined in your manager.
Now, let's get started:

```
// Import the models that you've defined within your project so that we
// can associate sources with the models they refer to
import UserModel from './models/user.js';
import PostModel from './models/post.js';

// Define a manager with some drivers
const manager = new Manager({
  // ...prior setup
  drivers: {
    fromSuperagent: new TectonicSuperagent(),
    foo: new FooDriver(),
  },
});

// Define the API endpoints for the project as a source.  Each source needs
// to be associated with a driver; the drivers we set up above are installed
// in `manager.drivers` to be used via the object key names.
//
// In the above setup we have `manager.drivers.fromSuperagent` as the
// superagent drier and `manager.drivers.foo` as the foo driver.
//
// Let's define some API endpoints that use our superagent driver to make
// AJAX requests.  Each object defines a single source, so each API endpoint
// needs to be defined separately.
manager.drivers.fromSuperagent([
  // this API endpoint returns a list of users
  {
    meta: {
      url: '/api/v1/users',
      method: 'GET',
    },
    returns: UserModel.list(),
  },
  // this API endpoint returns a single user given the user ID as a
  // parameter
  {
    // 'meta' holds driver-specific data
    meta: {
      url: '/api/v1/users/:id',
      method: 'GET',
    },
    params: ['id'],
    returns: UserModel.item(),
  },
  // this API endpoint creates a new user
  {
    // 'meta' holds driver-specific data
    meta: {
      url: '/api/v1/users',
      method: 'POST',
    },
    // queryType dictates whether this creates, updates or deletes a model.
    // The default is 'GET', which returns data from a source without side
    // effects.
    //
    // If you mark this as 'CREATE', this source will only be considered for
    // queries which create models; any other query will not use this endpoint.
    // Valid options are 'GET', 'CREATE', 'UPDATE', and 'DELETE'.
    queryType: 'CREATE',
    returns: UserModel.item(),
  },
  // this API endpoint deletes a user
  {
    // 'meta' holds driver-specific data
    meta: {
      url: '/api/v1/users',
      method: 'DELETE',
    },
    queryType: 'DELETE',
    // The API returns no data so we leave 'returns' as undefined, but we
    // still need to associate this source with the user model. We do this via
    // the 'model' key.
    model: UserModel,
  },
]);
```

The full API for source definitions is listed in API-MANAGER.md; be sure to
check this out for more information on each option to use when defining a
source.

Also, for more information on how queries are matched to source definitioons
see INTERNALS-RESOLVER.md.

Now, let's get started on the last quick step before we can load data.

---

# 5. Add the manager to the root of your project

Finally, lets make the manager accessible to the `@load` decorator so that we
can make queries.  To do that we need to add the manager to the root of your
project:

```
// in your base JSX which is added via react's `render`:

import { Loader } from 'tectonic';
// your manager with all sources defined
import manager from './manager.js';

const App = () => (
  { /* Just below Redux Provider component add Tectonic's loader */ }
  <Provider store={ store }>
    <Loader manager={ manager }>
      { /* Your app, eg. redux router or your base component */ }
    </Loader>
  </Provider>
);

export default App;
```

The `Loader` component from tectonic adds `manager` to React's context.  This
is how the @load decorator adds queries and fetches data/loading statuses from
your store.

That's it! You're ready to use tectonic to manage all of your API data. Let's
make some queries!
