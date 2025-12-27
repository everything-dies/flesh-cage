module.exports = [
  {
    name: 'React ESM Bundle',
    path: 'dist/index.js',
    limit: '8 KB',
    ignore: ['react', 'react-dom', '@flesh-cage/core'],
  },
  {
    name: 'React CJS Bundle',
    path: 'dist/index.cjs',
    limit: '8 KB',
    ignore: ['react', 'react-dom', '@flesh-cage/core'],
  },
]
