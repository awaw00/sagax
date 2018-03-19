import typescript from 'rollup-plugin-typescript2';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'index.ts',
  output: {
    name: 'sagax',
    file: 'dist/es/sagax.umd.js',
    format: 'umd'
  },
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNEXT'
        }
      },
      cacheRoot:`${require('temp-dir')}/.rpt2_cache`
    }),
    uglify()
  ],
  external: [
    'axios',
    'redux-saga',
    'mobx'
  ]
};
