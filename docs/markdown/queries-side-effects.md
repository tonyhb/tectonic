# Queries with side effects

Tectonic also allows you to create, update and delete records using your REST
API.  It's a little more involved than using the decorator to load data, though
it's still quick and easy.

When you create, update and delete records using tectonic the internal state of
the reducer is updated, so all components will re-render with new data as
necessary without reloading any data.

## Using `this.props.query` to create queries with side effects 
