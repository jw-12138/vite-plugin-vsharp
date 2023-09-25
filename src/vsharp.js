import {normalizePath} from 'vite'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import chalk from 'chalk'
import glob from 'glob'

import {walk} from './utils/walk'
import {getViteVersion} from './utils/getViteVersion'
import {bytesToSize} from './utils/bytesToSize'

let vite_version
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
  },
  preserveMetadata: {
    orientation: false,
    icc: false,
    exif: false
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

export default function vsharp(opts = {}) {
  const options = Object.assign({}, defaults, opts)
  return {
    name: 'vsharp',
    configResolved(res) {
      config = res
      vite_version = vite_version
        ? parseInt(
          getViteVersion(config.root).replace(/^\D+/, '').split('.')[0]
        )
        : null
    },
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
          if (err.code === 'ENOENT') {
            console.log(chalk.yellow('vsharp: no public directory'))
            return null
          }
          console.log('walk error: ', err)
          return null
        }

        let excludedFiles = []
        let includedFiles = []

        let scanCount = 0

        let doSharp = function () {
          filesRec.forEach((el) => {
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

          public_images.forEach((img) => {
            let publicDir = normalizePath(config.publicDir).replace(
              config.root + '/',
              ''
            )
            img = img.replace(publicDir, config.build.outDir)
            vsharpIt(img, options)
          })
        }

        if (options.excludePublic.length === 0) {
          doSharp()
        }

        options.includePublic.forEach((rule, i) => {
          glob(
            rule,
            {
              root: options.root
            },
            function (err, files) {
              if (err) {
                console.log(err)
                return false
              }
              files.forEach((file) => {
                includedFiles.push(file)
              })

              if (i === options.includePublic.length - 1) {
                scanCount++

                if (scanCount === 2) {
                  doSharp()
                }
              }
            }
          )
        })

        options.excludePublic.forEach((rule, i) => {
          glob(
            rule,
            {
              root: options.root
            },
            function (err, files) {
              if (err) {
                console.log(err)
                return false
              }
              files.forEach((file) => {
                excludedFiles.push(file)
              })

              if (i === options.excludePublic.length - 1) {
                scanCount++

                if (scanCount === 2) {
                  doSharp()
                }
              }
            }
          )
        })
      })
    }
  }
}

function getImgs(data, opts) {
  let _imgs = []
  data.forEach((el) => {
    let thisExt = path.extname(el)
    let thisName
    if (vite_version < 4) {
      thisName = path.basename(el).split('.')
    } else {
      thisName = path.basename(el).split('-')
    }

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

  let s_img = sharp(img, {animated: true})

  s_img.metadata().then((metadata) => {
    let previousSize = fs.statSync(img).size
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

    let outBuffer = s_img
    outBuffer = outBuffer.resize(targetWidth, targetHeight)
    outBuffer = outBuffer[sfunc](opts[extname])

    if (typeof opts.preserveMetadata === 'object') {
      let preservedMetadata = {}
      if (opts.preserveMetadata.orientation) {
        preservedMetadata.orientation = metadata.orientation
      }

      if (opts.preserveMetadata.icc) {
        preservedMetadata.icc = metadata.icc
      }

      if (opts.preserveMetadata.exif) {
        preservedMetadata.exif = metadata.exif
      }

      outBuffer = outBuffer.withMetadata(preservedMetadata)
    }

    return outBuffer.toBuffer((err, buffer, info) => {
      if (err) {
        console.log(err)
      }

      let currentSize = info.size

      if (previousSize < currentSize) {
        console.log(
          `vsharp: [${chalk.green(img)}], current size (${bytesToSize(
            currentSize
          )}) is bigger after <sharp> processed, skipping...`
        )
        return false
      }
      fs.writeFile(img, buffer, {flag: 'w+'}, (err) => {
        if (err) {
          console.log(err)
          return
        }

        let shrinkRatio = (
          -((previousSize - currentSize) / previousSize) * 100
        ).toFixed(2)

        console.log(
          `vsharp: [${chalk.green(img)}] ${chalk.yellow(
            bytesToSize(previousSize)
          )} <<${chalk.green(shrinkRatio + '%')}>> ${chalk.yellow(
            bytesToSize(currentSize)
          )}`
        )
      })
    })
  })
}
