# tectonic-superagent

A superagent driver for [tectonic](https://github.com/tonyhb/tectonic).

# Usage


Basic usage:

```js
const manager = new Manager({
  drivers: {
    fromSuperagent: new TectonicSuperagent()
});
```

Customization - all keys are optional:

```js
const manager = new Manager({
  drivers: {
    fromSuperagent: new TectonicSuperagent({
	  // custom request modifier, used to manipulate the superagent request
	  // before it's sent over.
	  request: (r) => r.set('Authorization', 'Bearer xyz'),
	  // custom callback called with superagent err each time a request fails.
	  // useful if you need to intercept 401 errors to redirect to a login page,
	  // for example.
	  onError: (err) => {}
	})
  }
});
```
