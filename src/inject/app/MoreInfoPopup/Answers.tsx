import {
  Button,
  IconButton,
  Link,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import React, { FC } from 'react'

import { useAppContext } from '../context/AppContext'
import { CheckCircleIcon, DeleteIcon } from '@src/shared/utils/icons'
import AnswerDTO from '../services/DTOs/AnswerDTO'
import { ConfirmationDialog, ConfirmButton, ConfirmButton2 } from '../components/ConfirmButton'

const TH = styled(TableCell)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 600,
  padding: 6
  
}));

const TD = styled(TableCell)(({ theme }) => ({
  verticalAlign: "top",
  padding: 6
}));

const AnswerRow: FC<{ answerDTO: AnswerDTO }> = ({ answerDTO }) => {
  const { id, fieldName, match, section, answer } = answerDTO
  const { answers } = useAppContext()


  const MatchValue = (
    match.type === 'exact'
      ? <Tooltip title="Exact Match">
        <CheckCircleIcon color='success' />
      </Tooltip>
      : <Tooltip title="Similarity Score">
        <span>{match.score.toFixed(2)}</span>
      </Tooltip>
  )

  const DeleteButton = (
    <ConfirmationDialog 
      dialogContent="Are You Sure?" 
      dialogTitle="Are you Sure you want to delete this answer? This action is not reversible."
    >
      <IconButton onClick={() => answers.deleteAnswer(id)}><DeleteIcon /></IconButton>
    </ConfirmationDialog>
  )
  return (
    <TableRow>
      <TD align='right' width={"auto"}>{MatchValue}</TD>
      <TD >{fieldName}</TD>
      {section && <TD>{section}</TD>}
      <TD>{answer.toString()}</TD>
      <TD>{DeleteButton}</TD>
    </TableRow>
  )
}

export const Answers: FC = () => {
  const { backend, answers: { data } } = useAppContext()
  return (
    <TableContainer sx={{ width: "100%" }} component={Paper}>
      <Table sx={{ width: "100%", tableLayout: "auto" }} size='small' stickyHeader>
        <TableHead>
          <TableRow >
            <TH width={"auto"}></TH>
            <TH >Question</TH>
            {backend.section && <TH>Section</TH>}
            <TH>Answer</TH>
            <TH></TH>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((answerDTO) => <AnswerRow key={answerDTO.id} answerDTO={answerDTO} />)}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
