#!/usr/bin/env node
const path = require('path')
const fse = require('fs-extra')
const {
  existIndexFile,
  isDirectory,
  pathExist,
  hasExtension
} = require('./utils')
const chokidar = require('chokidar')

const { bundleFile } = require('../lib/index')
const command = require('commander')

let options = {}

command
  .name('wolfpack')
  .version('1.0.0')
  .arguments('<entry> [output]')
  .option('-o, --output <path>', 'output file or directory')
  .option('-w, --watch', "watch entry file and it's dependecies")
  .option('-m, --noMinify', 'no minifying')
  .action((entry, output, cmd) => {
    options.entry = entry
    options.noMinify = cmd.noMinify || false
    options.output = output || cmd.output || './bundle.js'
    options.watch = cmd.watch || false
  })
  .parse(process.argv)

if (!options.entry) {
  console.log('Missing entry file.')
  console.log('Type wolfpack --help for help')
  process.exit(0)
}

function startWatch(filesToWatch) {
  console.log('> Watching for file changes...')
  let watcher = chokidar.watch(filesToWatch, {
    persistent: true,
    cwd: path.dirname(options.entry)
  })
  watcher.on('change', () => {
    bundle(options.entry, options.output, true)
  })
}

function writeFile(content, output) {
  return new Promise((resolve, reject) => {
    fse
      .outputFile(output, content)
      .then(() => {
        resolve()
      })
      .catch(err => {
        reject(err)
      })
  })
}

function bundle(entry, output, watching) {
  const startTime = Date.now()
  if (!pathExist(entry)) {
    console.log("> The path provided as entry doesn't exist.")
    return
  }
  if (isDirectory(entry) && !existIndexFile(entry)) {
    //check if the entry is a directory and it has an index file inside.
    console.log(
      '> Index file not found inside the given directory. Please inform a valid entry file.'
    )
    return
  } else if (isDirectory(entry)) {
    //if it's a directory and exists an index file inside of it, change the entry file.
    entry = path.join(entry, 'index.js')
  }
  if (pathExist(output) && isDirectory(output)) {
    //check if output is a directory, then set the output to 'directory/bundle.js'
    output = path.join(output, 'bundle.js')
  } else if (!pathExist(output)) {
    output = path.join(output, 'bundle.js')
  }
  const bundle = bundleFile(entry, options.noMinify)
  writeFile(bundle.code, output)
    .then(() => {
      console.log(
        `> Successfully bundled ${entry} to ${output}. ${Date.now() -
          startTime} ms.`
      )
      if (options.watch && !watching) {
        let filesToWatch = [path.resolve(entry)]
        bundle.dependecies.map(module => {
          module.forEach(file => {
            filesToWatch.push(
              path.resolve(
                path.join(
                  path.dirname(entry),
                  hasExtension(file) ? file : file + '.js'
                )
              )
            )
          })
        })
        filesToWatch = [...new Set([...filesToWatch])]
        startWatch(filesToWatch)
      }
    })
    .catch(err => console.log(err))
}

bundle(options.entry, options.output)

// bundle(options.entry, options.output)
