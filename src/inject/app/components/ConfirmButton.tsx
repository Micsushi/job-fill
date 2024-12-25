import React, { cloneElement, FC, MouseEvent, MouseEventHandler, ReactElement, ReactNode, useState } from "react";
import { Button, ButtonProps, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ExtendButtonBase, IconButton, IconButtonProps, IconButtonTypeMap } from "@mui/material";

export const ConfirmButton: React.FC<{
  action: () => void | Promise<void>
  children: ReactNode
  component?: "Button" | "IconButton"
  dialogTitle: string
  buttonContent: ReactNode
}> = ({ action, children, dialogTitle, component = "Button", buttonContent }) => {

  const [open, setOpen] = useState<boolean>(false)
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    const result = action()
    if (result instanceof Promise) {
      await result
    }
    handleClose()
  }

  return (
    <>
      {component === "Button"
        ? <Button onClick={handleClickOpen}>
          {buttonContent}
        </Button>
        : <IconButton onClick={handleClickOpen}>
          {buttonContent}
        </IconButton>
      }
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {children}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}


type DialogProps = { action: () => void | Promise<void>, dialogTitle: ReactNode, dialogContent: ReactNode }


const ConfirmDialog: FC<any> = ({handleClose, open, dialogTitle, handleConfirm, dialogContent}) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {dialogTitle}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {dialogContent}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  )
}

type ConfirmButtonProps = ButtonProps & DialogProps 
export const ConfirmButton2: FC<ConfirmButtonProps> = ({ children, action, dialogTitle, dialogContent, ...props }) => {
  const {handleOpen, open, handleConfirm, handleClose } = useConfirmButtonState(action)


  return <>
    <Button {...props} onClick={handleOpen} >
      {children}
    </Button>
    <ConfirmDialog {...{handleClose, open, dialogTitle, handleConfirm, dialogContent}} />
  </>
} 

type Action = (() => void) | (() => Promise<void>)

const useConfirmButtonState = (action: Action ) => {
  const [open, setOpen] = useState<boolean>(false)
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    const result = action()
    if (result instanceof Promise) {
      await result
    }
    handleClose()
  }
  return {
    open, 
    handleOpen,
    handleClose,
    handleConfirm
  }
}

type ButtonTypes = (ReactElement<ButtonProps>) | (ReactElement<IconButtonProps>)
export const ConfirmationDialog: FC<{dialogTitle: ReactNode, dialogContent: ReactNode, children: ButtonTypes}> = ({dialogTitle, dialogContent, children}) => {
  const action = children.props.onClick
  const {handleOpen, open, handleConfirm, handleClose } = useConfirmDialogState(action as Action)
  const NewButton = cloneElement(children as ReactElement,{
    onClick: handleOpen
  })
  return (
    <span>
      {NewButton}
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>
        {dialogTitle}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {dialogContent}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
    </span>
  )
}

const useConfirmDialogState = (action:(() => void) | (()=> Promise<void>) ) => {
  const [open, setOpen] = useState<boolean>(false)
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    const result = action()
    if (result instanceof Promise) {
      await result
    }
    handleClose()
  }
  return {
    open, 
    handleOpen,
    handleClose,
    handleConfirm
  }
}