const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const babylon = require('babylon')
const minify = require('babel-minify')
const traverse = require('babel-traverse').default
const { transformFromAst } = require('babel-core')

const { genId } = require('./utils')

let ID = 0

function parseFile(file) {
  const fileContent = fs.readFileSync(file, 'utf-8')

  const ast = babylon.parse(fileContent, {
    sourceType: 'module'
  })

  const dependecies = []

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependecies.push(node.source.value)
    }
  })

  const { code } = transformFromAst(ast, null, {
    presets: ['env']
  })

  return {
    id: ID++,
    file,
    dependecies,
    code
  }
}

function createGraph(entry) {
  const main = parseFile(entry)
  const queue = [main]

  for (const asset of queue) {
    asset.mapping = {}
    const dir = path.dirname(asset.file)

    asset.dependecies.forEach(relativePath => {
      let relativePathWithExtension = relativePath
      const extension = relativePath
        .split('/')
        .pop()
        .split('.')[1]
      if (!extension)
        relativePathWithExtension = relativePathWithExtension + '.js'
      const absolutePath = path.join(dir, relativePathWithExtension)
      const child = parseFile(absolutePath)
      asset.mapping[relativePath] = child.id
      queue.push(child)
    })
  }
  return queue
}

function bundle(graph, noMinify) {
  let modules = ''
  const dependecies = []
  graph.forEach(mod => {
    dependecies.push(mod.dependecies)
    modules += `${mod.id}: [
      function (require, module, exports) { ${mod.code} },
      ${JSON.stringify(mod.mapping)},
    ],`
  })

  const result = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];
        function localRequire(name) {
          return require(mapping[name]);
        }
        const module = { exports : {} };
        fn(localRequire, module, module.exports);
        return module.exports;
      }
      require(0);
    })({${modules}})
  `
  return {
    code: !noMinify ? minify(result).code : result,
    dependecies: dependecies
  }
}

function bundleFile(entry, noMinify) {
  return bundle(createGraph(entry), noMinify)
}

module.exports = {
  createGraph,
  bundleFile,
  bundle
}
