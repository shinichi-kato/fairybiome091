
import React, { useState } from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link'
// import List from '@mui/material/List';
// import ListItem from '@mui/material/ListItem';
// import ListItemButton from '@mui/material/ListItemButton';
// import ListItemIcon from '@mui/material/ListItemIcon';
// import ListItemText from '@mui/material/ListItemText';
// import Menu from '@mui/material/Menu';
// import MenuItem from '@mui/material/MenuItem';

import ChatbotIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import DictionaryIcon from '@mui/icons-material/DescriptionOutlined';
import { Menu, MenuItem } from '@mui/material';

export default function Navigation({ state, handleChangePage }) {
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

  function handleClickPageMenu(event){
    setAnchorEl(event.currentTarget);
    setMenuItems([
      <MenuItem
        key="page0"
        onClick={()=>handleChangePage('settings')}
        >
          設定
        </MenuItem>,
        <MenuItem
        key="page1"
        onClick={()=>handleChangePage('script')}
        >
          辞書
        </MenuItem>
    ])
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  const currentPage =
    state.page === 'settings' ? '設定' :
      state.page === 'script' ? '辞書' : '';
  
  const open = Boolean(anchorEl);

  return (
    <Breadcrumbs aria-label="breadcrubms">
      <Link
        underline="none"
        sx={{ display: 'flex', alignItems: 'center' }}
        color="inherit"
      >
        <ChatbotIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        {state.botName}
      </Link>
      <Link
        underline="none"
        sx={{ display: 'flex', alignItems: 'center' }}
        color="inherit"
      >
        <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        {state.currentCell}
      </Link>
      <Link
        underline="none"
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

    </Breadcrumbs>
  )
}