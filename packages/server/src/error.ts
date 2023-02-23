import { PlcError } from '@did-plc/lib'
import { ErrorRequestHandler } from 'express'

export const handler: ErrorRequestHandler = (err, req, res, next) => {
  // normalize our PLC errors to server errors
  if (PlcError.is(err)) {
    err = ServerError.fromPlcError(err)
  }

  req.log.info(
    err,
    ServerError.is(err)
      ? 'handled server error'
      : 'unexpected internal server error',
  )
  if (res.headersSent) {
    return next(err)
  }
  if (ServerError.is(err)) {
    return res.status(err.status).json({ message: err.message })
  } else {
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

export class ServerError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }

  static is(obj: unknown): obj is ServerError {
    return (
      !!obj &&
      typeof obj === 'object' &&
      typeof (obj as Record<string, unknown>).message === 'string' &&
      typeof (obj as Record<string, unknown>).status === 'number'
    )
  }

  static fromPlcError(err: PlcError): ServerError {
    return new ServerError(400, err.message)
  }
}
