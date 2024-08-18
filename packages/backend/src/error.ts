/**系统异常 */
export class SystemError extends Error {
  constructor(message: string) {
    super(message);
  }
}
