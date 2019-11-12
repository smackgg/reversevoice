declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.css'
declare module '*.less'
declare module '*.scss'
declare module '*.sass'
declare module '*.styl'

interface TaroBaseEventOrig {
  /**
   * 事件类型
   */
  type: string,

  /**
   * 事件生成时的时间戳
   */
  timeStamp: number,

  /**
   * 触发事件的组件的一些属性值集合
   */
  target: any,

  /**
   * 当前组件的一些属性值集合
   */
  currentTarget: any,

  /**
   * 额外的信息
   */
  detail: any,

  /**
  * 阻止元素发生默认的行为
  */
  preventDefault: () => void,

  /**
  * 阻止事件冒泡到父元素,阻止任何父事件处理程序被执行
  */
  stopPropagation: () => void
}
