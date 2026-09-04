import { Typography } from '@mui/material'
import React, { FC } from 'react'
import { t } from '../../tokens'

/**
 * A saved answer with no value fills nothing, so it has to look different
 * from one that simply has a short value. Rendering the raw string left a
 * blank line next to an edit pencil, which read as a broken row.
 */
export const EmptyValue: FC = () => (
  <Typography
    component="span"
    sx={{
      font: t.font,
      fontStyle: 'italic',
      color: t.danger,
    }}
  >
    Empty — this answer will not fill anything
  </Typography>
)

/** True for the values a form field can hold that amount to nothing. */
export const isBlankValue = (value: any): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}
