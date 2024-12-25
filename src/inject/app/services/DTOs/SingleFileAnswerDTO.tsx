import React, { FC } from 'react';
import { AnswerDataTypes_File } from './types';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import { Tooltip, Button } from '@mui/material';
import { downloadFile, LocalStorageFile, localStorageToFile } from '@src/shared/utils/file';
import BaseAnswerDTO from './BaseAnswerDTO';

export class SingleFileAnswerDTO extends BaseAnswerDTO<AnswerDataTypes_File> {
  // answer: AnswerDataTypes_File;
  get forDisplay() {
    return <FileDisplay file={this.answer} />;
  }
}

const FileDisplay: FC<{ file: AnswerDataTypes_File }> = ({ file }) => {
  const handleDownload = (file: LocalStorageFile) => {
    downloadFile(localStorageToFile(file));
  };

  return (
    <Tooltip title="download">
      <Button
        sx={{ textTransform: 'none' }}
        startIcon={<InsertDriveFile />}
        onClick={() => handleDownload(file)}
      >
        {file.name}
      </Button>
    </Tooltip>
  );
};
