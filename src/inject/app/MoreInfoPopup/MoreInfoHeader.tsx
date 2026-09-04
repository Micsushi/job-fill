import { Box, CircularProgress, IconButton, Typography } from '@mui/material'
import { startCase } from 'lodash'
import React, { FC } from 'react'
import { RefreshIcon, CloseIcon } from '@src/shared/utils/icons'
import { useAppContext } from '../AppContext'
import { t } from './tokens'

/**
 * The question is the title. The field type is supporting detail, so it sits
 * under the question in muted text rather than competing with it.
 */
export const MoreInfoHeader: FC = () => {
  const {
    backend,
    moreInfoPopper: { close, isRefreshing, handleRefreshButtonClick, fieldType },
  } = useAppContext()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        px: 1.5,
        py: 1.25,
        borderBottom: `1px solid ${t.hairline}`,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            font: t.font,
            fontWeight: 600,
            color: t.text,
            wordBreak: 'break-word',
          }}
        >
          {backend.fieldName || 'Untitled field'}
        </Typography>
        <Typography sx={{ font: t.fontMeta, color: t.textMuted, mt: 0.25 }}>
          {startCase(fieldType)}
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={handleRefreshButtonClick}
        title="Reload saved answers"
        sx={{ color: t.textMuted }}
      >
        {isRefreshing ? (
          <CircularProgress size={15} />
        ) : (
          <RefreshIcon sx={{ fontSize: 16 }} />
        )}
      </IconButton>
      <IconButton
        size="small"
        onClick={close}
        aria-label="Close"
        sx={{ color: t.textMuted }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  )
}
