import type {
  EmailLogger,
  EmailProvider,
  EmailMessage,
  ResilientEmailResult,
  RetryEmailJob,
} from './types'

export class EmailDeliveryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'EmailDeliveryError'
    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

export function createResilientEmailService(args: {
  provider: EmailProvider
  enqueueRetry: (job: RetryEmailJob) => Promise<void>
  logger?: EmailLogger
}) {
  const logger = args.logger ?? consoleLogger

  return {
    async send(message: EmailMessage): Promise<ResilientEmailResult> {
      try {
        const result = await args.provider.send(message)
        logger.info('Email delivered', {
          category: message.category,
          template: message.template,
          to: message.to.join(','),
          providerId: result.id,
        })

        return {
          status: 'sent',
          providerId: result.id,
        }
      } catch (providerError) {
        const errorMessage = getErrorMessage(providerError)

        try {
          await args.enqueueRetry({
            attempt: 1,
            message,
            error: errorMessage,
          })
          logger.error('Email delivery failed; queued retry', {
            category: message.category,
            template: message.template,
            error: errorMessage,
          })

          return {
            status: 'queued_for_retry',
          }
        } catch (queueError) {
          logger.error('Email retry enqueue failed', {
            category: message.category,
            template: message.template,
            error: getErrorMessage(queueError),
          })
          throw new EmailDeliveryError('Email delivery and retry enqueue both failed', {
            cause: queueError,
          })
        }
      }
    },
  }
}

const consoleLogger: EmailLogger = {
  info(message, meta) {
    console.info(message, meta)
  },
  error(message, meta) {
    console.error(message, meta)
  },
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown email error'
}
