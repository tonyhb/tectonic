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

const Sources = new Sources({ fromSuperagent: superagent });
Sources.fromSuperagent([
  {
    meta: {
      call: SDK.func,
      transform: (response) => response.data
    },
    // These are any parameters for the request (ie query params, post data)
    params: [':id'],
    // returns should be Model.item, Model.list or an array of many
    returns: {
      org: Org.item(['id', 'name']),
      repo: Repo.list(['id'])
    }
  }
]);

@load((state, params) => ({
  org: Org.getItem(['name'], { id: 1 }),
  list: Org.getList(['name'], { start: 0, limit: 20 })
}))
class OrgList extends Component {

  render() {
  }

}
