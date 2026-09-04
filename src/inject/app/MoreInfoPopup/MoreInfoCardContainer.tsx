import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import React, { FC } from 'react'

import { useAppContext } from '../AppContext'
import { MoreInfoHeader } from './MoreInfoHeader'
import { FieldNotice, Item } from './components'
import { AnswersSection } from './AnswerSection'
import { FieldInfo } from './FieldInfo'

const MoreInfoCardContainer: FC = () => {
  const {
    currentValue,
    fieldNotice,
    backend,
    init,
    editableAnswerState: { answers },
  } = useAppContext()

  const stringifiedCurrentValue =
    currentValue !== null && currentValue !== undefined
      ? String(currentValue).trim()
      : ''
  const hasCurrentValue =
    stringifiedCurrentValue.length > 0 &&
    stringifiedCurrentValue !== 'null' &&
    stringifiedCurrentValue !== 'undefined'
  const alreadySaved = answers.some((a) => {
    const rawAnswer = a.originalAnswer?.answer
    if (typeof rawAnswer === 'string') {
      return (
        rawAnswer.trim().toLowerCase() === stringifiedCurrentValue.toLowerCase()
      )
    }
    return JSON.stringify(rawAnswer) === JSON.stringify(currentValue)
  })
  const isNewValue = hasCurrentValue && !alreadySaved

  return (
    <Card>
      <MoreInfoHeader />
      <CardContent sx={{ padding: 0, paddingBottom: '0px!important' }}>
        <Box
          padding={1}
          sx={{
            maxWidth: 'calc(45vw)',
            maxHeight: 380,
            overflow: 'scroll',
          }}
        >
          <Stack spacing={2}>
            {fieldNotice && (
              <Item>
                <FieldNotice>{fieldNotice}</FieldNotice>
              </Item>
            )}

            {isNewValue && (
              <Item>
                <Box
                  sx={{
                    backgroundColor: '#e8f5e9',
                    border: '1px solid #81c784',
                    borderRadius: '8px',
                    p: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#2e7d32',
                      fontWeight: 700,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    NEW VALUE ENTERED IN FIELD
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: '#1b5e20',
                      mb: 1.5,
                      wordBreak: 'break-word',
                      backgroundColor: '#ffffff',
                      p: 1,
                      borderRadius: '4px',
                      border: '1px solid #c8e6c9',
                    }}
                  >
                    {stringifiedCurrentValue}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={async () => {
                      await backend.save({
                        path: backend.path,
                        answer: currentValue,
                      })
                      await init()
                    }}
                    sx={{
                      backgroundColor: '#2e7d32',
                      '&:hover': { backgroundColor: '#1b5e20' },
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    + Add as another answer option
                  </Button>
                </Box>
              </Item>
            )}

            <Item>
              <AnswersSection />
            </Item>
            <Item>
              <Typography variant="h6">Current Value</Typography>
              <Typography>{String(currentValue)}</Typography>
            </Item>
            <Item>
              <FieldInfo />
            </Item>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

export default MoreInfoCardContainer