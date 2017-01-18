# Queries with side effects

Tectonic also allows you to create, update and delete records using your REST
API.  It's a little more involved than using the decorator to load data, though
it's still quick and easy.

Note that when you create, update and delete records using tectonic the
internal state of the reducer is updated, so all components will re-render with
new data as necessary without reloading any data.

## Using `this.props.query` to modify records

```javascript
this.props.query(args<Object>, callback<Function>)
```

To resolve a create/update/delete query first decorate your component with the
`@load` decorator. This will pass the `query` function down as a prop, as
explained in [the `@load` decorator API
documentation](/tectonic/api-decorator.html)

The options passed into `this.props.query` are: 

```javascript
{
  // queryType represents which type of query this is.  It's used to match
  // against your endpoints, which also have a queryType.
  // This is **required**.
  queryType: <'CREATE' | 'UPDATE' | 'DELETE'>,

  // model is the base class of the model you're affecting, eg. UserModel.
  // This must be the model class itself: **not** an instance of the class.
  // This is **required**.
  model: <Model>,

  // modelId represents the ID of the model you're updating or deleting.
  // This is **required** for UPDATE and DELETE queries, but not for creates.
  modelId: <?String | ?Int>,

  // params represents any query parameters needed for the source definition.
  // This is optional and is only needed to match to certain sources (eg.
  // an ID in the URL to delete a model).
  params: <?Object>,

  // body represents the JSON data you want to save for creates and updates.
  // This is optional.
  body: <?Object>,
}
```

### Creating a model

Let's get started with a basic create query:

```js
// source definition:
{
  meta: {
    url: '/api/v1/users',
    method: 'POST',
  },
  queryType: 'UPDATE',
  returns: UserModel.item(), // This endpoint returns the saved model after creation
}

// component:

// load connects to the manager and passes down the `query` prop to save data
@load()
class CreateUserForm extends Component {
  static propTypes = {
    query: PropTypes.func.isRequired,
  }

  // Imagine that onCreateUser is called with an object containing all user
  // data to be stored, as an object
  onCreateUser(data) {
    const opts = {
      queryType: 'CREATE',
      model: UserModel,
      body: data,
    };

    this.props.query(opts, (err, result) => {
      if (err !== null) {
        // An error occured whilst creating the model
        return;
      }

      // Success :D
    });
  }
}
```

### Updating a model

```js
// source definition:
{
  meta: {
    url: '/api/v1/users/:id',
    method: 'PUT',
  },
  queryType: 'UPDATE',
  returns: UserModel.item(), // This returns the updated user after saving
  params: ['id'], // We need the ID of the user in the URL
}

// component:
@load()
class UpdateUser extends Component {
// ...
  onUpdate(data) {
    const opts = {
      queryType: 'UPDATE',
      model: UserModel,
      modelId: data.id, // necessary for updates as explained below
      body: data,
      params: { id: data.id },
    };

    this.props.query(opts, (err, result) => {
      // ...
    });
  }
// ...
}
```

### Deleting a model

```js
// source definition:
{
  meta: {
    url: '/api/v1/users/:id',
    method: 'DELETE',
  },
  queryType: 'DELETE',
  model: UserModel, // This endpoint returns no data but affects the UserModel
  params: ['id'], // We need the ID of the user in the URL
}

// component:
@load()
class DeleteUser extends Component {
// ...
  onDelete(data) {
    const opts = {
      queryType: 'DELETE',
      model: UserModel,
      modelId: data.id, // necessary for deletes as explained below
      params: {
        id: data.id,
      }
    };

    this.props.query(opts, (err, result) => {
      // ...
    });
  }
// ...
}
```

### Why does `modelId` need to be specified for updates and deletes?

Tectonic's reducer stores all models keyed by their ID.  We need the ID within
the query so that we can keep the internal state of the reducer up to date
with the server's representation.

For example, if you delete user ID 1 we need to remove that user from our
reducer.

This means that all of your components automatically update when each query
is successful, without having to reload any data.


### How do I add my model's defaults to a query?

Instantiate a new model with your form data, then call `.values()` on the model
to return all model data as an object.  Instantiating an object assigns default
values to the data passed in to the constructor, giving you defaults.

For example:

```
onCreate(data) {
  const opts = {
    queryType: 'CREATE',
    model: UserModel,
    body: new UserModel(data).values(),
  }
  this.props.query(opts, (err, result) => {
    // ...
  });
}
```
