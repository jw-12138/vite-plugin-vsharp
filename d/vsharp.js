"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = vsharp;

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _sharp = _interopRequireDefault(require("sharp"));

var _chalk = _interopRequireDefault(require("chalk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var defaults = {
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
    apply: 'build',
    writeBundle: function writeBundle(op, bundle) {
      var outDir = op.dir;
      var keys = Object.keys(bundle);
      keys = keys.map(function (el) {
        return _path["default"].join(outDir, el);
      });
      var images = getImgs(keys, options);
      images.forEach(function (el) {
        vsharpIt(el, options);
      });
    }
  };
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
      console.log("[".concat(_chalk["default"].green(img), "], current size is bigger after <sharp> processed, skipping..."));
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
      console.log("[".concat(_chalk["default"].green(img), "] optimized, ").concat(_chalk["default"].yellow(bytesToSize(beforeSize)), " <<").concat(_chalk["default"].green(shrinkRatio + '%'), ">> ").concat(_chalk["default"].yellow(bytesToSize(currentSize))));
    });
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
