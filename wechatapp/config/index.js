/* eslint-disable import/no-commonjs */
'use strict'
const path = require('path')

var config = {
  alias: {
    '@': 'src/',
    '@root': './',
  },
  projectName: 'reverse-voice',
  date: '2019-11-11',
  designWidth: 750,
  deviceRatio: {
    '640': 1.17,
    '750': 1,
    '828': 0.905,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: {
    babel: {
      sourceMap: true,
      presets: [['env', {
        modules: false,
      }]],
      plugins: ['transform-decorators-legacy', 'transform-class-properties', 'transform-object-rest-spread'],
    },
    sass: {
      resource: path.resolve(__dirname, '..', 'src/var.less'),
      projectDirectory: path.resolve(__dirname, '..'),
    },
  },
  defineConstants: {},
  copy: {
    patterns: [
      { from: './src/assets/', to: 'dist/assets/' },
    ],
  },
  weapp: {
    module: {
      postcss: {
        autoprefixer: {
          enable: true,
          config: {
            browsers: ['last 3 versions', 'Android >= 4.1', 'ios >= 8'],
          },
        },
        pxtransform: {
          enable: true,
          config: {},
        },
        url: {
          enable: true,
          config: {
            limit: 10240, // 设定转换尺寸上限
          },
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    module: {
      postcss: {
        autoprefixer: {
          enable: true,
          config: {
            browsers: ['last 3 versions', 'Android >= 4.1', 'ios >= 8'],
          },
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
  },
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
