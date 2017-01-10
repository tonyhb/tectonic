# Status API

Status classes are automatically injected for every query you make within the
`@load` decorator.

They're a basic class with only a few attributes, letting you know whether each
query is pending, successful or failed.

The basic definition is this: 

```js
class Status {
  const status = <'PENDING' | 'SUCCESS' | 'ERROR'>'

  // code stores the HTTP status code for the request
  const code;

  // error represents the error as returned from the driver
  const error;

  isPending() => this.status === 'PENDING';
  isSuccess() => this.status === 'SUCCESS';
  isError() => this.status === 'ERROR';
}
```

Normally you'd use `this.props.status.myQuery.isPending()` to show a loading
state, and `.isError()` to detect when things go wrong. Not so complex to
deal with.
