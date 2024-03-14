const CopyWebpackPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const path = require('path');

module.exports = {
  entry: './src/bootstrap.ts',
  devtool: 'source-map',
  performance: {
    maxAssetSize: 20971520,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: 'tsconfig.json' })],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/index.html",
          to: "index.html"
        },
        {
          from: "../data/out.lvk88",
          to: "out.lvk88"
        },
        {
          from: "../data/u2netp.onnx",
          to: "u2netp.onnx"
        },
        {
          from: "node_modules/onnxruntime-web/dist/*.wasm",
          to: "./[name][ext]"
        }
      ],
    }),
  ],
  experiments:{
    asyncWebAssembly: true
  }
};
