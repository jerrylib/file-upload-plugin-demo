const FileUploadPlugin = require('./file-upload-plugin')
const config = require('./config')
module.exports = {
  entry: './index.js',
  mode: 'production',
  output: {
    filename: '[name]-[hash:8].js',
    path: __dirname + '/dist'
  },
  plugins: [
    new FileUploadPlugin({ ENV: 'debug', ...config })
  ],
  devtool: 'source-map'
}