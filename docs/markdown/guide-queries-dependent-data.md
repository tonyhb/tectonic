# Queries

## Dependent data in GET queries

What do we mean by dependent data?  Say you have an N+1 problem: you need to
load a user by name in order to retrieve their ID, then you need to
use the ID to load the user's posts.  The timeline looks like this:

```
load user -> load posts
```

We can handle this within one `@load` decorator:

```javascript
// This is declared as a variable for easier explanation below; you can
// write this directly in @load() in normal code.
const queryFunc = (props) => ({
  user: UserModel.getItem({ name: props.userName }),
  posts: PostModel.getList({ userId: props.user && props.user.id }),
});

@load(queryFunc)
class MyComponent extends React.Component {
  // ...
}
```

This will first load the user, then once we have the user's ID from the
username it will load the posts.

### How does this work?

The decorator passes all props recieved from the parent component _along with
the props from your queries_ (`user` and `posts`) into `queryFunc`.  To start
these will be your default values - the data has not yet been loaded.

So the query for `posts` will be `PostModel.getList({ userId: undefined })` or
some other such default.

Remember that the resolver **doesn't resolve any queries which have an
undefined parameter**.  This means that PostModel.getList's resolution will be
postponed as there's no userId.

When the user query is finally resolved this component is re-rendered, so the
decorator's `queryFunc` is re-evaluated with the new user props.  Now that we
have a user ID from the loaded data the post query will be resolved. 

### Is this necessary?

You could use two wrappers, though colocating queries inside one data loading
component makes things cleaner and easier when these situations occur.

It does add complexity. We have to continually inspect props and create a kind
of ES7 proxy to detect when dependent data loading occurs.

