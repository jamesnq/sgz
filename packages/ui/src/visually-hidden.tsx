import type { CSSProperties, ReactNode } from 'react'

const visuallyHiddenStyle: CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span style={visuallyHiddenStyle}>{children}</span>
}
