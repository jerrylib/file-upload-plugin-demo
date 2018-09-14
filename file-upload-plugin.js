const csUtils = require('./utils/cs-upload')
console.log('csUtils=', csUtils)

function FileUploadPlugin(options) {
  const { ENV } = options
  console.log('ENV =', ENV)
}

FileUploadPlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', function () {
    console.log('FileUploadPlugin done');
    //todo 进行文件上传cdn操作 
    //1.清除文件
    csUtils.cleanCsPath()
    //2.上传文件
    csUtils.searchFiles()
  });
};

module.exports = FileUploadPlugin;