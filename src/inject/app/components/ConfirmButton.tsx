import React, {
  cloneElement,
  FC,
  ReactElement,
  ReactNode,
  useState,
} from 'react';
import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButtonProps,
} from '@mui/material';

type Action = (() => void) | (() => Promise<void>);
type ButtonTypes = ReactElement<ButtonProps> | ReactElement<IconButtonProps>;

const useConfirmDialogState = (
  action: (() => void) | (() => Promise<void>)
) => {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    const result = action();
    if (result instanceof Promise) {
      await result;
    }
    handleClose();
  };
  return {
    open,
    handleOpen,
    handleClose,
    handleConfirm,
  };
};

export const ConfirmationDialog: FC<{
  dialogTitle: ReactNode;
  dialogContent: ReactNode;
  children: ButtonTypes;
}> = ({ dialogTitle, dialogContent, children }) => {
  const action = children.props.onClick;
  const { handleOpen, open, handleConfirm, handleClose } =
    useConfirmDialogState(action as Action);
  const NewButton = cloneElement(children as ReactElement, {
    onClick: handleOpen,
  });
  return (
    <span>
      {NewButton}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogContent}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </span>
  );
};
