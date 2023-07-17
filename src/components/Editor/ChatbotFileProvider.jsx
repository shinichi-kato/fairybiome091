/*
ScriptProvider
jsonファイルの読み書きと管理

一般ユーザはfirestore上に一つだけ自分用のチャットボットを所有でき、
自動的にそのチャットボットがロードされる。
adminはすべてのデータを編集でき、チャットボット選択画面をへて選んだチャットボットが
ロードされる。

このproviderはチャットボットのデータを保持し、切り替えや編集モードからの離脱に
トリガしてfirestoreへのアップロードを行う。

■保存可否確認



*/

import React, { useReducer, createContext, useCallback } from 'react';
import { navigate } from "gatsby";
import { useSettings } from './useSettings';
import { useDataTable } from './useDataTable';

import BotSelector from './BotSelector';
import SaveConfirmDialog from './SaveConfirmDialog';
import { loadChatbot, saveChatbot } from '../../useFirebase';
import { getInitialCellState } from './initialState';

import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

export const ChatbotFileContext = createContext();

function getBotName(cell) {
  if (cell) {
    if ('memory' in cell) {
      for (let item of cell['memory']) {
        if (item.memKey === "{BOT_NAME}") {
          return item.memValues.split(',')[0]
        }
      }
    }
  }
  return false;
}

function memory2rows(mem) {
  if (mem === null) {
    return null;
  }

  let rows = [];
  if (Array.isArray(mem)) {
    rows = mem.map(row => ('id' in row ? row : { 'id': randomId(), ...row }));
  }
  else if (mem instanceof Map) {
    mem.forEach((val, key) => {
      rows.push({
        id: randomId(),
        memKey: key,
        memValues: val.join(',')
      })
    });
    return rows;
  } else if (typeof mem === 'object') {
    // bare objectの場合
    Object.keys(mem).forEach(memKey => {
      rows.push({
        id: randomId(),
        memKey: memKey,
        memValues: mem[memKey].join(',')
      })
    });
  }
  return rows;
}

function rows2memory(rows) {
  let memory = {};
  for (let row of rows) {
    memory[row.memKey] = row.memValues.split(',')
  }
  return memory;

}

function script2rows(scr) {
  let rows = scr.map(row => ({
    id: row.id || randomId(),
    'in': row.in.join(','),
    'out': row.out.join(','),
    'intent': row.intent || ""
  }))

  return rows;
}

function rows2script(rows) {
  let script = rows.map(row => {
    return {
      id: row.id,
      in: row.in.split(','),
      out: row.out.split(',')
    }
  });
  return script;
}

//-----------------------------------------------
// チャットボットデータ全体のstate 
//
const initialState = {
  botId: null,
  botName: null,
  collection: null,
  saveRequest: {
    target: false,
    value: null,
  },
  cells: null,
  hasChanged: false,
  currentCell: null,
  currentCellName: false,
  currentPage: false, // settings || script 
}


function reducer(state, action) {
  console.log(`ChatbotFileProvider - ${action.type}`);
  switch (action.type) {
    case 'load': {
      let cells = {};
      Object.keys(action.cells).forEach(key => {
        let cellValue = action.cells[key];
        cells[key] = { ...cellValue };

        cells[key].memory = 'memory' in cellValue ?
          memory2rows(cellValue.memory) : [];

        cells[key].script = 'script' in cellValue ?
          script2rows(cellValue.script) : [];

      });
      const currentCell = cells['main.json'];
      const botName = getBotName(currentCell);

      return {
        botId: action.botId,
        botName: botName,
        collection: action.collection,
        saveRequest: {
          target: false,
          value: null,
        },
        cells: cells,
        hasChanged: action.botId === state.botId,
        currentCell: currentCell,
        currentCellName: 'main.json',
        currentPage: 'settings'
      }
    }

    case 'requestChangeView': {
      return {
        ...state,
        saveRequest: {
          target: action.target,
          value: action.value,
        }
      }
    }

    case 'changeView': {
      switch (action.target) {
        case 'currentCellName': {
          return {
            ...state,
            saveRequest: {
              target: false,
              value: null,
            },
            currentCellName: action.value,
            currentCell: state.cells[action.value],
            currentPage: 'settings',
          }
        }

        case 'botId': {
          return {
            ...state,
            saveRequest: {
              target: false,
              value: null,
            },
            botId: action.value,
            currentCellName: 'main.json',
            currentCell: state.cells['main.json'],
            currentPage: 'settings',
          }
        }

        default:
          return {
            ...state,
            saveRequest: {
              target: false,
              value: null,
            },
            [action.target]: action.value
          }
      }
    }

    case 'applyChangeRequest': {
      // cellsを上書きして
      // cell切り替えの場合はcurrentPageをデフォルト状態に。
      // bot切り替えの場合はcurrentPageとcurrentCellNameをデフォルト状態に
      const target = state.saveRequest.target;
      const value = state.saveRequest.value;

      switch (target) {
        case 'currentCellName': {
          return {
            ...state,
            saveRequest: {
              target: false,
              value: null,
            },
            cells: action.newCells,
            currentCellName: value,
            currentCell: state.cells[value],
            currentPage: 'settings',
          }
        }

        case 'botId': {
          return {
            ...state,
            saveRequest: {
              target: false,
              value: null,
            },
            botId: value,
            cells: action.newCells,
            currentCellName: 'main.json',
            currentCell: state.cells['main.json'],
            currentPage: 'settings',
          }
        }

        default:
          return {
            ...state,
            saveRequest: {
              target: false,
              value: null,
            },
            [target]: value,
            cells: action.newCells
          }
      }
    }

    case 'cancelChangeRequest': {
      return {
        ...state,
        saveRequest: {
          target: false,
          value: null,
        }
      }
    }

    case 'addNewCell': {
      const mainJson = state.cells['main.json'];

      // 新しいセルの仮名を生成
      const cellNames = Object.keys(state.cells);
      const usedNumbers = cellNames.map(c => {
        let g = c.match(/^セル([0-9]+)$/);
        if (g && g.length === 2) {
          return parseInt(g[1])
        }
        else {
          return -1;
        }
      });
      const newCellName = `セル${Math.max(...usedNumbers) + 1}`;

      return {
        ...state,
        cells: {
          ...state.cells,
          'main.json': {
            ...mainJson,
            biome: [
              ...mainJson.biome,
              newCellName
            ]
          },
          [newCellName]: {
            ...getInitialCellState(),
          }
        },
        hasChanged: true,
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
        cells: newCells,
        hasChanged: true,
      }

    }

    case 'updateCell': {
      return {
        ...state,
        cells: {
          ...state.cells,
          [action.cellName]: action.cell
        },
        hasChanged: true,
      }
    }

    case 'deleteCell': {
      let cells = { ...state.cells };
      delete cells[action.cellName];

      return {
        ...state,
        cells: cells,
        hasChanged: true,
      }
    }
    case 'update': {
      return {
        ...state,
        cells: action.newCells,
        hasChanged: false,
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)

  }
}

export default function ChatbotFileProvider({ firestore, children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const settings = useSettings(state.botId, state.currentCellName, state.currentCell);
  const memory = useDataTable(state.botId, state.currentCellName, state.currentCell && state.currentCell.memory);
  const script = useDataTable(state.botId, state.currentCellName, state.currentCell && state.currentCell.script);


  // -----------------------------------------------------------------------
  // cellの編集

  const addNewCell = useCallback(() => {
    dispatch({ type: 'addNewCell' });
  }, []);

  const changeCellName = useCallback((oldName, newName) => {
    dispatch({ type: 'changeCellName', oldName: oldName, newName: newName });
  }, [dispatch]);


  // -----------------------------------------------------------------------
  // 変更があったらuploadするか確認してページ遷移
  const requestExit = useCallback(()=>{
    if (memory.hasChanged || script.hasChanged || settings.hasChanged || state.hasChanged) {
      dispatch({ type: 'requestChangeView', target: 'exit', value: null });
    } else {
      navigate("/");
    }
  }, [
    memory.hasChanged,
    script.hasChanged,
    settings.hasChanged,
    state.hasChanged,
    dispatch]);

  const requestChangeChatbot = useCallback(() => {
    if (memory.hasChanged || script.hasChanged || settings.hasChanged || state.hasChanged) {
      dispatch({ type: 'requestChangeView', target: 'botId', value: null });
    } else {
      dispatch({ type: 'changeView', target: 'botId', value: null });
    }
  }, [
    memory.hasChanged,
    script.hasChanged,
    settings.hasChanged,
    state.hasChanged,
    dispatch]);

  const requestChangeCurrentCellName = useCallback(newCell => {
    if (state.currentCellName !== newCell) {
      if (memory.hasChanged || script.hasChanged || settings.hasChanged) {
        dispatch({ type: 'requestChangeView', target: 'currentCellName', value: newCell });
      } else {
        dispatch({ type: 'changeView', target: 'currentCellName', value: newCell });
      }
    }
  }, [state.currentCellName, memory.hasChanged, script.hasChanged, settings.hasChanged, dispatch]);


  const requestChangeCurrentPage = useCallback((newPage) => {
    if (state.currentPage !== newPage) {
      if (memory.hasChanged || script.hasChanged) {
        dispatch({ type: 'requestChangeView', target: 'currentPage', value: newPage });
      } else {
        dispatch({ type: 'changeView', target: 'currentPage', value: newPage });
      }
    }
  }, [state.currentPage, memory.hasChanged, script.hasChanged, dispatch]);


  const handleSave = useCallback(() => {
    // settings,scirpt,memoryに格納された最新情報をcellsに反映する。
    // memoryの形式をmapに戻して
    // firestoreにアップロード
    console.assert(script.id === state.botId, 
      `state.botId(${state.botId})とscript.id(${script.id})が一致していない`);

    // 最新状態に更新

    let newCells = {};

    Object.keys(state.cells).forEach(cellName => {
      console.log(cellName, script.cellName)
      if (settings.cellName === cellName) {
        newCells[cellName] = settings.cell
      } else {
        newCells[cellName] = state.cells[cellName]
      }
      if (memory.cellName === cellName) {
        newCells[cellName].memory = memory.rows.map(row=>({...row}));
      }
      if (script.cellName === cellName) {
        console.log(script.rows);
        newCells[cellName].script = script.rows.map(row=>({...row}));
        console.log(newCells[cellName].script);
      }
    });

    // 最新状態のデータを保存形式に戻す

    let biome = {};
    let main = {};

    Object.keys(newCells).forEach(cellName => {
      if (cellName === 'main.json') {
        const newMain = newCells['main.json'];
        main = {
          ...newCells['main.json'],
          memory: rows2memory(newMain.memory),
          script: rows2script(newMain.script)
        }

      } else {
        const newCell = newCells[cellName];
        biome[cellName] = {
          ...newCell,
          memory: rows2memory(newCell.memory),
          script: rows2script(newCell.script),
        }
      }
    });
    (async () => {
      await saveChatbot(firestore, state.botId, state.collection, main, biome);
      if(state.saveRequest.target === 'exit'){
        navigate('/');
      }
      dispatch({ type: 'applyChangeRequest', newCells: newCells});
      settings.saved();
      memory.saved();
      script.saved();
    })();

  }, [
    script, memory, settings, state.botId, state.collection, state.cells,
    firestore,state.saveRequest.target
  ]);


  function handleClose() {

    dispatch({ type: 'cancelChangeRequest' })
  }

  function handleDispose() {
    // 変更を保存せずにページを遷移
    dispatch({ 
      type: 'changeView', 
      target: state.saveRequest.target, 
      value: state.saveRequest.value
    })
  }


  const handleChangeBot = useCallback((botId, collection) => {
    (async () => {
      const [maincell, cells] = await loadChatbot(firestore, botId, collection);

      dispatch({
        type: 'load', botId: botId, collection: collection, cells:
          { 'main.json': maincell, ...cells }
      });
    })();

  }, [firestore, dispatch]);


  return (
    <ChatbotFileContext.Provider
      value={{
        addNewCell: addNewCell,
        changeCellName: changeCellName,
        requestExit: requestExit,
        requestChangeChatbot: requestChangeChatbot,
        requestChangeCurrentCellName: requestChangeCurrentCellName,
        requestChangeCurrentPage: requestChangeCurrentPage,
        botId: state.botId,
        botName: state.botName,
        currentCellName: state.currentCellName,
        currentPage: state.currentPage,
        cells: state.cells,
        settings: settings,
        memory: memory,
        script: script,
      }}
    >
      {state.botId ?
        children
        :
        <BotSelector
          firestore={firestore}
          bot={state.botId}
          collection={state.collection}
          handleChangeBot={handleChangeBot}
        />
      }
      <SaveConfirmDialog
        botName={state.botName}
        open={Boolean(state.saveRequest.target)}
        handleClose={handleClose}
        handleDispose={handleDispose}
        handleSave={handleSave}
      />

    </ChatbotFileContext.Provider>
  )
}