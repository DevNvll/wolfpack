const { bundleFile } = require('../lib/index')

test('should run bundle correctly', async () => {
  await bundleFile('./test/entries/index.js', './test/out/bundle.js')
  let outputData = ''
  storeLog = inputs => (outputData += inputs)
  console['log'] = jest.fn(storeLog)
  require('./out/bundle.js')
  expect(outputData).toBe('4')
})
