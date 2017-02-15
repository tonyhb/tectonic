const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');

// In development, create a fake API server to use as a mock endpoint.
// This allows us to build the UI whilst the backend team work on the API,
// given they follow the same spec/contract.  Muy bonito.
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('mock.db.json');

server.use(jsonServer.rewriter({
  '/api/v0/pages/:foo/:resource/:id': '/api/v0/:resource/:id',
}));

// define custom endpoints to match the backend API
server.use(jsonServer.defaults());
server.use('/api/v0/', router);

// Add webpack dev server HMR entrypoints
config.entry.app.unshift("webpack-dev-server/client?http://localhost:8080/", "webpack/hot/only-dev-server");
// add HMR
config.plugins.push(new webpack.HotModuleReplacementPlugin());
// And finally, add 'react-hot-loader/webpack' to JS loaders
config.module.loaders[0].loaders.push('react-hot-loader/webpack');

new WebpackDevServer(
  webpack(config),
  Object.assign({}, config.devServer)
).listen(8080, '0.0.0.0', (err, result) => {
  if (err) {
    console.log('error', err);
    return
  }
  console.log('listening at 0.0.0.0:8080');
  console.log('mock API starting at 0.0.0.0:8081');
  server.listen(8081);
});
