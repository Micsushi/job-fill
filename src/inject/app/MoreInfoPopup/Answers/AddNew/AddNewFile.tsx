import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import { Button, IconButton, Tooltip } from '@mui/material';
import { VisuallyHiddenInput } from '@src/inject/app/components/VisuallyHiddenInput';
import { AddNewAnswerComponentProps } from '@src/inject/app/services/formFields/baseFormInput';
import {
  downloadFile,
  fileToLocalStorage,
  LocalStorageFile,
  localStorageToFile,
} from '@src/shared/utils/file';
import { DeleteIcon, UploadFileIcon } from '@src/shared/utils/icons';
import React, { FC } from 'react';

const AddNewFile: FC<AddNewAnswerComponentProps> = ({
  newAnswer,
  setNewAnswer,
}) => {
  type HandleUploadEvent = React.ChangeEvent<HTMLInputElement>;

  const handleUpload = async (e: HandleUploadEvent): Promise<void> => {
    const fileList: FileList | null = e.target.files;
    if (fileList && fileList[0]) {
      const localStorageFile = await fileToLocalStorage(fileList[0]);
      setNewAnswer(localStorageFile);
    }
  };

  const handleDownload = (file: LocalStorageFile) => {
    downloadFile(localStorageToFile(file));
  };

  const deleteAnswerValue = () => {
    console.log('deleteAnswerValue');

    setNewAnswer(null);
  };

  const UploadButton = (
    <Button
      component="label"
      role={undefined}
      tabIndex={-1}
      startIcon={<UploadFileIcon />}
    >
      Upload files
      <VisuallyHiddenInput type="file" onChange={handleUpload} />
    </Button>
  );

  const UpleadedFileButton = newAnswer && (
    <>
      <Tooltip title="download">
        <Button
          sx={{ textTransform: 'none' }}
          startIcon={<InsertDriveFile />}
          onClick={() => handleDownload(newAnswer as LocalStorageFile)}
        >
          {(newAnswer as LocalStorageFile).name}
        </Button>
      </Tooltip>
      <IconButton onClick={() => deleteAnswerValue()}>
        <DeleteIcon />
      </IconButton>
    </>
  );
  return newAnswer ? UpleadedFileButton : UploadButton;
};

export default AddNewFile;
