const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    bundle: './src/index.js',
  },
  externals: {
    // Third party dependencies.
    jquery: 'jQuery',
    underscore: '_',
    lodash: 'lodash',
    react: 'React',
    'react-dom': 'ReactDOM',

    // WordPress dependencies.
    '@wordpress/i18n': ['wp', 'i18n'],

    // Divi dependencies.
    '@divi/data': ['divi', 'data'],
    '@divi/error-boundary': ['divi', 'errorBoundary'],
    '@divi/modal': ['divi', 'modal'],
    '@divi/object-renderer': ['divi', 'objectRenderer'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              workers: - 1,
            },
          },
          {
            loader: 'babel-loader',
            options: {
              compact: false,
              presets: [
                ['@babel/preset-env', {
                  modules: false,
                  targets: '> 5%',
                }],
                '@babel/preset-react',
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
              ],
              cacheDirectory: false,
            },
          }
        ]
      },
      {
        test: /\.s?css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              url: false,
              importLoaders: 2,
            },
          },
          {
            loader: 'sass-loader',
            options: {
            },
          },
        ],
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '../styles/[name].css',
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'scripts'),
  },
};