import { IconButton, TextField, Typography } from '@mui/material'
import React, { FC } from 'react'

import { CloseIcon, EditIcon, InputIcon } from '@src/shared/utils/icons'
import { useAppContext } from '../../../AppContext'
import { t } from '../../tokens'
import { EmptyValue, isBlankValue } from './EmptyValue'

export const AnswerValueSingleString: FC<{ id: number }> = ({ id }) => {
  const {
    editableAnswerState: { setEditable, setEditedValue, cancelEdit, answers },
    backend,
  } = useAppContext()

  const entry = answers.find((a) => a.id === id)
  if (!entry) return null
  const { editedAnswer, editable } = entry

  if (editable) {
    return (
      <TextField
        variant="standard"
        fullWidth
        multiline
        autoFocus
        placeholder="Answer value"
        value={editedAnswer.value ?? ''}
        onChange={(e) => setEditedValue(id, e.target.value)}
        InputProps={{
          sx: { font: t.font },
          endAdornment: (
            <>
              <IconButton
                size="small"
                title="Use the value currently in the field"
                onClick={() => setEditedValue(id, backend.currentValue())}
                sx={{ color: t.textMuted, p: 0.5 }}
              >
                <InputIcon sx={{ fontSize: 15 }} />
              </IconButton>
              <IconButton
                size="small"
                title="Cancel"
                onClick={() => cancelEdit(id)}
                sx={{ color: t.textMuted, p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </>
          ),
        }}
      />
    )
  }

  return (
    <Typography
      component="div"
      sx={{
        font: t.font,
        color: t.text,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0.5,
        wordBreak: 'break-word',
      }}
    >
      {isBlankValue(editedAnswer.value) ? (
        <EmptyValue />
      ) : (
        <span>{String(editedAnswer.value)}</span>
      )}
      <IconButton
        size="small"
        title="Edit value"
        onClick={() => setEditable(id, true)}
        sx={{ color: t.textMuted, p: 0.25, ml: 'auto' }}
      >
        <EditIcon sx={{ fontSize: 15 }} />
      </IconButton>
    </Typography>
  )
}
