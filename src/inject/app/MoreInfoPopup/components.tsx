import { Alert, AlertTitle } from '@mui/material'
import React, { FC } from 'react'

import { Markdown } from '../components/Markdown'

export const FieldNotice: FC<{ children: string }> = ({ children }) => {
  return (
    <Alert severity="info" sx={{ fontSize: 12, py: 0.25 }}>
      <AlertTitle sx={{ fontSize: 12, mb: 0.25 }}>Note</AlertTitle>
      <Markdown>{children}</Markdown>
    </Alert>
  )
}
