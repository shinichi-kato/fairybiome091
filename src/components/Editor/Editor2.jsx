/*
  Biomebotエディタ
  
  ユーザはindexDB上に保存された自分が所有するチャットボットのデータを
  このエディタ画面で編集でき、firestore上に保存できる。管理者権限を
  持つユーザは他のユーザのチャットボットも閲覧・編集できる。
  編集した結果をfirestoreに保存すると、サブスクライブの機構によって
  即時他のアプリのチャットボットに反映される。

  state 遷移
  init
  ↓
  selectBot ユーザがadministratorの場合selectページに遷移してbotId取得。
          そうでなければbotIdはuserIdと同じにしてloadingへ
  ↓
  loading  ファイルを取得中          saving ファイル保存中
  ↓↑                               ↓↑  
  settings 初期はcellがmain.jsonで、cellを切り替えたらloadingへ
           保存したらsavingへ。admininstratorの場合戻るでopenへ           
  ↓↑
  script   スクリプト編集。
           将来的にログのスクリプト化も
  
  
*/

import React, { useContext, useReducer, useEffect } from 'react';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import { UserContext } from '../User/UserProvider';
import {ScriptContext } from './ScriptProvider';

import EditorBreadcrumbs from './EditorBreadcrumbs';
import Settings from './Settings';
import ScriptEditor from './ScriptEditor';
import BotSelector from './BotSelector';
import SaveConfirmDialog from './SaveConfirmDialog';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import IconButton from '@mui/material/IconButton';

 

export default function Editor({ firestore }) {
  const user = useContext(UserContext);
  const script = useContext(ScriptContext);
  const [page, setPage] = useState();

  function handleChangeCurrentCell(currentCell) {
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    script.changeCurrentCell(currentCell);
  }

  function handleChangePage(nextPage) {
    setPage(nextPage)
  }

  const currentScript = state.currentCell ? state.cells[state.currentCell].script : [];

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
      <Box>

        {page === 'selectBot' &&
          <BotSelector
            firestore={firestore}
            state={state}
            handleChangeBot={script.download}
          />
        }
        {page === 'settings' &&
          <Settings
            settings={state}
          />
        }
        {
          page === 'script' &&
          <ScriptEditor
            script={currentScript}
            
          />
        }
      </Box>

    </Container>
  )
}