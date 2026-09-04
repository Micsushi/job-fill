import { Box, Button, IconButton, TextField, Typography } from '@mui/material'
import React, { FC, useRef, useState } from 'react'
import { useAppContext } from '../../AppContext'
import { SimplePopper } from '../../components/SimplePopper'
import { DeleteIcon, EditIcon } from '@src/shared/utils/icons'
import { sentenceCase } from '@src/shared/utils/strings'
import { contentScriptAPI } from '../../services/contentScriptApi'
import { t } from '../tokens'

const iconButtonSx = {
  color: t.textMuted,
  p: 0.5,
  '&:hover': { color: t.text },
}

export const AnswerDisplayComponent: FC<{ id: number }> = ({ id }) => {
  const {
    editableAnswerState: {
      setEditable,
      setEditedPath,
      cancelEdit,
      saveAnswer,
      deleteAnswer,
      answers,
    },
    backend,
    init,
  } = useAppContext()

  const entry = answers.find((a) => a.id === id)
  // Deleting removes the row while its own handler is still on the stack.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const errorPopperRef = useRef(null)

  if (!entry) return null
  const { editedAnswer, originalAnswer, editable, error, isNew } = entry

  const toggleConfirmWithEnter = async () => {
    await contentScriptAPI.send('updateAnswer', {
      ...originalAnswer,
      confirmWithEnter: !originalAnswer.confirmWithEnter,
    })
    await init()
  }

  return (
    <Box
      ref={errorPopperRef}
      sx={{
        px: 1.5,
        py: 1,
        borderTop: `1px solid ${t.hairline}`,
        '&:hover': { backgroundColor: t.rowHover },
        // The confirm state owns the row, so no hover tint competing with it.
        ...(confirmingDelete && {
          backgroundColor: t.dangerSoft,
          '&:hover': { backgroundColor: t.dangerSoft },
        }),
      }}
    >
      <SimplePopper
        anchorRef={errorPopperRef}
        message={error}
        placement={'top'}
      />

      {confirmingDelete ? (
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 30 }}
        >
          <Typography sx={{ font: t.font, color: t.danger, flex: 1 }}>
            Delete this answer?
          </Typography>
          <Button
            size="small"
            onClick={() => setConfirmingDelete(false)}
            sx={{ font: t.fontMeta, textTransform: 'none', color: t.textMuted }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            onClick={() => {
              setConfirmingDelete(false)
              deleteAnswer(id)
            }}
            sx={{ font: t.fontMeta, textTransform: 'none', color: t.danger }}
          >
            Delete
          </Button>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.5,
              minHeight: 30,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {editable ? (
                <TextField
                  variant="standard"
                  fullWidth
                  multiline
                  value={editedAnswer.path.fieldName}
                  onChange={(e) =>
                    setEditedPath(id, 'fieldName', e.target.value)
                  }
                  InputProps={{ sx: { font: t.font } }}
                />
              ) : (
                <Typography
                  sx={{ font: t.font, color: t.text, wordBreak: 'break-word' }}
                >
                  {editedAnswer.path.fieldName}
                </Typography>
              )}
              {originalAnswer.matchType && (
                <Typography sx={{ font: t.fontMeta, color: t.textMuted }}>
                  {sentenceCase(originalAnswer.matchType)}
                </Typography>
              )}
            </Box>

            {editable ? (
              <>
                <Button
                  size="small"
                  onClick={() => saveAnswer(id)}
                  sx={{
                    font: t.fontMeta,
                    textTransform: 'none',
                    color: t.accent,
                  }}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  onClick={() => cancelEdit(id)}
                  sx={{
                    font: t.fontMeta,
                    textTransform: 'none',
                    color: t.textMuted,
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <IconButton
                  size="small"
                  title="Edit question"
                  onClick={() => setEditable(id, true)}
                  sx={iconButtonSx}
                >
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
                {!isNew && (
                  <IconButton
                    size="small"
                    title="Delete answer"
                    onClick={() => setConfirmingDelete(true)}
                    sx={iconButtonSx}
                  >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                )}
              </>
            )}
          </Box>

          <Box sx={{ mt: 0.5 }}>
            <backend.answerValue.displayComponent id={id} />
          </Box>

          {!isNew && (
            <Button
              size="small"
              onClick={toggleConfirmWithEnter}
              title="Some controls only accept a typed value once you press Enter."
              sx={{
                font: t.fontMeta,
                textTransform: 'none',
                px: 0.75,
                mt: 0.25,
                minWidth: 0,
                color: originalAnswer.confirmWithEnter ? t.accent : t.textMuted,
                backgroundColor: originalAnswer.confirmWithEnter
                  ? t.accentSoft
                  : 'transparent',
              }}
            >
              {originalAnswer.confirmWithEnter
                ? 'Presses Enter after filling'
                : 'Press Enter after filling'}
            </Button>
          )}
        </>
      )}
    </Box>
  )
}
