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
import load, { Manager, Model, Loader } from 'tectonic';
import { superagent } from 'tectonic/drivers';
import { DumbResolver } from 'tectonic/resolvers';

const User = new Model({
  id: 0,
  name: '',
  email: ''
});

const Org = new Model({
  id: 0,
  name: ''
});

Org.relationships({
  members: User.list
});

const manager = new Manager({
  drivers: {
    fromSuperagent: superagent,
    fromSDK: sdk,
    fromWebsocket: websocket
  },
  resolver: new DumbResolver()
});

manager.fromSuperagent([
  {
    meta: {
      call: SDK.func,
      transform: (response) => response.data
    },
    // These are any parameters for the request (ie query params, post data)
    params: ['id'],
    // returns should be Model.item, Model.list or an array of many
    returns: {
      org: Org.item(['id', 'name']),
      repo: Repo.list(['id'])
    }
  }
]);

// Wrap your root component like so:
<Loader manager={ manager }>
  ...
</Loader>

// And use the decorator to laod models:

@load((state, params) => ({
  org: Org.getItem(['name'], { id: 1 }),
  dependsOnOrg: Repo.getList({ orgId: params.org.id }), // Wont be called until org is loaded
  list: Org.getList(['name'], { start: 0, limit: 20 })
}))
class OrgList extends Component {

  render() {
  }

}
```

Each component remembers its queries. When it receives new props we recalculate
queries within @load, compare against previous queries to see if items are
different and only enqueue queries which have changed.
