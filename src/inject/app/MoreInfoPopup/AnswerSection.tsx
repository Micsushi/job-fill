import { Box, Button, Typography } from '@mui/material'
import React, { FC } from 'react'

import { useAppContext } from '../AppContext'
import { AddIcon } from '@src/shared/utils/icons'
import { AnswerDisplayComponent } from './AnswerDisplay/AnswerDisplayComponent'
import { t } from './tokens'

export const AnswersSection: FC = () => {
  const {
    backend,
    editableAnswerState: { answers, addNewAnswer },
  } = useAppContext()

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          pt: 1.25,
          pb: 0.75,
        }}
      >
        <Typography
          sx={{ font: t.fontMeta, fontWeight: 700, color: t.textMuted }}
        >
          Saved answers
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 15 }} />}
          onClick={() => {
            const { path, answer } = backend.fieldSnapshot
            addNewAnswer(path, answer)
          }}
          sx={{
            font: t.fontMeta,
            fontWeight: 600,
            textTransform: 'none',
            color: t.accent,
            minWidth: 0,
            px: 0.75,
            '& .MuiButton-startIcon': { mr: 0.25 },
          }}
        >
          Add
        </Button>
      </Box>

      {answers.length === 0 ? (
        <Typography
          sx={{ font: t.font, color: t.textMuted, px: 1.5, pb: 1.25 }}
        >
          Nothing saved yet. Fill the field, then press save on the widget.
        </Typography>
      ) : (
        <Box sx={{ pb: 0.5 }}>
          {answers.map((answer) => (
            <AnswerDisplayComponent key={answer.id} id={answer.id} />
          ))}
        </Box>
      )}
    </Box>
  )
}
