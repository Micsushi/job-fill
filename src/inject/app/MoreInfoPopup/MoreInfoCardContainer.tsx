import { Box, Button, Typography } from '@mui/material'
import React, { FC } from 'react'

import { useAppContext } from '../AppContext'
import { MoreInfoHeader } from './MoreInfoHeader'
import { FieldNotice } from './components'
import { AnswersSection } from './AnswerSection'
import { FieldInfo } from './FieldInfo'
import { t } from './tokens'

/**
 * One surface, sections divided by hairlines.
 *
 * Nothing in here gets its own card. The previous version nested a Paper per
 * answer inside a Paper per section inside the panel Card, which is what read
 * as boxes stacking up behind the menu.
 */
const MoreInfoCardContainer: FC = () => {
  const {
    currentValue,
    fieldNotice,
    backend,
    init,
    editableAnswerState: { answers },
  } = useAppContext()

  const currentText =
    currentValue !== null && currentValue !== undefined
      ? String(currentValue).trim()
      : ''
  const hasCurrentValue =
    currentText.length > 0 &&
    currentText !== 'null' &&
    currentText !== 'undefined'

  const alreadySaved = answers.some((a) => {
    const saved = a.originalAnswer?.answer
    if (typeof saved === 'string') {
      return saved.trim().toLowerCase() === currentText.toLowerCase()
    }
    return JSON.stringify(saved) === JSON.stringify(currentValue)
  })

  return (
    <Box
      sx={{
        width: 360,
        maxWidth: '90vw',
        backgroundColor: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: t.radius,
        boxShadow: t.shadow,
        overflow: 'hidden',
      }}
    >
      <MoreInfoHeader />

      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {fieldNotice && (
          <Box sx={{ px: 1.5, pt: 1.25 }}>
            <FieldNotice>{fieldNotice}</FieldNotice>
          </Box>
        )}

        {/* What is in the field right now, and the one action it affords. */}
        <Box sx={{ px: 1.5, py: 1.25 }}>
          <Typography
            sx={{ font: t.fontMeta, fontWeight: 700, color: t.textMuted }}
          >
            In the field now
          </Typography>
          <Typography
            sx={{
              font: t.font,
              color: hasCurrentValue ? t.text : t.textMuted,
              mt: 0.25,
              wordBreak: 'break-word',
            }}
          >
            {hasCurrentValue ? currentText : 'Empty'}
          </Typography>

          {hasCurrentValue && !alreadySaved && (
            <Button
              size="small"
              variant="outlined"
              onClick={async () => {
                await backend.save({
                  path: backend.path,
                  answer: currentValue,
                })
                await init()
              }}
              sx={{
                font: t.fontMeta,
                fontWeight: 600,
                textTransform: 'none',
                mt: 0.75,
                py: 0.25,
                color: t.accent,
                borderColor: t.border,
                '&:hover': { borderColor: t.accent, backgroundColor: t.accentSoft },
              }}
            >
              Save this as an answer
            </Button>
          )}
        </Box>

        <Box sx={{ borderTop: `1px solid ${t.hairline}` }}>
          <AnswersSection />
        </Box>

        <Box sx={{ borderTop: `1px solid ${t.hairline}` }}>
          <FieldInfo />
        </Box>
      </Box>
    </Box>
  )
}

export default MoreInfoCardContainer
