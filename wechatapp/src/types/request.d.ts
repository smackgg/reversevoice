declare namespace Request {
  interface requestResult {
    data: any
    code: number
    msg: string
  }

  interface requestError {
    code: number
    msg: string
  }
}
