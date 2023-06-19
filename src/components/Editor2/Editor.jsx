/*
 Biomebotエディタ
  ユーザはindexDB上に保存された自分が所有するチャットボットのデータを
  このエディタ画面で編集でき、firestore上に保存できる。管理者権限を
  持つユーザは他のユーザのチャットボットも閲覧・編集できる。

*/

import React, { useContext, useReducer, useEffect } from 'react';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import IconButton from '@mui/material/IconButton';

import {EditorBreadcrumbs} from './EditorBreadcrumbs';
import { ScriptContext } from './ScriptProvider';

export default function Editor({ firestore }) {
  const script = useContext(ScriptContext);

  return (
    <Container
      maxWidth="sm"
      disableGutters
      sx={{
        backgroundColor: "#eeeeee",
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton>
              <NavigateBeforeIcon />
            </IconButton>
            {
              state.botId !== null &&
              <EditorBreadcrumbs
                state={state}
                handleChangePage={handleChangePage}
                handleChangeCell={handleChangeCurrentCell}
              />

            }
          </Toolbar>
        </AppBar>
      </Box>
    </Container>

  )
}
