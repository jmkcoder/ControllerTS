const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const GenerateControllerImportsPlugin = require('./scripts/generate-controller-imports');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/main.ts',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      publicPath: '/',
      clean: true
    },

    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                // Preserve decorator metadata for dependency injection
                compilerOptions: {
                  experimentalDecorators: true,
                  emitDecoratorMetadata: true,
                  target: 'ES2020',
                  module: 'ESNext'
                }
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.njk$/,
          type: 'asset/source',
          generator: {
            filename: 'templates/[name][ext]'
          }
        },
        {
          test: /\.(png|jpg|gif|svg|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name].[hash][ext]'
          }
        },
        {
          test: /\.env(\.[^.]*)?$/,
          type: 'asset/source'
        }
      ]
    },

    plugins: [
      new CleanWebpackPlugin(),
      
      new GenerateControllerImportsPlugin(),
      
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),

      new CopyWebpackPlugin({
        patterns: [
          // Copy all .njk template files preserving directory structure
          {
            from: 'src/views/',
            to: 'src/views/',
            context: '.'
          },
          {
            from: 'src/shared/',
            to: 'src/shared/',
            context: '.'
          },
          // Copy environment files
          {
            from: '.env*',
            to: '[name][ext]',
            noErrorOnMissing: true
          },
          // Copy public assets
          {
            from: 'public',
            to: '.',
            noErrorOnMissing: true
          }
        ]
      }),

      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
          chunkFilename: '[id].[contenthash].css'
        })
      ] : [])
    ],

    devServer: {
      port: 3000,
      open: true,
      hot: true,
      historyApiFallback: true,
      static: [
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/'
        }
      ],
      watchFiles: {
        paths: ['src/**/*'],
        options: {
          ignored: [
            '**/node_modules/**',
            '**/dist/**',
            '**/src/core/generated-controllers.ts' // Ignore auto-generated file
          ]
        }
      },
      setupMiddlewares: (middlewares, devServer) => {
        // Serve .njk template files
        devServer.app.get('/src/**/*.njk', (req, res) => {
          const templatePath = path.join(__dirname, req.path);
          const fs = require('fs');
          
          try {
            const content = fs.readFileSync(templatePath, 'utf8');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.send(content);
          } catch (err) {
            res.status(404).send('Template not found');
          }
        });

        // Serve .env files
        devServer.app.get('/\.env(\.[^.]*)?$/', (req, res) => {
          const envPath = path.join(__dirname, req.path.substring(1));
          const fs = require('fs');
          
          try {
            const content = fs.readFileSync(envPath, 'utf8');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.send(content);
          } catch (err) {
            res.status(404).send('Environment file not found');
          }
        });

        return middlewares;
      }
    },

    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          controllers: {
            test: /[\\/]src[\\/](controllers|admin[\\/]controller|features[\\/].*[\\/]controllers)[\\/]/,
            name: 'controllers',
            chunks: 'all',
            minChunks: 1
          }
        }
      }
    },

    // Enable dynamic imports and require.context
    experiments: {
      topLevelAwait: true
    }
  };
};
