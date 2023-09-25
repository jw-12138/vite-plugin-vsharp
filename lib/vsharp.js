"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = vsharp;

var _vite = require("vite");

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _sharp = _interopRequireDefault(require("sharp"));

var _chalk = _interopRequireDefault(require("chalk"));

var _glob = _interopRequireDefault(require("glob"));

var _walk = require("./utils/walk");

var _getViteVersion = require("./utils/getViteVersion");

var _bytesToSize = require("./utils/bytesToSize");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var vite_version;
var config;
var defaults = {
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
};
var extFunction = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.webp': 'webp'
};
var supportedFileExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function vsharp() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var options = Object.assign({}, defaults, opts);
  return {
    name: 'vsharp',
    configResolved: function configResolved(res) {
      config = res;
      vite_version = vite_version ? parseInt((0, _getViteVersion.getViteVersion)(config.root).replace(/^\D+/, '').split('.')[0]) : null;
    },
    writeBundle: function writeBundle(op, bundle) {
      var outDir = op.dir;
      var keys = Object.keys(bundle);
      keys = keys.map(function (el) {
        return _path["default"].join(outDir, el);
      });
      var bundle_images = getImgs(keys, options);
      bundle_images.forEach(function (el) {
        vsharpIt(el, options);
      });
      var public_images = [];
      (0, _walk.walk)(_path["default"].normalize(config.publicDir), function (err, filesRec) {
        if (err) {
          if (err.code === 'ENOENT') {
            console.log(_chalk["default"].yellow('vsharp: no public directory'));
            return null;
          }

          console.log('walk error: ', err);
          return null;
        }

        var excludedFiles = [];
        var includedFiles = [];
        var scanCount = 0;

        var doSharp = function doSharp() {
          filesRec.forEach(function (el) {
            var p = (0, _vite.normalizePath)(el);
            var relative_p = p.replace(config.root + '/', '');

            if (excludedFiles.includes(relative_p)) {
              return false;
            }

            var thisExtname = _path["default"].extname(relative_p);

            if (supportedFileExt.includes(thisExtname)) {
              public_images.push(relative_p);
            }
          });
          public_images = public_images.concat(includedFiles);
          public_images = _toConsumableArray(new Set(public_images));
          public_images.forEach(function (img) {
            var publicDir = (0, _vite.normalizePath)(config.publicDir).replace(config.root + '/', '');
            img = img.replace(publicDir, config.build.outDir);
            vsharpIt(img, options);
          });
        };

        if (options.excludePublic.length === 0) {
          doSharp();
        }

        options.includePublic.forEach(function (rule, i) {
          (0, _glob["default"])(rule, {
            root: options.root
          }, function (err, files) {
            if (err) {
              console.log(err);
              return false;
            }

            files.forEach(function (file) {
              includedFiles.push(file);
            });

            if (i === options.includePublic.length - 1) {
              scanCount++;

              if (scanCount === 2) {
                doSharp();
              }
            }
          });
        });
        options.excludePublic.forEach(function (rule, i) {
          (0, _glob["default"])(rule, {
            root: options.root
          }, function (err, files) {
            if (err) {
              console.log(err);
              return false;
            }

            files.forEach(function (file) {
              excludedFiles.push(file);
            });

            if (i === options.excludePublic.length - 1) {
              scanCount++;

              if (scanCount === 2) {
                doSharp();
              }
            }
          });
        });
      });
    }
  };
}

function getImgs(data, opts) {
  var _imgs = [];
  data.forEach(function (el) {
    var thisExt = _path["default"].extname(el);

    var thisName;

    if (vite_version < 4) {
      thisName = _path["default"].basename(el).split('.');
    } else {
      thisName = _path["default"].basename(el).split('-');
    }

    thisName = thisName.reverse();
    thisName.splice(0, 2);
    thisName = thisName.join('');

    if (opts.exclude.includes(thisName + thisExt)) {
      return false;
    }

    if (supportedFileExt.includes(thisExt)) {
      el = (0, _vite.normalizePath)(el);
      el = el.replace(config.root + '/', '');

      _imgs.push(el);
    }
  });
  return _imgs;
}

function vsharpIt(img, opts) {
  var extname = _path["default"].extname(img);

  var sfunc = extFunction[extname];
  var s_img = (0, _sharp["default"])(img, {
    animated: true
  });
  s_img.metadata().then(function (metadata) {
    var previousSize = _fs["default"].statSync(img).size;

    var currentWidth = metadata.width;
    var targetWidth = metadata.width;
    var targetHeight = metadata.height;

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

    var outBuffer = s_img;
    outBuffer = outBuffer.resize(targetWidth, targetHeight);
    outBuffer = outBuffer[sfunc](opts[extname]);
    return outBuffer.toBuffer(function (err, buffer, info) {
      if (err) {
        console.log(err);
      }

      var currentSize = info.size;

      if (previousSize < currentSize) {
        console.log("vsharp: [".concat(_chalk["default"].green(img), "], current size (").concat((0, _bytesToSize.bytesToSize)(currentSize), ") is bigger after <sharp> processed, skipping..."));
        return false;
      }

      _fs["default"].writeFile(img, buffer, {
        flag: 'w+'
      }, function (err) {
        if (err) {
          console.log(err);
          return;
        }

        var shrinkRatio = (-((previousSize - currentSize) / previousSize) * 100).toFixed(2);
        console.log("vsharp: [".concat(_chalk["default"].green(img), "] ").concat(_chalk["default"].yellow((0, _bytesToSize.bytesToSize)(previousSize)), " <<").concat(_chalk["default"].green(shrinkRatio + '%'), ">> ").concat(_chalk["default"].yellow((0, _bytesToSize.bytesToSize)(currentSize))).concat(unifyFormatMessage));
      });
    });
  });
}