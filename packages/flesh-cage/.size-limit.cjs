module.exports = [
  {
    name: 'Main Bundle',
    path: 'dist/index.js',
    limit: '10 kB',
    brotli: true,
  },
  // Core and Vite bundles coming in future releases
  // {
  //   name: 'Core Bundle',
  //   path: 'dist/core.js',
  //   limit: '5 kB',
  //   brotli: true,
  // },
  // {
  //   name: 'Vite Plugin',
  //   path: 'dist/vite.js',
  //   limit: '2 kB',
  //   brotli: true,
  // },
]
