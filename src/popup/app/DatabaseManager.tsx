import React, { FC, useState, useEffect } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  DeleteIcon,
  EditIcon,
  SearchIcon,
  AddIcon,
  SaveIcon,
  CloseIcon,
  FileDownloadIcon,
  UploadFileIcon,
} from '@src/shared/utils/icons'
import { answers1010 } from '@src/contentScript/utils/storage/Answers1010'
import { SavedAnswer } from '@src/contentScript/utils/storage/DataStoreTypes'

interface DatabaseManagerProps {
  open: boolean
  onClose: () => void
  onNotify: (msg: string) => void
  onDataChanged: () => void
}

export const DatabaseManager: FC<DatabaseManagerProps> = ({
  open,
  onClose,
  onNotify,
  onDataChanged,
}) => {
  const [records, setRecords] = useState<SavedAnswer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [editingRecord, setEditingRecord] = useState<SavedAnswer | null>(null)
  const [editedAnswer, setEditedAnswer] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newSection, setNewSection] = useState('personal')
  const [newFieldName, setNewFieldName] = useState('')
  const [newAnswer, setNewAnswer] = useState('')

  const refreshRecords = async () => {
    await answers1010.load()
    const all = answers1010.getAll()
    setRecords(all)
  }

  useEffect(() => {
    if (open) {
      refreshRecords()
    }
  }, [open])

  const sections = ['all', ...Array.from(new Set(records.map((r) => r.section || 'custom')))]

  const filteredRecords = records.filter((r) => {
    const matchesSection =
      selectedSection === 'all' || (r.section || 'custom') === selectedSection
    const term = searchTerm.toLowerCase().trim()
    if (!term) return matchesSection

    const nameMatch = (r.fieldName || '').toLowerCase().includes(term)
    const secMatch = (r.section || '').toLowerCase().includes(term)
    const ansMatch = JSON.stringify(r.answer || '').toLowerCase().includes(term)
    return matchesSection && (nameMatch || secMatch || ansMatch)
  })

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this answer from your permanent database?')) {
      answers1010.delete(id)
      await refreshRecords()
      onDataChanged()
      onNotify('Record deleted.')
    }
  }

  const handleStartEdit = (record: SavedAnswer) => {
    setEditingRecord(record)
    setEditedAnswer(
      typeof record.answer === 'object'
        ? JSON.stringify(record.answer)
        : String(record.answer ?? '')
    )
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) return
    let parsed: any = editedAnswer
    try {
      parsed = JSON.parse(editedAnswer)
    } catch {
      parsed = editedAnswer
    }
    answers1010.update({
      ...editingRecord,
      answer: parsed,
    })
    setEditingRecord(null)
    await refreshRecords()
    onDataChanged()
    onNotify('Answer updated.')
  }

  const handleAddNew = async () => {
    if (!newFieldName.trim() || !newAnswer.trim()) {
      onNotify('Field name and answer are required.')
      return
    }
    let parsed: any = newAnswer
    try {
      parsed = JSON.parse(newAnswer)
    } catch {
      parsed = newAnswer
    }
    answers1010.add({
      section: newSection.trim() || 'personal',
      fieldType: 'text',
      fieldName: newFieldName.trim(),
      answer: parsed,
    })
    setNewFieldName('')
    setNewAnswer('')
    setAddDialogOpen(false)
    await refreshRecords()
    onDataChanged()
    onNotify('New record added to DB.')
  }

  const handleExport = () => {
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
    onNotify('Database exported!')
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Database Records ({records.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Export Full Database JSON">
            <IconButton size="small" onClick={handleExport} color="primary">
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {/* Search bar and Add button */}
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by field, section, answer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Field
            </Button>
          </Stack>

          {/* Section Filter Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {sections.map((sec) => (
              <Chip
                key={sec}
                label={sec}
                size="small"
                clickable
                color={selectedSection === sec ? 'primary' : 'default'}
                onClick={() => setSelectedSection(sec)}
              />
            ))}
          </Box>

          {/* Records List */}
          <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
            {filteredRecords.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No records found.
              </Typography>
            ) : (
              <List dense disablePadding>
                {filteredRecords.map((r) => (
                  <Paper
                    key={r.id}
                    variant="outlined"
                    sx={{ mb: 1, p: 1.5, borderRadius: 1 }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={r.section || 'custom'}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          <Typography variant="subtitle2" fontWeight="bold">
                            {r.fieldName}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleStartEdit(r)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(r.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {editingRecord?.id === r.id ? (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={editedAnswer}
                            onChange={(e) => setEditedAnswer(e.target.value)}
                            placeholder="Answer value"
                          />
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={handleSaveEdit}
                          >
                            <SaveIcon fontSize="small" />
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setEditingRecord(null)}
                          >
                            <CloseIcon fontSize="small" />
                          </Button>
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            wordBreak: 'break-word',
                            backgroundColor: '#f5f5f5',
                            p: 0.5,
                            borderRadius: 0.5,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                          }}
                        >
                          {typeof r.answer === 'object'
                            ? JSON.stringify(r.answer)
                            : String(r.answer ?? '')}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        </Stack>
      </DialogContent>

      {/* Add Record Sub-Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add New Field to Database</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Section (e.g. personal, employment 1, education 1)"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
            />
            <TextField
              size="small"
              label="Field Name (e.g. First Name, LinkedIn URL)"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
            />
            <TextField
              size="small"
              label="Answer Value"
              multiline
              rows={2}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNew}>
            Add to DB
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
