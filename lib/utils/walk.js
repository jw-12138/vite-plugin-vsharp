"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walk = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var walk = function walk(dir, done) {
  var results = [];

  _fs.default.readdir(dir, function (err, list) {
    if (err) return done(err);
    var i = 0;

    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = _path.default.join(dir, file);

      _fs.default.stat(file, function (err, stat) {
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

exports.walk = walk;