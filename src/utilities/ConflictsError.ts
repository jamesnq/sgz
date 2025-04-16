import { APIError } from 'payload'

class ConflictsError extends APIError {
  constructor(message: string) {
    super(message, 400, undefined, true)
  }
}

export default ConflictsError
