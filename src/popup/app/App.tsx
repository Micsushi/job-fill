import React, { FC, useState, useEffect } from 'react'
import './popup.css'
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  SnackbarCloseReason,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'

import { ThemeProvider } from '@emotion/react'
import { theme } from '@src/shared/utils/react'
import {
  ContentCopyIcon,
  GitHubIcon,
  OpenInNewIcon,
  StorageIcon,
  FileDownloadIcon,
  UploadFileIcon,
  FiberManualRecordIcon,
} from '@src/shared/utils/icons'
import { LogoTitleBar } from '@src/shared/components/LogoTitleBar'
import { answers1010 } from '@src/contentScript/utils/storage/Answers1010'
import { DatabaseManager } from './DatabaseManager'

const EMAIL_ADDRESS = 'berellevy+chromeextensions@gmail.com'

export const App: FC<{}> = () => {
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string>('')
  const [recordCount, setRecordCount] = useState<number>(0)
  const [dbManagerOpen, setDbManagerOpen] = useState<boolean>(false)
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false)
  const [pendingImportJson, setPendingImportJson] = useState<any>(null)
  const [importFileName, setImportFileName] = useState<string>('')
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')

  const refreshCount = async () => {
    try {
      await answers1010.load()
      setRecordCount(answers1010.getAll().length)
    } catch (e) {
      console.warn('Could not load record count:', e)
    }
  }

  useEffect(() => {
    refreshCount()
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (changes: any, area: string) => {
        if (area === 'local' && changes.answers1010) {
          refreshCount()
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
      a.download = `job_app_filler_db_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
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
      <Box pb={'0.5em'}>
        <LogoTitleBar>Job App Filler</LogoTitleBar>
      </Box>
      <Box component={'main'}>
        <Container sx={{ my: 1.5, px: 2 }}>
          {/* Quick Action bar */}
          <Stack direction={'row'} spacing={1} sx={{ mb: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                chrome.tabs.query(
                  { active: true, currentWindow: true },
                  (tabs) => {
                    chrome.tabs
                      .sendMessage(tabs[0].id, {
                        type: 'SHOW_WHATS_NEW',
                      })
                      .catch(() => {
                        showNotify('Works on supported job sites.')
                      })
                  }
                )
              }}
            >
              what's new?
            </Button>
            <Button
              variant="outlined"
              size="small"
              href="https://youtu.be/JYMATq9siIY"
              target="_blank"
              endIcon={<OpenInNewIcon fontSize="small" />}
            >
              Tutorial
            </Button>
          </Stack>

          {/* Permanent Database Center */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              backgroundColor: '#fafafa',
              borderColor: '#e0e0e0',
            }}
          >
            <Stack spacing={1.2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <FiberManualRecordIcon
                    sx={{ color: '#2e7d32', fontSize: 12 }}
                  />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Permanent Database
                  </Typography>
                </Stack>
                <Chip
                  label={`${recordCount} Saved Answers`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Protected via Local Storage + IndexedDB mirror + auto-recovery.
              </Typography>

              <Divider sx={{ my: 0.5 }} />

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportDb}
                  sx={{ flex: 1 }}
                >
                  Export DB
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  sx={{ flex: 1 }}
                >
                  Import DB
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={handleFileSelected}
                  />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  startIcon={<StorageIcon />}
                  onClick={() => setDbManagerOpen(true)}
                  sx={{ flex: 1.2 }}
                >
                  Manage DB
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>
            Supported ATS Platforms
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            Greenhouse React, Lever, and Workday forms.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Your data is stored locally and securely on your browser.
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              target="_blank"
              href="https://github.com/berellevy/job_app_filler"
              startIcon={<GitHubIcon />}
              size="small"
              variant="text"
            >
              GitHub
            </Button>
            <Stack direction="row" alignItems="center">
              <Tooltip title={EMAIL_ADDRESS}>
                <Button
                  href={'mailto:' + EMAIL_ADDRESS}
                  size="small"
                  variant="text"
                  target="_blank"
                >
                  Contact
                </Button>
              </Tooltip>
              <Tooltip title="Copy email address">
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(EMAIL_ADDRESS)
                    showNotify('Email copied.')
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Container>

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