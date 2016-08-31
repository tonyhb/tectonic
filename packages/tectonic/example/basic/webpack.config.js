var path = require('path');
var webpack = require('webpack');

var resolve = {
  extensions: ['', '.js', '.jsx', 'jsx', 'js', '.css'],
  fallback: path.join(__dirname, 'node_modules'),
  root: path.join(__dirname, 'src', 'scripts'),
};

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:3000', // WebpackDevServer host and port
      './src/scripts/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    sourceMapFileName: 'bundle.map',
    publicPath: '/public/' // Used in webpack-dev-server as the directory for bundle.js
  },
  resolve: resolve,
  resolveLoader: resolve,
  module: {
    loaders: [
      // Foregoing postcss for now. Much love to the PostCSS project though!
      // You should use it.
      { test: /\.css$/, loader: "style-loader!css-loader?modules&importLoaders=1" },
      {
        test: /\.jsx?$/,
        loaders: ['babel-loader'],
        include: path.join(__dirname, 'src')
      }
    ]
  }
};
