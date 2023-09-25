import fs from 'fs'
import path from 'path'

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

export {
  getViteVersion
}