import { Avatar, Box, Paper, Typography } from '@mui/material'
import React, { FC } from 'react'
import { theme } from '../utils/react'

const variant = 'body2'

const sizes = {
  small: "1.25rem",
  medium: "1.5rem",
  large: "2.25rem"
} as const 
type Size = keyof typeof sizes

const pixelSizes = {
  small: 24,
  medium: 28,
  large: 36,
} as const

const Logo: FC<{ size?: Size }> = ({ size = 'small' }) => {
  const px = pixelSizes[size] || 24
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${px}px`,
        height: `${px}px`,
        borderRadius: '50%',
        backgroundColor: '#00897b',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: `${Math.round(px * 0.45)}px`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        letterSpacing: '0.5px',
        userSelect: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      jaf
    </div>
  )
}

export default Logo
