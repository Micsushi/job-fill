import React, { FC } from 'react'

const sizes = {
  small: '11px',
  medium: '14px',
  large: '20px',
} as const
type Size = keyof typeof sizes

const TEAL = '#00897b'

/**
 * Wordmark badge. Plain DOM rather than MUI so it renders identically whether
 * or not the host page has let our stylesheet survive.
 */
const Logo: FC<{ size?: Size }> = ({ size = 'small' }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TEAL,
        color: '#ffffff',
        borderRadius: '6px',
        padding: '0.28em 0.55em',
        font: `700 ${sizes[size]}/1 system-ui, -apple-system, "Segoe UI", sans-serif`,
        letterSpacing: '.02em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      Job Fill
    </span>
  )
}

export default Logo
