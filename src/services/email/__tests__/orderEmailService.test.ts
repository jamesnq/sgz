import { describe, expect, it } from 'vitest'
import { buildCompletionAuditUpdate, buildOrderCompleteEmailMessage } from '../orderEmailService'

export const isFirstCompletionTransition = (previousStatus: string, nextStatus: string) =>
  previousStatus !== 'COMPLETED' && nextStatus === 'COMPLETED'

describe('buildOrderCompleteEmailMessage', () => {
  it('returns null when ordered user has no email', () => {
    const result = buildOrderCompleteEmailMessage({
      order: {
        id: 42,
        quantity: 1,
        deliveryContent: null,
        orderedBy: { id: 7, email: null, name: 'James' },
        productVariant: { id: 9, name: 'Steam Wallet 100K' },
      } as any,
      orderUrl: 'https://subgamezone.com/user/orders/42',
    })

    expect(result).toBeNull()
  })

  it('builds a completion email from a populated order', () => {
    const result = buildOrderCompleteEmailMessage({
      order: {
        id: 42,
        quantity: 1,
        deliveryContent: null,
        orderedBy: { id: 7, email: 'james@example.com', name: 'James' },
        productVariant: { id: 9, name: 'Steam Wallet 100K' },
      } as any,
      orderUrl: 'https://subgamezone.com/user/orders/42',
    })

    expect(result?.to).toEqual(['james@example.com'])
    expect(result?.subject).toContain('#42')
  })
})

describe('buildCompletionAuditUpdate', () => {
  it('treats first transition to COMPLETED as customer-email eligible', () => {
    expect(isFirstCompletionTransition('IN_PROCESS', 'COMPLETED')).toBe(true)
    expect(isFirstCompletionTransition('IN_QUEUE', 'COMPLETED')).toBe(true)
    expect(isFirstCompletionTransition('COMPLETED', 'COMPLETED')).toBe(false)
  })

  it('returns null when order has no form submission', () => {
    expect(buildCompletionAuditUpdate({ id: 42, formSubmission: null } as any, 5)).toBeNull()
  })

  it('builds top-level audit fields without touching submissionData', () => {
    const result = buildCompletionAuditUpdate({ id: 42, formSubmission: 88 } as any, 5)

    expect(result).toMatchObject({
      formSubmissionId: 88,
      data: {
        completedOrder: 42,
        completedBy: 5,
        orderStatusAtCompletion: 'COMPLETED',
      },
    })
    expect(result?.data).not.toHaveProperty('submissionData')
  })
})
