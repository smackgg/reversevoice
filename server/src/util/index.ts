// catch promise error
export const cErr = async (fn: Promise<any>): Promise<[null | { msg: string; code: number | string }, any]> => {
  try {
    const result = await fn
    return [null, result]
  } catch (error) {
    return [error, error]
  }
}
