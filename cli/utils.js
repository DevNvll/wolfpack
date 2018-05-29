const fs = require('fs')
const path = require('path')

function pathExist(_path) {
  return fs.existsSync(_path)
}

function hasExtension(filename) {
  return filename
    .split('/')
    .pop()
    .split('.')[1]
}

function isDirectory(_path) {
  return fs.lstatSync(_path).isDirectory()
}

function existIndexFile(filepath) {
  return fs.existsSync(path.join(filepath, 'index.js'))
}

module.exports = {
  existIndexFile,
  isDirectory,
  pathExist,
  hasExtension
}
