# `@load` decorator API

## Usage

```js
@load(queries<Object, Function(props<Object>)>)
```

The load decorator accepts a single argument: an object of keys to queries
_or_ a function which returns an object of keys to queries.

Functions passed to `@load` will have all props from parent components as the
first argument, so you can generate queries based on these props:

```js
class Parent extends Component {
  render() {
    <Child slug='some-post' />
  }
}

@load((props) => ({
  posts: PostModel.getItem({ slug: props.slug }),
}))
class Child extends Component {
}
```

Note that using a static object is much more performant:

```js
@load({
  user: window.userId,
})
class Wrapper extends Component {
}
```

If you don't need props to calculate your queries you should always use a
static obejct.

And the keys of the object passed into `@load` will be used as the prop names
for data loaded by tectonic.

## Props 

The universal props passed into your decorated component are:

- `status<Object>`: An object where key names match the keys passed into `@load`.
Object values are a [Status object](/tectonic/api-status.html).
- `load<Function(queries<Object>)>`: A function which resolves GET queries to
load data. Similar to the `@load` decorator, it accepts an object of queries.
The component will receive new props using the object keys as prop names.
- `query<opts<Object>, callback<Function(err<?null>, result<Object>))>`: A
  function which resolves any query to update or modify resources.  This does
  _not_ pass data into your component on success; it should be used for create,
  update and delete queries.<br />
  [Read this guide for more information on using this to create queries with
  side effects](/tectonic/queries-side-effects.html).


Additionally, there are a number of helper functions which automatically add
`queryType` as an option to the `query` function:

- `createModel(opts<Object>, callback<Function(err<?null>, result<Object>))>`:<br />
Helper to call `query` with `opts.queryType = 'CREATE'`, for create queries.
- `updateModel(opts<Object>, callback<Function(err<?null>, result<Object>))>`:<br />
Helper to call `query` with `opts.queryType = 'UPDATE'`, for update queries.
- `deleteModel(opts<Object>, callback<Function(err<?null>, result<Object>))>`:<br />
Helper to call `query` with `opts.queryType = 'DELETE'`, for delete queries.

### Loaded data as props

And finally, all of your data from the queries needs to be in there too! If you
use the decorator as follows:

```
@load({
  foodiddy: UserModel.getItem({ id: 1})
})
class SomeComponent extends Component {
  static propTypes = {
    foodiddy: PropTypes.instanceOf(UserModel),
  }
}
```

Then the user model loaded will be passed in as `this.props.foodiddy`.
Basically, the object keys are going to be your prop names.  They're also
going to be your status names, accessible at `this.props.status.foodiddy`.
Fantastic stuff.
