import {normalizePath} from 'vite'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import chalk from 'chalk'
import glob from 'glob'
import mime from 'mime-types'

let config

const defaults = {
  scale: undefined,
  width: undefined,
  height: undefined,
  includePublic: [],
  excludePublic: [],
  exclude: [],
  '.jpg': {
    quality: 80
  },
  '.jpeg': {
    quality: 80
  },
  '.png': {
    quality: 80,
    palette: true
  },
  '.webp': {
    lossless: true
  }
}

const extFunction = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.webp': 'webp'
}

const supportedFileExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

const walk = function (dir, done) {
  var results = []
  fs.readdir(dir, function (err, list) {
    if (err) return done(err)
    var i = 0
    ;(function next() {
      var file = list[i++]
      if (!file) return done(null, results)
      file = path.join(dir, file)
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res)
            next()
          })
        } else {
          results.push(file)
          next()
        }
      })
    })()
  })
}

export default function vsharp(opts = {}) {
  const options = Object.assign({}, defaults, opts)
  return {
    name: 'vsharp',
    configResolved(res) {
      config = res
    },
    // configureServer(server){
    //   server.middlewares.use((req, res, next) => {
    //     let p = normalizePath(config.publicDir) + req._parsedUrl.pathname
    //     p = p.replace(config.root + '/', '')
    //     let thisExtname = path.extname(p)
    //     if(supportedFileExt.includes(thisExtname)){
    //       sendBuffer(req, res, next, p, options)
    //       return false
    //     }
    //
    //     next()
    //   })
    // },
    writeBundle(op, bundle) {
      let outDir = op.dir
      let keys = Object.keys(bundle)
      keys = keys.map((el) => {
        return path.join(outDir, el)
      })

      let bundle_images = getImgs(keys, options)
      bundle_images.forEach((el) => {
        vsharpIt(el, options)
      })

      let public_images = []
      walk(path.normalize(config.publicDir), function (err, filesRec) {
        if (err) {
          console.log(err)
          return null
        }

        let excludedFiles = []
        let includedFiles = []

        let scanCount = 0

        let doSharp = function () {
          filesRec.forEach(el => {
            let p = normalizePath(el)
            let relative_p = p.replace(config.root + '/', '')

            if (excludedFiles.includes(relative_p)) {
              return false
            }

            let thisExtname = path.extname(relative_p)

            if (supportedFileExt.includes(thisExtname)) {
              public_images.push(relative_p)
            }
          })

          public_images = public_images.concat(includedFiles)
          public_images = [...new Set(public_images)]

          public_images.forEach(img => {
            let publicDir = normalizePath(config.publicDir).replace(config.root + '/', '')
            img = img.replace(publicDir, config.build.outDir)
            vsharpIt(img, options)
          })
        }

        if (options.excludePublic.length === 0) {
          doSharp()
        }

        options.includePublic.forEach((rule, i) => {
          glob(rule, {
            root: options.root
          }, function (err, files) {
            if (err) {
              console.log(err)
              return false
            }
            files.forEach(file => {
              includedFiles.push(file)
            })

            if (i === options.includePublic.length - 1) {
              scanCount++

              if (scanCount === 2) {
                doSharp()
              }
            }
          })
        })

        options.excludePublic.forEach((rule, i) => {
          glob(rule, {
            root: options.root
          }, function (err, files) {
            if (err) {
              console.log(err)
              return false
            }
            files.forEach(file => {
              excludedFiles.push(file)
            })

            if (i === options.excludePublic.length - 1) {
              scanCount++

              if (scanCount === 2) {
                doSharp()
              }
            }
          })
        })
      })
    }
  }
}

function sendBuffer(req, res, next, p, opts) {
  let search = req._parsedUrl.search.split('?')
  search = search[1]
  let searchObject = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')

  console.log(searchObject)
}

function getImgs(data, opts) {
  let _imgs = []
  data.forEach((el) => {
    let thisExt = path.extname(el)
    let thisName = path.basename(el).split('.')

    thisName = thisName.reverse()
    thisName.splice(0, 2)
    thisName = thisName.join('')

    if (opts.exclude.includes(thisName + thisExt)) {
      return false
    }

    if (supportedFileExt.includes(thisExt)) {
      el = normalizePath(el)
      el = el.replace(config.root + '/', '')
      _imgs.push(el)
    }
  })

  return _imgs
}

function vsharpIt(img, opts) {
  let extname = path.extname(img)
  let sfunc = extFunction[extname]

  let s_img = sharp(img, { animated: true })

  s_img.metadata().then(metadata => {
    let beforeSize = fs.statSync(img).size
    let currentWidth = metadata.width
    let targetWidth = metadata.width
    let targetHeight = metadata.height

    if (opts.width !== undefined && opts.height !== undefined) {
      targetWidth = opts.width
      targetHeight = opts.height
    } else if (opts.width === undefined && opts.height === undefined) {
      targetWidth = metadata.width
      targetHeight = metadata.height
    } else if (opts.width !== undefined && opts.height === undefined) {
      targetWidth = opts.width
      targetHeight = null
    } else if (opts.width === undefined && opts.height !== undefined) {
      targetWidth = null
      targetHeight = opts.height
    }

    if (opts.scale !== undefined) {
      targetWidth = Math.floor(opts.scale * currentWidth)
      targetHeight = null
    }

    return s_img.resize(targetWidth, targetHeight)[sfunc](opts[extname]).toBuffer((err, buffer, info) => {
      if (err) {
        console.log(err)
      }

      let currentSize = info.size

      if (beforeSize < currentSize) {
        console.log(
          `vsharp: [${chalk.green(img)}], current size (${bytesToSize(currentSize)}) is bigger after <sharp> processed, skipping...`
        )
        return false
      }
      fs.writeFile(img, buffer, {flag: 'w+'}, (err) => {
        if (err) {
          console.log(err)
          return
        }

        let shrinkRatio = (
          -((beforeSize - currentSize) / beforeSize) * 100
        ).toFixed(2)

        console.log(
          `vsharp: [${chalk.green(img)}] ${chalk.yellow(
            bytesToSize(beforeSize)
          )} <<${chalk.green(shrinkRatio + '%')}>> ${chalk.yellow(
            bytesToSize(currentSize)
          )}`
        )
      })
    })
  })
}

function vsharpDev(img, opts) {
  let extname = path.extname(img)
  let sfunc = extFunction[extname]

  sharp(img)
    [sfunc](opts[extname]).toBuffer((err, buffer, info) => {
    if (err) {
      console.log(err)
    }
    let beforeSize = fs.statSync(img).size
    let currentSize = info.size

    if (beforeSize < currentSize) {
      console.log(
        `vsharp: [${chalk.green(img)}], current size is bigger after <sharp> processed, skipping...`
      )
      return false
    }

  })
}

let units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

function bytesToSize(x) {
  let l = 0,
    n = parseInt(x, 10) || 0

  while (n >= 1024 && ++l) {
    n = n / 1024
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]
}
