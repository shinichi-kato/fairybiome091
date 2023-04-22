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
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Typography from '@mui/material/Typography';
import { UserContext } from '../User/UserProvider';
import { loadChatbot } from '../../useFirebase';
import Settings from './Settings';
import Script from './Script';
import BotSelector from './BotSelector';
import SaveConfirmDialog from './SaveConfirmDialog';
import { getInitialCellState } from './initialState';

const initialState = {
  botId: null,
  collection: null,
  page: 'settings',
  currentCell: null,
  cells: {},
  openSaveConfirmDialog: false
}

function reducer(state, action) {
  console.log(`editor - ${action.type}`)
  switch (action.type) {
    case 'selectBot': {
      return {
        ...initialState,
        page: 'selectBot',
      }
    }
    case 'loading': {
      return {
        botId: null,
        collection: null,
        page: 'settings',
        currentCell: null,
        cells: {}
      }
    }
    case 'changeBotId': {
      return {
        botId: action.botId,
        collection: action.collection,
        page: 'settings',
        currentCell: null,
        cells: {}
      }
    }

    case 'loaded': {
      console.log(action.cells)
      return {
        botId: action.botId,
        collection: action.collection,
        page: 'settings',
        currentCell: 'main.json',
        cells: { ...action.cells }
      }
    }

    case 'addNewCell': {
      const mainJson = state.cells['main.json'];
      return {
        ...state,
        cells: {
          ...state.cells,
          'main.json': {
            ...mainJson,
            biome: [
              ...mainJson.biome,
              action.newCell
            ]
          },
          [action.newCell]: { ...getInitialCellState() }
        }
      }
    }

    case 'changeCellName': {
      let newCells = {};
      let oldCellNames = Object.keys(state.cells);
      oldCellNames.forEach(cellName => {
        if (cellName === action.oldName) {
          newCells[action.newCell] = state.cells[action.oldCell]
        } else {
          newCells[cellName] = state.cells[cellName]
        }
      });

      return {
        ...state,
        cells: newCells
      }

    }

    case 'changeCurrentCell': {
      return {
        ...state,
        currentCell: action.currentCell
      }
    }

    case 'back': {
      if (state.currentCell !== 'main.json') {
        return {
          ...state,
          currentCell: 'main.json',
          openSaveConfirmDialog: false
        }
      } else {
        return {
          ...state,
          openSaveConfirmDialog: true
        }
      }
    }

    case 'closeSaveConfirmDialog': {
      return {
        ...state,
        openSaveConfirmDialog: false
      }
    }


    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export default function Editor({ firestore }) {
  const user = useContext(UserContext);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (firestore && user.uid) {
      if (!state.botId && user.administrator !== null) {
        if (user.administrator) {
          dispatch({
            type: 'selectBot'
          });
        } else {
          (async () => {
            dispatch({ type: 'loading' });
            const cells = await loadChatbot(
              firestore,
              user.uid, 'chatbot_active');

            dispatch({
              type: 'loaded',
              botId: user.uid,
              collection: 'chatbot_active',
              cells: cells
            });
          })();
        }
      }
    }
  }, [firestore, user.administrator, state.botId, user.uid]);

  function handleChangeBot(botId, collection) {
    (async () => {
      dispatch({ type: 'loading' });
      const cells = await loadChatbot(
        firestore,
        user.uid, collection);

      dispatch({
        type: 'loaded',
        botId: botId,
        collection: collection,
        cells: cells
      });
    })();
  }

  function handleAddNewCell() {
    // 新しいセルの仮名を生成
    const cells = Object.keys(state.cells);
    const usedNumbers = cells.map(c => {
      let g = c.match(/^セル([0-9]+)$/);
      if (g && g.length === 2) {
        return parseInt(g[1])
      }
      else {
        return -1;
      }
    });
    const newCell = `セル${Math.max(...usedNumbers) + 1}`;

    dispatch({
      type: 'addNewCell',
      newCell: newCell
    })
  }

  function handleChangeCellName(oldName, newName) {
    dispatch({ type: 'changeCellName', oldName: oldName, newName: newName });
  }

  function handleChangeCurrentCell(currentCell) {
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    dispatch({ type: 'changeCurrentCell', currentCell: currentCell })
  }

  function handleClickBack() {
    dispatch({ type: 'back' })
  }

  function handleCloseSaveConfirmDialog(){
    dispatch({type: 'closeSaveConfirmDialog'})
  }

  function handleSave(){
    // クラウドへ保存
  }


  const page = state.page;
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
            <IconButton
              onClick={handleClickBack}
            >
              <ChevronLeftIcon color="inherit" />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {state.currentCell}
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      <Box>

        {page === 'selectBot' &&
          <BotSelector
            firestore={firestore}
            state={state}
            handleChangeBot={handleChangeBot}
          />
        }
        {page === 'settings' &&
          <Settings
            settings={state}
            handleAddNewCell={handleAddNewCell}
            handleChangeCellName={handleChangeCellName}
            handleChangeCurrentCell={handleChangeCurrentCell}
          />
        }
        {
          state.openSaveConfirmDialog &&
          <SaveConfirmDialog
            open={state.openSaveConfirmDialog}
            handleClose={handleCloseSaveConfirmDialog}
            handleExecute={handleSave}
          
          />
        }
        {
          page === 'script' &&
          <Script
            state={state}
          />
        }
      </Box>

    </Container>
  )
}