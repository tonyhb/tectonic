# Queries

## Basic GET queries

Once you've got the setup sorted you're only ever going to need to write
queries for your data.  Let's get started with a simple query to load
our user:

```
// components/user.js
import React, { PureComponent, PropTypes } from 'react';

// tectonic
import load, { Status } from 'tectonic';
import UserModel from '../models/user.js';

// We use the @load decorator to dispatch a query for a single user item.
//
// The query instance itself is returned from `UserModel.getItem` on the model
// itself.  `getItem` returns a query for a single model item, whereas `getList`
// returns a query specifying that we need a list of items.
//
// The object passed into `getItem` and `getList` are query parameters used in
// the API call. For this reason you need to know the sources that you want to
// hit, along with their required parameters.  If a source definition has
// required parameters that aren't specified here when creating the query the
// source will never be called (as it doesn't pass validation tests).
//
// Finally, remember how we specified the queryType of sources?  The `getItem`
// and `getList` functions specify a queryType of 'GET', so only API endpoints
// that return data will be considered.
@load((props) => ({
  user: UserModel.getItem({ id: props.userId }),
  posts: PostModel.getList({ userId: props.userId }),
}))
class UserWrapper extends PureComponent {
  static propTypes = {
    // automatically injected status models, containing the http response
    // code, any error messages, and the overall status of the query
    status: PropTypes.shape({
      user: PropTypes.instanceOf(Status),
      posts: PropTypes.instanceOf(Status),
    }),
    // the data loaded via tectonic
    user: PropTypes.instanceOf(UserModel),
    posts: PropTypes.arrayOf(PropTypes.instanceOf(UserModel)),
  }

  render() {
    // ...
  }
}
```

Pretty simple, eh?  The core part of loading data is `${model}.getItem` or
`${model.getList}`.  Here's an overview of what happens in the background:

1. The query created by your model (eg. `getItem`) is added to the resolver's
   queue.
2. Queries are automatically deduplicated (eg. 100 components can request the
   same user using the same params, and only one request will be made)
3. After all components have mounted the resolver begins its resolution of each
   query:
     1. We check each query to see if we have cached data already available to
        skip unnecessary API requests. If so, this data is passed to the
	component
     2. Attempt to find a valid source definition for the API query, given the
        query type, params and model requested.  If no source definition can be
	found a warning is thrown
     3. When a source definition is found we invoke the source's driver with
        the source and query information
     4. The driver performs its logic and calls an onSuccess or onError
        function; this updates the status of the query in Tectonic and is
	reflected in your component
     5. On success caching information is passed from the driver's response,
        data is saved to the tectonic reducer and finally data is passed in to
	your component.

There's more that goes into each of this, though that's the general overview and
is most of what you need to know.  The full explanation of both the decorator
and resolution process is explained in the INTERNALS section of the
documentation.

Before you continue, it's important to note:

**The resolver ignores any queries which have undefined parameters!**  If you
have params in `getItem` or `getList` which are undefined the query will be
skipped.

This is to enable dependent data loading, which we explain next.
