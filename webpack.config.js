const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  // Webpack starts bundling the assets from the following file.
  // @see https://webpack.js.org/concepts/#entry
  entry: {
    bundle: './src/index.ts',
  },

  // Divi Visual Builder use of scripts that is already enqueued by WordPress and available
  // in global scope so those scripts don't need to be included on the bundle. For webpack
  // to recognize those files, the global variable needs to be registered as externals.
  // These allows global variable listed below to be imported into the module.
  // @see https://webpack.js.org/configuration/externals/#externals
  externals: {

    // Third party dependencies.
    jquery: 'jQuery',
    underscore: '_',
    lodash: 'lodash',
    react: ['vendor', 'React'],
    'react-dom': ['vendor', 'ReactDOM'],

    // WordPress dependencies.
    '@wordpress/i18n': ['vendor', 'wp', 'i18n'],

    // Divi dependencies.
    '@divi/data': ['divi', 'data'],
    '@divi/error-boundary': ['divi', 'errorBoundary'],
    '@divi/field-library': ['divi', 'fieldLibrary'],
    '@divi/global-layouts': ['divi', 'globalLayouts'],
    '@divi/modal': ['divi', 'modal'],
    '@divi/module-library': ['divi', 'moduleLibrary'],
    '@divi/module': ['divi', 'module'],
    '@divi/object-renderer': ['divi', 'objectRenderer'],
  },

  // This option determine how different types of module within the project will be treated.
  // @see https://webpack.js.org/configuration/module/
  module: {

    // This option sets up loaders for webpack configuration.
    // Loaders allow webpack to process various types because by default webpack only
    // understand JavaScript and JSON files.
    // @see https://webpack.js.org/concepts/#loaders
    rules: [
      // Handle `.tsx` and `.ts` files.
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },

      // Handle `.jsx` files.
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [

          // Spawns multiple processes and split work between them. This makes faster build.
          // @see https://webpack.js.org/loaders/thread-loader/
          {
            loader: 'thread-loader',
            options: {
              workers: - 1,
            },
          },

          // Transpiles JavaScript files using Babel. Translates newer syntax with less support
          // into older syntax with more support so the project can use newer syntax and have
          // them automatically translated into older syntax for compatibility suppoert.
          // @see https://www.npmjs.com/package/babel-loader
          // @see https://babeljs.io/
          {
            loader: 'babel-loader',
            options: {
              compact: false,
              presets: [

                // Preset that adds configuration for handling latest JavaScript syntax.
                // @see https://babeljs.io/docs/en/babel-preset-env
                ['@babel/preset-env', {
                  modules: false,
                  targets: '> 5%',
                }],

                // Preset that added configuration for handling react & JSX.
                // @see https://babeljs.io/docs/en/babel-preset-react
                '@babel/preset-react',
              ],
              plugins: [
                // Transform class properties syntax.
                // @see https://babeljs.io/docs/en/babel-plugin-proposal-class-properties
                '@babel/plugin-proposal-class-properties',
              ],
              cacheDirectory: false,
            },
          }
        ]
      },

      // Handle `.css` and `.scss` files.
      {
        test: /\.s?css$/i,
        use: [

          // Loader that enables imported css to be extracted and outputted into its own file.
          // @see https://webpack.js.org/plugins/mini-css-extract-plugin/#loader-options
          {
            loader: MiniCssExtractPlugin.loader,
          },

          // Loader that interprets @import and url() like import/require() and resolve them.
          // @see https://webpack.js.org/loaders/css-loader/
          {
            loader: 'css-loader',
            options: {
              url: false,
              importLoaders: 2,
            },
          },

          // Loader that loads SASS/SCSS and compiles it into CSS
          // @see https://webpack.js.org/loaders/sass-loader/
          {
            loader: 'sass-loader',
            options: {
            },
          },
        ],
      }
    ]
  },

  // Plugins alow webpack to perform wider range of tasks.
  plugins: [

    // Extract and output CSS into its own file.
    // @see https://webpack.js.org/plugins/mini-css-extract-plugin/
    new MiniCssExtractPlugin({
      filename: '../styles/[name].css',
    })
  ],

  // Determine how modules are resolved.
  // @see https://webpack.js.org/configuration/resolve/
  resolve: {
    // Allows extension to be leave off when importing.
    // @see https://webpack.js.org/configuration/resolve/#resolveextensions
    extensions: ['.js', '.jsx', '.tsx', '.ts'],
  },

  // Determine where the created bundles will be outputted.
  // @see https://webpack.js.org/concepts/#output
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'scripts'),
  },
};