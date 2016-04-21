var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

// Create a fake API server for the demo. Thanks, json-server, you're fucking
// helpful
var jsonServer = require('json-server')
var server = jsonServer.create()
server.use(jsonServer.defaults())
var router = jsonServer.router('db.json')
server.use(router)

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: false,
  contentBase: "./src/"
}).listen(3000, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }
  console.log('Listening at localhost:3000');
  console.log('API starting on localhost:3001');
  server.listen(3001);
});
