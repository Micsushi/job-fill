import { IconButton, TableRow } from '@mui/material';
import { useAppContext } from '@src/inject/app/context/AppContext';
import { AddIcon, CheckIcon, CloseIcon } from '@src/shared/utils/icons';
import React, { FC } from 'react';
import { TD } from '../components';
import { AnswerDataTypes_Any } from '@src/inject/app/services/DTOs/types';



const AddNewAnswerContainer: FC = () => {
  const { backend, answers } = useAppContext();
  if (!backend.customUIComponents.addNewAnswerComponent) {
    return <></>;
  }

  const [show, setShow] = React.useState(false);
  const [newAnswer, setNewAnswer] = React.useState<AnswerDataTypes_Any>(null);

  const handleSave = async () => {
    await answers.add(newAnswer);
    setShow(false);
  };

  const AddNewButton = (
    <TD>
      <IconButton onClick={() => setShow(true)}>
        <AddIcon />
      </IconButton>
    </TD>
  );

  const NewAnswerComponent = (
    <>
      <TD>
        <IconButton onClick={() => setShow(false)}>
          <CloseIcon />
        </IconButton>
      </TD>
      <TD>{backend.fieldName}</TD>
      {backend.section && <TD>{backend.section}</TD>}
      <TD>
        <backend.customUIComponents.addNewAnswerComponent
          {...{ newAnswer, setNewAnswer }}
        />
      </TD>
      <TD>
        <IconButton disabled={newAnswer === null} color="success" onClick={handleSave}>
          <CheckIcon />
        </IconButton>
      </TD>
    </>
  );

  return <TableRow>{show ? NewAnswerComponent : AddNewButton}</TableRow>;
};

export default AddNewAnswerContainer;
