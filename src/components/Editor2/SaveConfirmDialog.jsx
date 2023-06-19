import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function SaveConfirmDialog({
    botName,
    handleClose,handleDispose,handleSave
  }){
  return (
    <Dialog
      open={boolean(botName)}
      onClose={handleClose}
      aria-labelledby="save-confirm-dialog"
      aria-describedby="upload-confirmation"
      >
        <DialogTitle id="save-confirm-dialog">
        {`${botName}に加えた変更を保存しますか`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="upload-confirmation">
            保存していない場合、変更は失われます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSave}>保存する</Button>
          <Button onClick={handleDispose}>破棄する</Button>
          <Button onClick={handleClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
  )
}