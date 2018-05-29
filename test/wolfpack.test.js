const { bundleFile } = require('../src/index')
const path = require('path')
const fse = require('fs-extra')

test('should run bundle correctly', async () => {
  const bundle = bundleFile(path.resolve('./test/entries/index.js'))
  fse.outputFileSync('./test/out/bundle.js', bundle.code)
  let outputData = ''
  storeLog = inputs => (outputData += inputs)
  console['log'] = jest.fn(storeLog)
  require('./out/bundle.js')
  expect(outputData).toBe('4')
})
