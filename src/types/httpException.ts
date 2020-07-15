class HttpException extends Error {
  status: number;
  constructor(status, err: Error) {
    super(err.message);
    this.status = status;
  }
}
export default HttpException;