/*
    BiomeLister
    既存のbiome cellの順番を管理する。
    新規にcellを追加する

*/

import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import CellIcon from '@mui/icons-material/RecordVoiceOver';
import UpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import ButtonGroup from '@mui/material/ButtonGroup';


function ButtonGroupIconButton(props) {
  // intercept props only implemented by `Button`
  const { disableElevation, fullWidth, variant, ...iconButtonProps } = props;
  return <IconButton {...iconButtonProps} />;
}

export default function BiomeLister({
  cells,
  handleChangeCellOrder,
  handleAddCell,
  handleDeleteCell
}) {

  function handleClickUp(index){

    handleChangeCellOrder();
  }

  function handleClickDown(index){
    handleChangeCellOrder();
  }

  function handleClickDelete(index){
    
  }

  let items = cells.map((cell,index) =>
    <ListItem
      sx={{backgroundColor: "#dddddd", m:1}}
      key={cell}

      secondaryAction={
        <ButtonGroup variant="text" aria-label="outlined primary button group">
          <ButtonGroupIconButton
            onClick={e=>handleClickUp(index)}
          >
            <UpIcon />
          </ButtonGroupIconButton>
          <ButtonGroupIconButton
            onClick={e=>handleClickDown(index)}
          >
            <DownIcon />
          </ButtonGroupIconButton>
          <ButtonGroupIconButton
            onClick={e=>handleClickDelete(index)}
          >
            <DeleteIcon />
          </ButtonGroupIconButton>
        </ButtonGroup>
      }
    >
      <ListItemIcon>
        <CellIcon />
      </ListItemIcon>
      <ListItemText
        primary={cell}
      />
    </ListItem>
  );

  items.push(
    <ListItem
      key={0}
      sx={{backgroundColor: "#dddddd", m:1}}
    >
      <ListItemButton
        onClick={handleAddCell}
      >
        <ListItemText primary="セルの追加" />
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
      </ListItemButton>

    </ListItem>
  )

  

  return (
    <List>
      {items}
    </List>
  )

}

