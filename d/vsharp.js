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

var _mimeTypes = _interopRequireDefault(require("mime-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var config;
var defaults = {
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

var walk = function walk(dir, done) {
  var results = [];

  _fs["default"].readdir(dir, function (err, list) {
    if (err) return done(err);
    var i = 0;

    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = _path["default"].join(dir, file);

      _fs["default"].stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

function vsharp() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var options = Object.assign({}, defaults, opts);
  return {
    name: 'vsharp',
    configResolved: function configResolved(res) {
      config = res;
    },
    configureServer: function configureServer(server) {
      server.middlewares.use(function (req, res, next) {
        var p = (0, _vite.normalizePath)(config.publicDir) + req._parsedUrl.pathname;

        p = p.replace(config.root + '/', '');

        var thisExtname = _path["default"].extname(p);

        if (supportedFileExt.includes(thisExtname)) {
          sendBuffer(req, res, next, p, options);
          return false;
        }

        next();
      });
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
      walk(_path["default"].normalize(config.publicDir), function (err, filesRec) {
        if (err) {
          console.log(err);
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

function sendBuffer(req, res, next, p, opts) {
  var search = req._parsedUrl.search.split('?');

  search = search[1];
  var searchObject = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
  console.log(searchObject);
}

function getImgs(data, opts) {
  var _imgs = [];
  data.forEach(function (el) {
    var thisExt = _path["default"].extname(el);

    var thisName = _path["default"].basename(el).split('.');

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
  (0, _sharp["default"])(img)[sfunc](opts[extname]).toBuffer(function (err, buffer, info) {
    if (err) {
      console.log(err);
    }

    var beforeSize = _fs["default"].statSync(img).size;

    var currentSize = info.size;

    if (beforeSize < currentSize) {
      console.log("vsharp: [".concat(_chalk["default"].green(img), "], current size is bigger after <sharp> processed, skipping..."));
      return false;
    }

    _fs["default"].writeFile(img, buffer, {
      flag: 'w+'
    }, function (err) {
      if (err) {
        console.log(err);
        return;
      }

      var shrinkRatio = (-((beforeSize - currentSize) / beforeSize) * 100).toFixed(2);
      console.log("vsharp: [".concat(_chalk["default"].green(img), "] ").concat(_chalk["default"].yellow(bytesToSize(beforeSize)), " <<").concat(_chalk["default"].green(shrinkRatio + '%'), ">> ").concat(_chalk["default"].yellow(bytesToSize(currentSize))));
    });
  });
}

function vsharpDev(img, opts) {
  var extname = _path["default"].extname(img);

  var sfunc = extFunction[extname];
  (0, _sharp["default"])(img)[sfunc](opts[extname]).toBuffer(function (err, buffer, info) {
    if (err) {
      console.log(err);
    }

    var beforeSize = _fs["default"].statSync(img).size;

    var currentSize = info.size;

    if (beforeSize < currentSize) {
      console.log("vsharp: [".concat(_chalk["default"].green(img), "], current size is bigger after <sharp> processed, skipping..."));
      return false;
    }
  });
}

var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

function bytesToSize(x) {
  var l = 0,
      n = parseInt(x, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l];
}
