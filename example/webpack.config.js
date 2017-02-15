const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// postcss
const stylelint = require('stylelint');

module.exports = {
  devtool: isProd ? 'hidden-source-map' : 'eval',
  context: __dirname,
  entry: {
    app: ['./src/index.js'],
  },
  output: {
    path: path.join(__dirname, './build'),
    publicPath: '/assets/',
    filename: 'app.js'
  },
  devServer: {
    hot: true,
    contentBase: './build/',
    publicPath: 'https://localhost:8080/assets/',
    hot: true,
    progress: true,
    historyApiFallback: true,
    stats: { chunks: false },
  },
  module: {
    preLoaders: [
      // JS should be the first loader for dev-server.js
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loaders: [
          'eslint-loader',
        ]
      },
    ],
    loaders: [
      // JS should be the first loader for dev-server.js
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loaders: [
          'babel-loader',
        ]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style',
          loader: 'css?modules!postcss',
        })
      },
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modules: [
      path.resolve('./client'),
      'node_modules'
    ]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: 'styles.css',
      allChunks: true,
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(nodeEnv),
      }
    }),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      },
      sourceMap: false
    }),
  ],
  postcss: () => [
    stylelint({
      "extends": "stylelint-config-standard",
      "rules": {
        "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
        "number-leading-zero": ["never"],
      }
    }),
    require("postcss-reporter")({
      clearMessages: true,
    }),
    require("postcss-nested"),
    require('postcss-assets')({
      loadPaths: ['./build/img', './build/svg'],
    }),
    require('postcss-svgo')(),
    require('lost'),
  ],
};
