
declare global {
  interface Window { __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: Function }
}

// @ts-ignore
export declare const process: {
  env: {
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt'
    [key: string]: any
  }
}
