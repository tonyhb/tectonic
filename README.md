```js
import load, { Model, sources, superagent } from 'adipose';

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

const Sources = new Sources({
  fromSuperagent: superagent,
  fromSDK: sdk,
  fromWebsocket: websocket
});

Sources.fromSuperagent([
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
