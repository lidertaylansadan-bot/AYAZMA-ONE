export class AppError extends Error {
  code: string
  statusCode: number
  details?: any

  constructor(code: string, message: string, statusCode = 400, details?: any) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}