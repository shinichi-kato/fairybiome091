
import React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import ChatbotIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import DictionaryIcon from '@mui/icons-material/DescriptionOutlined';

const pages = {
  'settings': '設定',
  'script': '辞書'
};

export default function EditorBreadcrumbs({
  state,
  page, requestChangePage,
  currentCell, requestCurrentCell,
}) {
  /*
    stete.botDisplayName > state.currentCell > "辞書"|"設定"
    を表示。
    state.botDisplayNameをクリックしたら保存した後ボット選択画面へ
    state.currentCellをクリックしたらcell選択ドロップリストを表示。選択したらsettings表示
    "辞書"をクリックしたら辞書か設定か選ぶドロップリストを表示。選択したら各表示
  */

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  function handleOpenPageMenu(event) {
    setAnchorEl(event.currentTarget);
    setMenuItems(Object.keys(pages).map(page =>
      <MenuItem
        dense
        key={page}
        onClick={() => requestChangePage(page)}
      >
        {pages[page]}
      </MenuItem>
    ))
  }

  function handleOpenCellMenu(event){
    setAnchorEl(event.currentTarget);
    const cellNames = Object.keys(state.cells);
    setMenuItems(cellNames.map(cellName =>
      <MenuItem
        key={cellName}
        dense
        onClick={()=>requestChangeCell(cellName)}
      >
        {cellName}
      </MenuItem>));
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

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
          onClick={handleOpenCellMenu}
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
          onClick={handleOpenPageMenu}
        >
          <DictionaryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {pages[state.page]}
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
