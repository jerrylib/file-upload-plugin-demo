const fs = require('fs')
const path = require('path')

const cleanCsPath = (path) => {
  console.log('清除cs路径成功')
}

const searchFiles = (dirPath, excludePath = []) => {
  console.log(`路径下${dirPath}，成功读取待上传文件多少个`)
  const filePaths = []
  fs.readdir(dirPath, (err, data) => {
    if (err) return
    data.forEach((fp) => {
      const p = path.join(dirPath, fp)
      fs.stat(p, (err, stats) => {
        if (err) return
        if (stats.isFile()) {
          if (excludePath.every(ep => p.toLowerCase().indexOf(ep) === -1)) {
            filePaths.push(p)
          }
        }
        if (stats.isDirectory()) {
          if (excludePath.every(ep => p.toLowerCase().indexOf(ep) === -1)) {
            filePaths.concat(searchFiles(p, excludePath))
          }
        }
      })
    })
    return filePaths
  })
}

module.exports = {
  cleanCsPath, searchFiles
}