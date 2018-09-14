const FileUploadPlugin = require('./file-upload-plugin')


module.exports = {
  entry: './index.js',
  mode: 'production',
  output: {
    filename: '[name]-[hash:8].js',
    path: __dirname + '/dist'
  },
  plugins: [
    new FileUploadPlugin({ ENV: 'debug' })
  ],
  devtool: 'source-map'
}