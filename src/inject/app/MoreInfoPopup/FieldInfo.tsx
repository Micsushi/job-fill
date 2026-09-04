import { Box, Typography } from '@mui/material'
import React, { FC } from 'react'

import { useAppContext } from '../AppContext'
import { t } from './tokens'

/**
 * Where this answer is filed. Previously a breadcrumb of avatar chips, which
 * spent a whole row of the panel on four one-letter badges. It is reference
 * detail, so it reads as one quiet line.
 */
export const FieldInfo: FC = () => {
  const { backend } = useAppContext()
  const { section, fieldType } = backend.path

  const parts = [section || 'No section', fieldType].filter(Boolean)

  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Typography sx={{ font: t.fontMeta, color: t.textMuted }}>
        {parts.join(' · ')}
      </Typography>
    </Box>
  )
}
