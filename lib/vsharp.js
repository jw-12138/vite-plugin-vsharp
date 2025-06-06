import { normalizePath } from 'vite';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import chalk from 'chalk';
import glob from 'glob';
import walk from './utils/walk.js';
import getViteVersion from './utils/getViteVersion.js';
import bytesToSize from './utils/bytesToSize.js';
let vite_version;
let config;
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
};
const extFunction = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.webp': 'webp'
};
const supportedFileExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
export default function vsharp(opts = {}) {
  const options = Object.assign({}, defaults, opts);
  return {
    name: 'vsharp',
    configResolved(res) {
      config = res;
      vite_version = vite_version ? parseInt(getViteVersion(config.root).replace(/^\D+/, '').split('.')[0]) : null;
    },
    writeBundle(op, bundle) {
      let outDir = op.dir;
      let keys = Object.keys(bundle);
      keys = keys.map(el => {
        return path.join(outDir, el);
      });
      let bundle_images = getImgs(keys, options);
      bundle_images.forEach(el => {
        vsharpIt(el, options);
      });
      let public_images = [];
      walk(path.normalize(config.publicDir), function (err, filesRec) {
        if (err) {
          if (err.code === 'ENOENT') {
            return null;
          }
          console.log('walk error: ', err);
          return null;
        }
        let excludedFiles = [];
        let includedFiles = [];
        let scanCount = 0;
        const processFiles = () => {
          let allImageFiles = filesRec.map(el => {
            let p = normalizePath(el);
            return p.replace(config.root + '/', '');
          }).filter(p => supportedFileExt.includes(path.extname(p)));
          let filteredFiles = allImageFiles.filter(file => {
            return !excludedFiles.some(pattern => file.startsWith(pattern.replace('*', '')) || file === pattern);
          });
          includedFiles.forEach(file => {
            if (!filteredFiles.includes(file)) {
              filteredFiles.push(file);
            }
          });
          filteredFiles.forEach(img => {
            let publicDir = normalizePath(config.publicDir).replace(config.root + '/', '');
            img = img.replace(publicDir, config.build.outDir);
            vsharpIt(img, options);
          });
        };
        const checkAndProcess = () => {
          scanCount++;
          if (scanCount === 2) {
            processFiles();
          }
        };
        if (options.excludePublic.length > 0) {
          options.excludePublic.forEach((rule, i) => {
            glob(rule, {
              root: options.root
            }, function (err, files) {
              if (err) {
                console.log(err);
                return false;
              }
              files.forEach(file => {
                excludedFiles.push(file);
              });
              if (i === options.excludePublic.length - 1) {
                checkAndProcess();
              }
            });
          });
        } else {
          scanCount++;
        }
        if (options.includePublic.length > 0) {
          options.includePublic.forEach((rule, i) => {
            glob(rule, {
              root: options.root
            }, function (err, files) {
              if (err) {
                console.log(err);
                return false;
              }
              files.forEach(file => {
                includedFiles.push(file);
              });
              if (i === options.includePublic.length - 1) {
                checkAndProcess();
              }
            });
          });
        } else {
          scanCount++;
        }
      });
    }
  };
}
function getImgs(data, opts) {
  let _imgs = [];
  data.forEach(el => {
    let thisExt = path.extname(el);
    let thisName;
    if (vite_version < 4) {
      thisName = path.basename(el).split('.');
    } else {
      thisName = path.basename(el).split('-');
    }
    thisName = thisName.reverse();
    thisName.splice(0, 2);
    thisName = thisName.join('');
    if (opts.exclude.includes(thisName + thisExt)) {
      return false;
    }
    if (supportedFileExt.includes(thisExt)) {
      el = normalizePath(el);
      el = el.replace(config.root + '/', '');
      _imgs.push(el);
    }
  });
  return _imgs;
}
function vsharpIt(img, opts) {
  let extname = path.extname(img);
  let sharp_function = extFunction[extname];
  if (!fs.existsSync(img)) {
    console.log(`vsharp: [${chalk.red(img)}] File does not exist, skipping...`);
    return;
  }
  let sharp_image = sharp(img, {
    animated: true
  });
  sharp_image.metadata().then(metadata => {
    let previousSize;
    try {
      previousSize = fs.statSync(img).size;
    } catch (err) {
      console.log(`vsharp: [${chalk.red(img)}] Cannot access file: ${err.message}`);
      return;
    }
    let currentWidth = metadata.width;
    let targetWidth = metadata.width;
    let targetHeight = metadata.height;
    if (opts.width !== undefined && opts.height !== undefined) {
      targetWidth = opts.width;
      targetHeight = opts.height;
    } else if (opts.width === undefined && opts.height === undefined) {
      targetWidth = metadata.width;
      targetHeight = metadata.height;
    } else if (opts.width !== undefined && opts.height === undefined) {
      targetWidth = opts.width;
      targetHeight = null;
    } else if (opts.width === undefined && opts.height !== undefined) {
      targetWidth = null;
      targetHeight = opts.height;
    }
    if (opts.scale !== undefined) {
      targetWidth = Math.floor(opts.scale * currentWidth);
      targetHeight = null;
    }
    let outBuffer = sharp_image;
    outBuffer = outBuffer.resize(targetWidth, targetHeight);
    outBuffer = outBuffer[sharp_function](opts[extname]);
    if (typeof opts.preserveMetadata === 'object') {
      let preservedMetadata = {};
      if (opts.preserveMetadata.orientation) {
        preservedMetadata.orientation = metadata.orientation;
      }
      outBuffer = outBuffer.withMetadata(preservedMetadata);
    }
    return outBuffer.toBuffer((err, buffer, info) => {
      if (err) {
        console.log(err);
      }
      let currentSize = info.size;
      if (previousSize < currentSize) {
        console.log(`vsharp: [${chalk.green(img)}], current size (${bytesToSize(currentSize)}) is bigger after <sharp> processed, skipping...`);
        return false;
      }
      fs.writeFile(img, buffer, {
        flag: 'w+'
      }, err => {
        if (err) {
          console.log(err);
          return;
        }
        let shrinkRatio = (-((previousSize - currentSize) / previousSize) * 100).toFixed(2);
        console.log(`vsharp: [${chalk.green(img)}] ${chalk.yellow(bytesToSize(previousSize))} <<${chalk.green(shrinkRatio + '%')}>> ${chalk.yellow(bytesToSize(currentSize))}`);
      });
    });
  });
}