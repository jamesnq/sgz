import { describe, expect, it } from 'vitest'
import { maskBuyer } from '@/utilities/maskBuyer'

describe('maskBuyer', () => {
  it('never exposes the email domain', () => {
    expect(maskBuyer('jamesnq318@gmail.com')).toBe('ja***8')
    expect(maskBuyer('jamesnq318@gmail.com')).not.toContain('gmail')
  })

  it('hides more of short usernames', () => {
    expect(maskBuyer('abcd@x.com')).toBe('a***d')
    expect(maskBuyer('ab@x.com')).toBe('a***')
    expect(maskBuyer('a@x.com')).toBe('a***')
  })

  it('falls back to a generic label', () => {
    expect(maskBuyer('')).toBe('Khách hàng')
    expect(maskBuyer(null)).toBe('Khách hàng')
    expect(maskBuyer('@x.com')).toBe('Khách hàng')
  })
})
