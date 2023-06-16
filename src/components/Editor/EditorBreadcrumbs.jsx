
import React, { useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import ChatbotIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import DictionaryIcon from '@mui/icons-material/DescriptionOutlined';

export default function Navigation({ state, handleChangePage, handleChangeCell }) {
  /*
    "<"  stete.botDisplayName > state.currentCell > "辞書"|"設定"
    を表示。
    "<"をクリックしたら保存した後'/'へ移動。
    state.botDisplayNameをクリックしたら保存した後ボット選択画面へ
    state.currentCellをクリックしたらcell選択ドロップリストを表示。選択したらsettings表示
    "辞書"をクリックしたら辞書か設定か選ぶドロップリストを表示。選択したら各表示
  */

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  function handleClickChangePage(page){
    setAnchorEl(null);
    handleChangePage(page)
  }
  function handleClickPageMenu(event) {
    setAnchorEl(event.currentTarget);
    setMenuItems([
      <MenuItem
      dense
        key="page0"
        onClick={()=>handleClickChangePage('settings')}
      >
        設定
      </MenuItem>,
      <MenuItem
      dense
        key="page1"
        onClick={()=>handleClickChangePage('script')}
      >
        辞書
      </MenuItem>
    ])
  }

  function handleClickChangeCell(cellName){
    setAnchorEl(null);
    handleChangeCell(cellName);
  }

  function handleClickCellMenu(event) {
    setAnchorEl(event.currentTarget);
    console.log(state);
    const cellNames = Object.keys(state.cells);
    setMenuItems(cellNames.map(cellName =>
      <MenuItem
        key={cellName}
        dense
        onClick={()=>handleClickChangeCell(cellName)}
      >
        {cellName}
      </MenuItem>));
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  const currentPage =
    state.page === 'settings' ? '設定' :
      state.page === 'script' ? '辞書' : '';

  const open = Boolean(anchorEl);

  return (
    <>
      <Breadcrumbs aria-label="breadcrubms">
        <Link
          href="#"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
        >
          <ChatbotIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {state.botName}
        </Link>
        <Link
          href="#"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          id="page-button"
          aria-haspopup="listbox"
          aria-controls="page-menu"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClickCellMenu}
        >
          <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {state.currentCell}
        </Link>
        <Link
          href="#"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          id="page-button"
          aria-haspopup="listbox"
          aria-controls="page-menu"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClickPageMenu}
        >
          <DictionaryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {currentPage}
        </Link>


      </Breadcrumbs>
      <Menu
        id="context-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': '',
          role: 'listbox'
        }}
      >
        {menuItems}
      </Menu>
    </>
  )
}