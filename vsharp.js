import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import chalk from 'chalk'

const defaults = {
  exclude: [],
  '.jpg': {
    quality: 80
  },
  '.jpeg': {
    quality: 80
  },
  '.png': {
    compressionLevel: 9,
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

export default function vsharp(opts = {}) {
  const options = Object.assign({}, defaults, opts)
  return {
    name: 'vsharp',
    apply: 'build',
    writeBundle(op, bundle) {
      let outDir = op.dir
      let keys = Object.keys(bundle)
      keys = keys.map((el) => {
        return path.join(outDir, el)
      })

      let images = getImgs(keys, options)
      images.forEach((el) => {
        vsharpIt(el, options)
      })
    }
  }
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
      _imgs.push(el)
    }
  })

  return _imgs
}

function vsharpIt(img, opts) {
  let extname = path.extname(img)
  let sfunc = extFunction[extname]

  sharp(img)
    [sfunc](opts[extname])
    .toBuffer((err, buffer, info) => {
      if (err) {
        console.log(err)
      }
      let beforeSize = fs.statSync(img).size
      let currentSize = info.size

      if (beforeSize < currentSize) {
        console.log(
          `[${chalk.green(img)}], current size is bigger after <sharp> processed, skipping...`
        )
        return false
      }
      fs.writeFile(img, buffer, { flag: 'w+' }, (err) => {
        if (err) {
          console.log(err)
          return
        }

        let shrinkRatio = (
          -((beforeSize - currentSize) / beforeSize) * 100
        ).toFixed(2)

        console.log(
          `[${chalk.green(img)}] optimized, ${chalk.yellow(
            bytesToSize(beforeSize)
          )} <<${chalk.green(shrinkRatio + '%')}>> ${chalk.yellow(
            bytesToSize(currentSize)
          )}`
        )
      })
    })
}

let units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
function bytesToSize(x) {
  let l = 0,
    n = parseInt(x, 10) || 0

  while (n >= 1024 && ++l) {
    n = n / 1024
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]
}
