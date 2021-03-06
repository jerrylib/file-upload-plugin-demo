const path = require('path')
const fs = require('fs-extra')
const FormData = require('form-data')
const fetch = require('node-fetch')
const args = require('minimist')(process.argv.slice(2))
// const getMD5Value = require('./src/utils/mod_nd_md5.js')
const env = args.env || 'sdp'
// 要上传的目录, 来自参数, 最好保证目录名独一无二, 不然有可能找不到文件
const WEBAPPDIR = args.filepath || './../dist/'
const basePath = path.join(__dirname, WEBAPPDIR)
const excludePath = ['index.html', 'web-inf']
const server = {
  login_name: 'waf_loginer',
  password: 'E10ADC3949BA59ABBE56E057F20F883E'
}
// 各环境地址配置
const devCdnObj = {
  ucUrl: 'https://ucbetapi.101.com',
  urlHost: 'http://sdpcs.beta.web.sdp.101.com',
  serviceName: 'dev_content_baike_cdn', // 服务名
  uploadOrigin: 'http://betacs.101.com',
  deletePath: ['assets', 'polyfill'],
  body: {
    'path': '/dev_content_baike_cdn', // 服务路径
    'service_id': 'f8eae33b-d232-4685-9eb6-55c5073b48f2', // 服务id
    'uid': '170839', // 开通者的user_id
    'role': 'user'
  },
  headers: {
    'Content-Type': 'application/json',
    // Authorization: 'Bearer "8F0C3D3EB35559D7B42DA5F5B552D6BFBD0D9E512276DB3C026BB31F52AE8CE8B7A41A9FC2E54857-00000000"'
  }
}
const debugCdnObj = {
  ucUrl: 'https://ucbetapi.101.com',
  urlHost: 'http://sdpcs.beta.web.sdp.101.com',
  serviceName: 'qa_content_baike_cdn',
  uploadOrigin: 'http://betacs.101.com',
  deletePath: ['assets', 'polyfill'],
  body: {
    'path': '/qa_content_baike_cdn',
    'service_id': '9a10aaaf-5f36-49ac-9835-4c17d5d34548',
    'uid': '170839',
    'role': 'user'
  },
  headers: {
    'Content-Type': 'application/json',
    // Authorization: 'Bearer "8F0C3D3EB35559D7B42DA5F5B552D6BFBD0D9E512276DB3C026BB31F52AE8CE8B7A41A9FC2E54857-00000000"'
  }
}
// 预生产开通cdn似乎没用, 因为与master是一个分支, 只需编译一次
const preCdnObj = {
  ucUrl: 'https://ucbetapi.101.com',
  urlHost: 'http://sdpcs.beta.web.sdp.101.com',
  serviceName: 'preproduction_content_baike_cdn',
  uploadOrigin: 'http://betacs.101.com',
  deletePath: ['polyfill'],
  body: {
    'path': '/preproduction_content_baike_cdn',
    'service_id': '6b9ada5a-d74e-4d94-ae4f-fee4d39dc563',
    'uid': '170839',
    'role': 'user'
  },
  headers: {
    'Content-Type': 'application/json',
    // Authorization: 'Bearer "8F0C3D3EB35559D7B42DA5F5B552D6BFE56F93505FC39E2C36D236362189C33CDB0565EA5958F2A7-00000000"'
  }
}
const productionCdnObj = {
  ucUrl: 'https://aqapi.101.com',
  urlHost: 'http://cs.101.com',
  serviceName: 'production_content_baike_cdn',
  uploadOrigin: 'http://cs.101.com',
  deletePath: ['polyfill'],
  body: {
    'path': '/production_content_baike_cdn',
    'service_id': 'd3e391f4-7f26-4be9-a4d3-686d5228a557',
    'uid': '170839',
    'role': 'user'
  },
  headers: {
    'Content-Type': 'application/json',
    // Authorization: 'Bearer "62685084C100CF2E965BB3FDA6C717CC1D82A18A6F7317204A9274016978B3FA5EF5F99FB770CA7B-00000000"'
  }
}
// 各环境map
const envs = {
  dev: devCdnObj,
  debug: debugCdnObj,
  beta: preCdnObj,
  sdp: productionCdnObj
}
const users = {
  dev: server,
  debug: server,
  beta: server,
  sdp: server
}
// 环境匹配
debugger
let cdnUrlObj = envs[env]
getBearToken(cdnUrlObj)
// 获取服务端token
function getBearToken(object0) {

  fetch(`${object0.ucUrl}/v0.6/bearer_tokens`, {
    method: 'POST',
    body: JSON.stringify(users[env])
  }).then(res => res.json()).then((bear) => {
    if (bear.access_token) {
      object0.headers['Authorization'] = 'Bearer "' + bear.access_token + '"'
      getUploadSession(object0)
    } else {
      console.log(`登录失败${bear.message}`)
    }
  })
}
// 获取上传CDN session
function getUploadSession(object) {
  return fetch(object.urlHost + '/v0.1/sessions', {
    method: 'POST',
    body: JSON.stringify(object.body),
    headers: object.headers
  }).then(res => res.json()).then(data => {
    deleOriginFolder(data)
  })
}
function deleteOriginAssets(requestParams, cdnUrlObj) {
  return cdnUrlObj.deletePath.map(dp => {
    return {
      folder: dp,
      promise: fetch(`${cdnUrlObj.urlHost}/v0.1/static/${cdnUrlObj.serviceName}/${dp}?session=${requestParams.session}`, {
        method: 'DELETE'
      }).then(res => res.ok ? ({ ok: true }) : res.json())
    }
  })
}

// 删除已存在的打包文件夹
function deleOriginFolder(data) {
  const requestParams = {
    session: data.session,
    serviceName: cdnUrlObj.serviceName
  }
  let dentryIds = []
  // 删除远端assets
  function multiDele(callback) {
    return function (requestParams, dentryIds, cdnUrlObj) {
      let objArr = deleteOriginAssets(requestParams, cdnUrlObj)
      let done = 0
      objArr.forEach((doa, index, arr) => {
        return doa.promise.then(data => {
          console.log(`远端文件夹${doa.folder}删除结果: `, data.ok ? ' 删除成功' : `删除失败 =>${data.message}`)
          ++done
          if (done === arr.length) {
            callback(requestParams, dentryIds)
          }
        })
      })
    }
  }
  multiDele(queueUpload)(requestParams, dentryIds, cdnUrlObj)
}

// 将wepapp下所有的文件上传至cs
function queueUpload(requestParams, dentryIds) {
  let filePaths = [] // 文件路径队列
  handleDir(basePath)
  setTimeout(() => {
    console.log(`1s读取了${basePath}下的${filePaths.length}个文件, 开始上传`)
    upLoad()
  }, 1000)
  // 构建文件上传队列
  function upLoad() {
    let fp = filePaths.shift() // filepath
    let t = 0
    if (fp) {
      sendData(fp, requestParams, upLoad, dentryIds)
    }
    if (!fp && t <= 1000) {
      timeOut()
    }
    function timeOut() {
      if (t <= 1000) {
        setTimeout(() => {
          if (filePaths.length) {
            upLoad()
          } else {
            t += 100
            timeOut()
          }
        }, 100)
      }
    }
  }
  // 目录文件读取
  function handleDir(basePath) {
    fs.readdir(basePath, (err, data) => {
      if (err) return
      data.forEach((fp) => {
        const p = path.join(basePath, fp)
        fs.stat(p, (err, stats) => {
          if (err) return
          if (stats.isFile()) {
            if (excludePath.every(ep => p.toLowerCase().indexOf(ep) === -1)) {
              filePaths.push(p)
            }
          }
          if (stats.isDirectory()) {
            if (excludePath.every(ep => p.toLowerCase().indexOf(ep) === -1)) {
              handleDir(p)
            }
          }
        })
      })
    })
  }
}
// 上传一个文件
function sendData(filePath, requestParams, callback, dentryIds) {
  if (!filePath) {
    return
  }
  let serverPath = ''
  const splitPath = filePath.replace(/(\\)/g, '/').split(WEBAPPDIR.replace(/(\.+\/)/g, ''))[1]
  const relativePath = splitPath.split('/')
  const fileName = relativePath[relativePath.length - 1].replace(/\//g, '').replace(/(\\)/g, '')
  if (relativePath.length > 1) {
    serverPath = relativePath.slice(0, relativePath.length - 1).join('/')
  }
  let form = new FormData()
  form.append('path', `${cdnUrlObj.body.path}` + serverPath)
  form.append('filePath', `${cdnUrlObj.body.path}` + splitPath)
  form.append('name', fileName)
  form.append('scope', 1)
  form.append('serviceName', requestParams.serviceName)
  form.append('file', fs.createReadStream(filePath))
  fetch(cdnUrlObj.uploadOrigin + '/v0.1/upload?session=' + requestParams.session + '&serviceName=' + requestParams.serviceName, {
    method: 'POST',
    body: form
  }).then(res => res.json()).then(function (data) {
    const msg = {
      dev: '开发',
      debug: '测试',
      beta: '预生产',
      sdp: '生产'
    }
    dentryIds.push(data.dentry_id)
    console.log(fileName + '上传完成,  已上传' + msg[env] + 'CDN的文件个数: ', dentryIds.length)
    if (typeof callback === 'function') {
      callback()
    }
  }).catch(err => console.log(err))
}
