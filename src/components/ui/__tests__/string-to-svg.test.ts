import { describe, expect, it } from 'vitest'
import { regexBasedSanitize } from '../string-to-svg'

describe('regexBasedSanitize', () => {
  it('keeps allowlisted SVG shapes', () => {
    const result = regexBasedSanitize(
      '<svg viewBox="0 0 24 24"><path d="M0 0 L24 24" fill="#fff" /></svg>',
    )

    expect(result.attributesObj.viewBox).toBe('0 0 24 24')
    expect(result.innerContent).toContain('<path')
    expect(result.innerContent).toContain('d="M0 0 L24 24"')
  })

  it('removes executable tags and event attributes', () => {
    const result = regexBasedSanitize(
      '<svg><script>alert(1)</script><path onload="alert(2)" href="javascript:alert(3)" d="M0 0" /></svg>',
    )

    expect(result.innerContent).not.toMatch(/script|onload|href|javascript/i)
    expect(result.innerContent).toContain('<path')
  })

  it('removes foreignObject content instead of rendering raw HTML', () => {
    const result = regexBasedSanitize(
      '<svg><foreignObject><iframe src="https://attacker.example"></iframe></foreignObject><circle cx="5" cy="5" r="5" /></svg>',
    )

    expect(result.innerContent).not.toMatch(/foreignObject|iframe|attacker/i)
    expect(result.innerContent).toContain('<circle')
  })
})
