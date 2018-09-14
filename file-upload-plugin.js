const csUtils = require('./utils/cs-upload')
let options = null

function FileUploadPlugin(op) {
  const { ENV, dirPath } = op
  options = op
}

FileUploadPlugin.prototype.apply = function (compiler) {
  compiler.plugin('done', function () {
    //todo 进行文件上传cdn操作 
    //1.上传文件
    const { dirPath } = options
    console.log(csUtils.searchFiles(dirPath))
  });
};

module.exports = FileUploadPlugin;