# Tectonic

-----

This is **not ready** and shouldn't be used until this notice is removed *and*
it's on NPM.

-----

Tectonic is a smart data component which handles:

- Querying data via your existing REST API with adaptable query drivers
- Storing state and data within Redux' reducers
- Cache management
- Passing data into your components

In short:

1. you explain your REST API in terms of sources
2. you write standard drivers to communicate with your API, or use built in drivers
3. you declaratively state what data your components need
4. tectonic resolves queries, caching and data management to pass data into your
   components. As a bonus your component also gets the entire async lifecycle
   injected as props to show loading views.

```js
import load, { Manager, Model, Loader, BaseResolver } from 'tectonic';
// see github.com/tonyhb/tectonic-superagent
import TectonicSuperagent() from 'tectonic-superagent';

class User extends Model {
  static modelName = 'user';

  static fields = {
    id: 0,
    name: '',
    email: ''
  };

  /**
   * getObfuscatedEmail is an instance method which allows us to define data
   * manipulation functions outside of a component in one place. This makes
   * data manipulation reusable everywhere without writing selectors.
   */
  getObfuscatedEmail() {
    return this.email.replace('@', ' at ');
  }
}

class Org extends Model {
  static modelName = 'org';

  static fields = {
    id: 0,
    name: ''
  };
}

const manager = new Manager({
  drivers: {
    fromSuperagent: new TectonicSuperagent()
  },
  resolver: new BaseResolver(),
  store: store // Redux store
});

manager.fromSuperagent([
  {
    meta: {
      url: '/api/v0/user/:id',
      transform: (response) => response.data
    },
    // These are any parameters for the request (ie query params, post data)
    params: ['id'],
    // returns should be Model.item, Model.list or an object of these
    returns: User.item(),
  },
  // API call for listing all users
  {
    meta: {
	  url: '/api/v0/users'
	},
	returns: User.list()
  }
]);

// Wrap your root component like so:
<Loader manager={ manager }>
  ...
</Loader>

// And use the decorator to load models:

@load(props => ({
  org: Org.getItem(['name'], { id: 1 }),
  dependsOnOrg: Repo.getList({ orgId: props.org && props.org.id }), // Wont be called until org is loaded
  list: Org.getList(['name'], { start: 0, limit: 20 })
}))
class OrgList extends Component {

  static propTypes = {
	// tectonic automatically tracks statuses of all API calls within
	// props.status
    status: React.PropTypes.shape({
	  org: React.PropTypes.bool,
	  dependsOnOrg: React.PropTypes.bool,
	  list: React.PropTypes.bool
	}),

	org: Org.instanceOf,
	dependsOnOrg: React.PropTypes.arrayOf(Repo.instanceOf),
	list : React.PropTypes.arrayOf(Org.instanceOf)
  }

  render() {
  }

}
```

Each component remembers its queries. When it receives new props we recalculate
queries within @load, compare against previous queries to see if items are
different and only enqueue queries which have changed.

---------

# Components

### Manager

### Resolver

### Cache

The cache is an abstraction over the redux store. When querying the cache, the
cache pulls data from the store and checks whether it's valid (according to
cache rules you define). If the data is valid it returns said data. If it's
invalid it returns `undefined`, causing the resolver to query for data.

When the resolver queries for and successfully receives data it stores it in the
cache, which delegates actual storage to the redux store.
