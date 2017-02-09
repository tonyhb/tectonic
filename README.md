<h1 align='center'>Tectonic</h1>

<p align='center'>Declarative data loading for REST APIs: https://tonyhb.github.io/tectonic/</p>
<p align='center'><a href='https://travis-ci.org/tonyhb/tectonic'><img src='https://travis-ci.org/tonyhb/tectonic.svg?branch=master' /></a></p>

-----

<h3 align='center'>What does it do?</h3>

Great question! It:

- Queries data via your existing REST API with adaptable query drivers
- Stores state and data within Redux' reducers automatically
- Respects and manages caching
- And, best of all, passes fetched data and loading state into your components

What does that mean?

Never define an action for loading data again. And also, never write a
reducer again. Which means no normalization of data! And no writing reselect
queries! It happens automatically for you.

<h3 align='center'>Cool. How do I use it?</h3>

First you need to define some models to hold and query data:

```js
import { Model } from 'tectonic';

class User extends Model {
  // modelName is important; it's used to differentiate models
  static modelName = 'user';

  // fields are used to create an immutable.js record which holds data for an
  // instance of a model. All fields must be defined here with defaults
  static fields = {
    id: 0,
    email: '',
    name: '',
  }

  // idField defines which field is used as the model identifier. This defaults
  // to 'id' and should only be set if it's different.
  // Note that a model must always have an ID; this is how we look up data in
  // reducer.
  static idField = 'id';
}
```

Then you define your REST API as sources. It's quick and easy, but let's skip it
to get to the juicy part. Which is declaratively asking for data!

Check it out (I'll tell you what's going on after):

```js
import React, { Component, PropTypes } from 'react';
import load, { Status } from 'tectonic';
import { User, Post } from './models.js'; // your models
const { instanceOf, arrayOf, shape, string } = PropTypes;

@load((props) => {
  user: User.getItem({ id: props.params.userId }),
  posts: Post.getList({ email: props.user.email })
})
class UserInfo extends Component {
  static propTypes = {
    // btw, these are the same keys we passed to '@load'
    user: instanceOf(User),
    posts: arrayOf(instanceOf(User)),

    status: shape({
      user: instanceOf(Status), // Status is a predefined Tectonic class :)
      posts: instanceOf(Status),
    })
  }

  render() {
    const { status } = this.props;
    if (status.user.isPending()) {
      return <Loading />;
    }
    // ...
  }
}
```

Hella cool right?! Here's what's happening:

You say what props you want within the `@load` decorator. The `@load` decorator
gets the component's props, so you can use props in the router or from parents
to load data.

Plus, it automatically handles what we call "dependent data loading". Here,
`posts` depends on the user's email. We don't get that until the user has
loaded. Don't worry; this is handled automatically behind the scenes.

Tectonic also adds loading statuses for each of the props to your component!

You can see whether it's pending, successful, or errored using built in
functions (the actual status is at `.status`, so
`this.props.status.user.status`). Plus, if there's errors, you get the error
message at `.error`, so `this.props.status.user.error`. Same goes for the HTTP
code.

And as a bonus all of the requests are automatically cached and stored according
to the server's cache headers. So if your server tells us to store something for
an hour we're not going to make a request for this data for, like, one hour and
one minute!

Super, super basic interface, and super, super powerful stuff behind the scenes.
I know, not as cool as GraphQL and relay. But still, if you gotta REST you gotta
deal, baby.

*Bonus*: Guess what? If three components asked for the same data we'll
automatically dedupe requests for you. We'll only ask the API once. So don't
worry. Spam `@load` like you're obsessed!

<h3 align='center'>Mind blown. You mentioned defining API endpoints as sources?</h3>

That's right. See, behind the scenes we need to figure out how to actually load
your data. This is done by a "resolver".

In order for us to figure that out you need to tell us where your endpoints are;
what they return; and what required parameters they have.

Here's an example:

```js
import { Manager, BaseResolver } from 'tectonic';
import TectonicSuperagent from 'tectonic-superagent';

// Step 1: create your manager (which brings everything together)
const manager = new Manager({
  resolver: new BaseResolver(),
  drivers: {
    // Drivers are modular functions that request data for us.
    // This one uses the awesome superagent ajax library.
    // See packages/tectonic-superagent for more info :)
    fromSuperagent: new TectonicSuperagent(),
  },
  store, // Oh, the manager needs your redux store
});

// Step 2: Define some API endpoints as sources.
// Note that each driver becomes a function on `manager` - this
// is how we know which driver to use when requesting data.
manager.drivers.fromSuperagent([
  // Each driver takes an array of API endpoints
  {
    // LMK what the endpoint returns. In this case it's a single
    // user item.
    returns: User.item(),
    // To get a single user the API endpoint needs a user's ID
    params: ['id'],
    meta: {
      // meta is driver-specific. In this case the superagent driver
      // needs to know the URL of the API endpoint. It's going to
      // replace `:id` with the ID parameter when loading data.
      url: '/api/v1/users/:id',
    }
  },
  {
    // This returns a list of posts
    returns: Post.list(),
    // Each param item is the name of the param you pass into @load. EG:
    // @load({
    //    posts: Post.getList({ userId: 1 })
    //  })
    params: ['userId'],
    meta: {
      url: '/api/v1/users/:userId/posts',
    },
  },
]); 
```

A lot of concepts.

The manager makes everything tick. It passes "queries" from `@load` into the
"resolver", which then goes through your sources above to figure out which
requests to make.

Once we've got data, the manager takes that and puts it into the cache, which is
an abstraction over a Redux reducer in the store to manage caching.


<h3 align='center'>What happens if I make a request without a source?</h3>

We'll throw an error which you can see in your console. Also, we use the `debug` npm package which you can enable via:

```
tdebug.enable('*');
```

<h3 align='center'>How do I add the manager to my app?</h3>

Wrap your app with a component which passes context. We call it a "loader":

```js
import { Provider } from 'react-redux';
import { Loader } from 'tectonic';
import store from './store.js';
import manager from './manager.js'; // your manager with sources defined

const App = () => (
  <Provider store={ store }>
    <Loader manager={ manager }>
      {/* Your app goes here */}
    </Loader>
  </Provider>
);

export default App;
```

<h3 align='center'>Sweet potato. But can I CRUD?</h3>

Hell yeah baby!

The `@load` decorator also adds a query function to your components:

```
@load() // just gimme these functions please!
class YourForm extends Component {
  static propTypes = {
    query: PropTypes.func,
  }

  // imagine onSubmit is called with an object containing model
  // data...
  onSubmit(data) {
    // Each function takes two arguments: an object of options and a
    // second callback for tracking the status of the request 
    this.props.query({
      model: User,
      body: data,
      queryType: 'CREATE', // tells us to use a source definition to CREATE a model
    }, this.afterSubmit);
  }
  
  afterSubmit = (err, result) => {
    if (err !== null) {
      // poo 💩
      return;
    }
  }
}
```

💥💥💥! This is automatically gonna populate the cache, too.

<h3 align='center'>Can I see documentation?</h3>

<a href="https://tonyhb.github.io/tectonic/">Sure thing, partner. Head here.</a>
