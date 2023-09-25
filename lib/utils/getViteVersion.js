"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getViteVersion = getViteVersion;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getViteVersion(root) {
  var pkg = _fs["default"].readFileSync(_path["default"].join(root, 'package.json'));

  pkg = JSON.parse(pkg);

  if (pkg.devDependencies.vite) {
    return pkg.devDependencies.vite;
  } else if (pkg.dependencies.vite) {
    return pkg.dependencies.vite;
  }

  return '';
}