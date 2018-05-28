#!/usr/bin/env node
const path = require('path')
const { existIndexFile, isDirectory } = require('./utils')
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

function bundle(entry, output, watching) {
  let outputPath, inputFile
  let filesToWatch = []
  if (!existIndexFile(entry)) {
    console.log(
      '> Index file not found inside the given directory. Please inform a valid entry file.'
    )
    return
  }
  if (!isDirectory(entry)) {
    outputPath = isDirectory(output) ? path.join(output, 'bundle.js') : output
    inputFile = entry
  } else {
    inputFile = path.join(entry, 'index.js')
    outputPath = isDirectory(output) ? path.join(output, 'bundle.js') : output
  }
  bundleFile(inputFile, outputPath, options.noMinify).then(
    ({ dependecies }) => {
      console.log(`> Successfully bundled ${inputFile} to ${outputPath}`)
      filesToWatch.push(inputFile)
      dependecies.map(module => {
        module.forEach(file => {
          filesToWatch.push(path.join(path.dirname(outputPath), file))
        })
      })
      filesToWatch = [...new Set([...filesToWatch])]
      if (options.watch && !watching) startWatch(filesToWatch)
    }
  )
}
bundle(options.entry, options.output)
