/*
ScriptProvider
jsonファイルの読み書きと管理

一般ユーザはfirestore上に一つだけ自分用のチャットボットを所有でき、
自動的にそのチャットボットがロードされる。
adminはすべてのデータを編集でき、チャットボット選択画面をへて選んだチャットボットが
ロードされる。

このproviderはチャットボットのデータを保持し、切り替えや編集モードからの離脱に
トリガしてfirestoreへのアップロードを行う。

*/

import React, { useReducer, createContext, useContext, useEffect, useRef } from 'react';
import { UserContext } from '../User/UserProvider';
import { useDataTable } from './useDataTable';
import { loadChatbot } from '../../useFirebase';
import { getInitialCellState } from './initialState';
import SaveConfirmDialog from './SaveConfirmDialog';

export const ScriptContext = createContext();

function getBotName(cell) {
  console.log(cell)
  if (cell) {
    if ('memory' in cell) {
      let botName = "";
      if (cell.memory.has('{BOT_NAME}')) {
        botName = cell.memory.get('{BOT_NAME}')[0];
      }
      return botName;
    }
  }
  return false;
}

//-----------------------------------------------
// チャットボットデータ全体のstate 
//
const initialState = {
  botId: null,
  botName: false,
  collection: null,
  cells: {},
  currentCell: false,
  currentPage: false, // settings || script

}

function reducer(state, action) {
  console.log(`ScriptProvider - ${action.type}`);
  switch (action.type) {
    case 'loading': {
      return {
        botId: null,
        botName: false,
        collection: null,
        currentCell: false,
        currentPage: false,
        cells: {}
      }
    }

    case 'loaded': {
      return {
        botId: action.botId,
        botName: getBotName(action.cells['main.json']),
        collection: action.collection,
        cells: { ...action.cells },
        currentCell: 'main.json',
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
          [action.newCell]: { 
            ...getInitialCellState(),
            hasChanged: true
           }
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

    case 'changeCurrentPage': {
      return {
        ...state,
        currentPage: action.currentPage
      }
    }


    case 'saveCell': {
      return {
        ...state,
        cells: {
          ...state.cells,
          [action.cellName]: {
            ...action.cell,
            hasChanged: true,
          }

        }
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)

  }
}

export default function ScriptProvider({ firestore }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const memory = useDataTable( state.currentCell && state.cells[state.currentCell].memory);
  const script = useDataTable( state.currentCell && state.cells[state.currentCell].script);
  const settings = useSettings(state.currentCell && state.cells[state.currentCell])
  const user = useContext(UserContext);
  const [changingTarget,setChangingTarget] = useState(false);


  //---------------------------------------------------------------
  // botデータをfirestoreからロード

  const handleDownload = useCallback((botId, collection) => {
    (async () => {
      dispatch({ type: 'loading' });

      const cells = await loadChatbot(
        firestore,
        botId, collection);

      dispatch({
        type: 'loaded',
        botId: botId,
        collection: collection,
        currentCell: 'main.json',
        cells: cells
      });
    })();
  }, [firestore]);

  const handleAddNewCell = useCallback(() => {
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
  }, [dispatch]);

  const handleChangeCellName = useCallback((oldName, newName) => {
    dispatch({ type: 'changeCellName', oldName: oldName, newName: newName });
  }, [dispatch]);

  const handleChangeCurrentCell = useCallback((newCell)=> {
    if(state.currentCell !== newCell){
      if(state.hasChanged){
        setChangingTarget('cell')
      } else {
        dispatch({type: 'changeCurrentCell', currentCell:newCell})
      }
    }
  },[state.currentCell, state.hasChanged, dispatch]);

  const requestChangePage = useCallback((newPage)=>{
    if(state.currentPage !== newPage){
      if(memory.hasChanged || script.hasChanged){
        setChangingTarget('page');
      } else {
        dispatch({type:'changeCurrentPage', currentPage:newPage})
      }
    }
  },[memory.hasChanged, script.hanChanged, setChangingTarget]);

  function handleClose(){

    setConfirmTarget(false);
  }

  function handleDispose(){
    // 変更を保存せずにページを遷移
    switch(changingTarget){
      case 'page':{
        dispatch({type:'changeCurrentPage'});
        break;
      }
      case 'cell': {
        dispatch({type:''})
      }
    }
    if(changingTarget==='page'){
      dispatch({type:'changeCurrentPage'})
    }

  }


  return (
    <ScriptContext.Provider
      value={{
        download: handleDownload,
        upload: handleUpload,
        addNewCell: handleAddNewCell,
        changeCellName: handleChangeCellName,
        changeCurrentCell: handleChangeCurrentCell,
        botId: state.botId,
        
        settings: state.currentCell ? state.cells[currentCell] : false,
        memory: memory,
        script: script,
      }}
    >
      {children}
      <SaveConfirmDialog
        botName={state.botName}
        open={confirmTarget}
        processResolve={handleOk}
        handleClose={handleClose}
        handleDispose={handleDispose}
        handleSave={handleSave}
        />
      
    </ScriptContext.Provider>
  )
}