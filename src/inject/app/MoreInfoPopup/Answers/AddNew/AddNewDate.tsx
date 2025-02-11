import { TextField, Typography } from '@mui/material';
import { AnswerDataTypes_MonthDayYear } from '@src/inject/app/services/DTOs/types';
import { AddNewAnswerComponentProps } from '@src/inject/app/services/formFields/baseFormInput';
import React, { FC, useEffect } from 'react';

const AddNewDate: FC<AddNewAnswerComponentProps> = ({
  newAnswer,
  setNewAnswer,
}) => {
  const defaultValue: AnswerDataTypes_MonthDayYear = {
    relative: false,
    value: ['01', '01', '2021'],
  }
  const {value: [month, day, year]} = newAnswer as AnswerDataTypes_MonthDayYear || defaultValue;
  useEffect(() => {
    setNewAnswer(defaultValue);
  }, []);

  const 


  const AbsoluteDateEditComponenet = (
    <>
      <TextField
        variant="standard"
        inputProps={{ size: 2 }}
        value={month}
        onChange={(e) => setNewAnswer((prev: AnswerDataTypes_MonthDayYear) => ({...prev, value: [e.target.value, day, year]}))}
      />
      <Typography mx={1} variant="h6" display={'inline-flex'}>
        /
      </Typography>
      <TextField
        variant="standard"
        inputProps={{ size: 2 }}
        value={day}
        onChange={(e) => setNewAnswer([month, e.target.value, year])}
      />
      <Typography mx={1} variant="h6" display={'inline-flex'}>
        /
      </Typography>
      <TextField
        variant="standard"
        inputProps={{ size: 4 }}
        value={year}
        onChange={(e) => setNewAnswer([month, day, e.target.value])}
      />
    </>
  );
  return <>{AbsoluteDateEditComponenet}</>;
};

export default AddNewDate;
