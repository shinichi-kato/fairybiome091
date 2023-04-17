import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';


export default function RejectedDialog({ open, handleExecute, handleClose }) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-describedby="alert-dialog-description"
    >
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          変更をクラウドに保存しますか？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleExecute}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}