import { createRequire } from 'node:module';

import json from '@rollup/plugin-json';
import { wasm } from '@rollup/plugin-wasm';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const require = createRequire(import.meta.url);

const nodePlugins = [
  json(),
  copy({
    targets: [
      // {
      //   src: './src/kms/node/*',
      //   dest: 'lib/kms/node',
      // },
      // {
      //   src: './src/kms/node/kms_lib_bg.wasm',
      //   dest: 'lib/',
      // },
    ],
  }),
  wasm(),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.rollup.json',
  }),
];

const webPlugins = [
  json(),
  copy({
    targets: [
      // {
      //   src: './src/kms/web/*',
      //   dest: 'lib/kms/web',
      // },
    ],
  }),
  nodePolyfills(),
  replace({
    preventAssignment: true,
    'node-tfhe': 'tfhe',
    'node-tkms': 'tkms',
  }),
  typescript({
    tsconfig: './tsconfig.rollup.json',
    exclude: 'node_modules/**',
  }),
  wasm({
    targetEnv: 'browser',
    maxFileSize: 10000000,
  }),
  commonjs(),
  resolve({
    browser: true,
    resolveOnly: ['tfhe', 'tkms'],
    extensions: ['.js', '.ts', '.wasm'],
  }),
];

export default [
  {
    input: 'src/web.ts',
    output: {
      file: 'lib/web.js',
      name: 'fhevm',
      format: 'es',
    },
    plugins: [...webPlugins],
  },
  {
    input: 'src/node.ts',
    output: {
      file: 'lib/node.cjs',
      name: 'fhevm',
      format: 'cjs',
    },
    plugins: [...nodePlugins],
  },
];
