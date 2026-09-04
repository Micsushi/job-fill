import React, { FC, useState, useEffect } from 'react'
import './popup.css'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Snackbar,
  SnackbarCloseReason,
  Stack,
  Typography,
} from '@mui/material'

import { ThemeProvider } from '@emotion/react'
import { theme } from '@src/shared/utils/react'
import {
  GitHubIcon,
  OpenInNewIcon,
  StorageIcon,
  FileDownloadIcon,
  UploadFileIcon,
  AutoFixHighIcon,
  ClearIcon,
  CleaningServicesIcon,
  UndoIcon,
  RedoIcon,
} from '@src/shared/utils/icons'
import { answers1010 } from '@src/contentScript/utils/storage/Answers1010'
import { DatabaseManager } from './DatabaseManager'
import {
  PAGE_ACTION_MESSAGE,
  PAGE_ACTION_RESULT_MESSAGE,
  PageActionResult,
} from '@src/shared/utils/pageActions'

/** One compact control style, so the action rows line up exactly. */
const buttonSx = {
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: 12,
  px: 1,
  whiteSpace: 'nowrap' as const,
  '& .MuiButton-startIcon': { mr: 0.5 },
  '& .MuiButton-startIcon > *': { fontSize: 15 },
}

const linkSx = {
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: 12,
  color: 'text.secondary',
  minWidth: 0,
}

export const App: FC<{}> = () => {
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string>('')
  const [recordCount, setRecordCount] = useState<number>(0)
  const [dbManagerOpen, setDbManagerOpen] = useState<boolean>(false)
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false)
  const [pendingImportJson, setPendingImportJson] = useState<any>(null)
  const [importFileName, setImportFileName] = useState<string>('')
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [undoLabel, setUndoLabel] = useState<string | null>(null)
  const [redoLabel, setRedoLabel] = useState<string | null>(null)

  /**
   * Page wide fill/clear. Lives here rather than as an on-page toolbar so we
   * never paint anything over the job site itself.
   */
  const sendPageAction = (action: 'fill' | 'clear') => {
    if (action === 'clear') {
      const ok = window.confirm(
        'Clear every field Job Fill manages on the current page?'
      )
      if (!ok) return
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (tabId === undefined) return
      chrome.tabs
        .sendMessage(tabId, { type: PAGE_ACTION_MESSAGE, action })
        .then(() => {
          showNotify(action === 'fill' ? 'Filling page...' : 'Clearing page...')
        })
        .catch(() => {
          showNotify('No supported job form on this tab.')
        })
    })
  }

  // Ctrl+Z / Ctrl+Shift+Z. Bound in the popup only: binding them on the job
  // page would hijack normal text undo inside the form fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      if (e.shiftKey) {
        handleRedo()
      } else {
        handleUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // The page reports back through the content script once it has finished.
  useEffect(() => {
    const onMessage = (message: any) => {
      if (message?.type !== PAGE_ACTION_RESULT_MESSAGE) return
      const { action, total, failed } = message.result as PageActionResult
      const verb = action === 'fill' ? 'Filled' : 'Cleared'
      if (total === 0) {
        showNotify('No supported fields found on this page.')
      } else if (failed) {
        showNotify(`${verb} ${total - failed} of ${total} fields.`)
      } else {
        showNotify(`${verb} ${total} field${total === 1 ? '' : 's'}.`)
      }
    }
    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  /**
   * One-off repair for stores built by older versions, which keyed answers on
   * the job posting title and so accumulated duplicates.
   */
  const handleCleanUp = async () => {
    const ok = window.confirm(
      'Remove duplicate answers and repair old records?\n\n' +
        'Duplicates are records with the same question, section and value. ' +
        'The earliest copy of each is kept. Export first if you want a backup.'
    )
    if (!ok) return
    try {
      const { duplicatesRemoved, recordsRepaired, total } =
        await answers1010.cleanUp()
      await refreshCount()
      if (!duplicatesRemoved && !recordsRepaired) {
        showNotify('Database is already clean.')
      } else {
        showNotify(
          `Removed ${duplicatesRemoved} duplicate(s), repaired ${recordsRepaired}. ${total} left.`
        )
      }
    } catch (e) {
      showNotify('Clean up failed.')
    }
  }

  const refreshHistory = () => {
    setUndoLabel(answers1010.nextUndoLabel())
    setRedoLabel(answers1010.nextRedoLabel())
  }

  const handleUndo = async () => {
    const label = await answers1010.undo()
    await refreshCount()
    refreshHistory()
    showNotify(label ? `Undid: ${label}` : 'Nothing to undo.')
  }

  const handleRedo = async () => {
    const label = await answers1010.redo()
    await refreshCount()
    refreshHistory()
    showNotify(label ? `Redid: ${label}` : 'Nothing to redo.')
  }

  const showWhatsNew = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (tabId === undefined) return
      chrome.tabs
        .sendMessage(tabId, { type: 'SHOW_WHATS_NEW' })
        .catch(() => showNotify('Open a supported job page first.'))
    })
  }

  const refreshCount = async () => {
    try {
      await answers1010.load()
      setRecordCount(answers1010.getAll().length)
    } catch (e) {
      console.warn('Could not load record count:', e)
    }
  }

  useEffect(() => {
    refreshCount().then(refreshHistory)
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (changes: any, area: string) => {
        if (area === 'local' && changes.answers1010) {
          refreshCount().then(refreshHistory)
        }
      }
      chrome.storage.onChanged.addListener(listener)
      return () => chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  const handleCloseSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    setSnackbarOpen(false)
  }

  const showNotify = (msg: string) => {
    setSnackbarMessage(msg)
    setSnackbarOpen(true)
  }

  const handleExportDb = () => {
    try {
      const data = answers1010.exportDb()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `job_fill_db_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      // Revoking synchronously can abort a download that hasn't started,
      // and the popup may close first.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      showNotify(`Exported ${data.totalRecords} records!`)
    } catch (e) {
      showNotify('Failed to export database.')
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      setPendingImportJson(json)
      setImportFileName(file.name)
      setImportDialogOpen(true)
    } catch (err) {
      showNotify('Invalid JSON backup file.')
    }
    e.target.value = ''
  }

  const handleConfirmImport = async () => {
    if (!pendingImportJson) return
    try {
      const result = await answers1010.importDb(pendingImportJson, importMode)
      await refreshCount()
      setImportDialogOpen(false)
      setPendingImportJson(null)
      showNotify(
        `Import complete! ${result.added} added, ${result.updated} updated (total ${result.total}).`
      )
    } catch (err) {
      showNotify('Failed to import database file.')
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        component="header"
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'primary.dark',
            lineHeight: 1,
          }}
        >
          Job Fill
        </Typography>
      </Box>

      <Box component="main" sx={{ px: 2, py: 2 }}>
        <Stack spacing={2}>
          {/* The two things this popup exists to do. */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              disableElevation
              startIcon={<AutoFixHighIcon />}
              onClick={() => sendPageAction('fill')}
              sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Fill page
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => sendPageAction('clear')}
              sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Clear page
            </Button>
          </Stack>

          {/* Saved answers */}
          <Box>
            <Stack
              direction="row"
              alignItems="baseline"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography
                sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}
              >
                Saved answers
              </Typography>
              <Typography
                sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main' }}
              >
                {recordCount}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={0.75}
              sx={{ '& > *': { flex: 1, minWidth: 0 } }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<StorageIcon />}
                onClick={() => setDbManagerOpen(true)}
                sx={buttonSx}
              >
                Manage
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportDb}
                sx={buttonSx}
              >
                Export
              </Button>
              <Button
                size="small"
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={buttonSx}
              >
                Import
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleFileSelected}
                />
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CleaningServicesIcon />}
                onClick={handleCleanUp}
                sx={buttonSx}
              >
                Tidy
              </Button>
            </Stack>
          </Box>

          {/* History. Labelled with the action so it is clear what reverts. */}
          <Box>
            <Typography
              sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}
            >
              History
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UndoIcon />}
                disabled={!undoLabel}
                onClick={handleUndo}
                sx={{ ...buttonSx, flex: 1 }}
              >
                {undoLabel ? `Undo ${undoLabel}` : 'Nothing to undo'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RedoIcon />}
                disabled={!redoLabel}
                onClick={handleRedo}
                sx={{ ...buttonSx, flexShrink: 0 }}
              >
                Redo
              </Button>
            </Stack>
            <Typography
              sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}
            >
              Ctrl+Z to undo, Ctrl+Shift+Z to redo
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        component="footer"
        sx={{
          px: 1,
          py: 0.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button size="small" variant="text" sx={linkSx} onClick={showWhatsNew}>
          What's new
        </Button>
        <Button
          size="small"
          variant="text"
          sx={linkSx}
          href="https://youtu.be/JYMATq9siIY"
          target="_blank"
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
        >
          Tutorial
        </Button>
        <Button
          size="small"
          variant="text"
          sx={linkSx}
          href="https://github.com/Micsushi/job-fill"
          target="_blank"
          startIcon={<GitHubIcon sx={{ fontSize: 14 }} />}
        >
          GitHub
        </Button>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>

                {/* Database Records Manager Modal */}
        <DatabaseManager
          open={dbManagerOpen}
          onClose={() => setDbManagerOpen(false)}
          onNotify={showNotify}
          onDataChanged={refreshCount}
        />

        {/* Import Database Options Dialog */}
        <Dialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Import Database File</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Selected file: <strong>{importFileName}</strong>
            </Typography>
            <FormControl component="fieldset">
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Import Mode:
              </Typography>
              <RadioGroup
                value={importMode}
                onChange={(e) =>
                  setImportMode(e.target.value as 'merge' | 'replace')
                }
              >
                <FormControlLabel
                  value="merge"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Merge (Recommended)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Adds new answers and updates existing ones without losing
                        other saved data.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="replace"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="error.main"
                      >
                        Replace Entire Database
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Overwrites all current data with the contents of this
                        file.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleConfirmImport}>
              Confirm Import
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2500}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
        />
      </Box>
    </ThemeProvider>
  )
}
