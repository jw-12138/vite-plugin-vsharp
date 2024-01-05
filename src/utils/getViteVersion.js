import fs from 'fs'
import path from 'path'

/**
 * Get vite version from package.json
 * @param {string} root
 * @returns {*|string}
 */
function getViteVersion(root) {
  let pkg = fs.readFileSync(path.join(root, 'package.json'))
  pkg = JSON.parse(pkg)
  if (pkg.devDependencies.vite) {
    return pkg.devDependencies.vite
  } else if (pkg.dependencies.vite) {
    return pkg.dependencies.vite
  }
  return ''
}

export default getViteVersion
