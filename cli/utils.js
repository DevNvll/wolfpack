const fs = require('fs')
const path = require('path')

function isDirectory(_path) {
  return fs.lstatSync(_path).isDirectory()
}

function existIndexFile(filepath) {
  return fs.existsSync(path.join(filepath, 'index.js'))
}
module.exports = {
  existIndexFile,
  isDirectory
}
