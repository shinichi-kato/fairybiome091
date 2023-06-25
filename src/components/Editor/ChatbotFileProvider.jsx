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

import React, { useReducer, createContext, useEffect, useCallback } from 'react';
import { useChatbotFile } from './useChatbotFile';
import { useSettings } from './useSettings';
import { useDataTable } from './useDataTable';

import BotSelector from './BotSelector';
import SaveConfirmDialog from './SaveConfirmDialog';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

export const ChatbotFileContext = createContext();

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

function memory2rows(mem) {
  if (mem) {
    let rows = [];
    mem.forEach((val, key) => {
      rows.push({
        id: randomId(),
        memKey: key,
        memValues: val.join(',')
      })
    });
    return rows;
  }
  return null;
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
  currentCellName: false,
  currentPage: false, // settings || script || false
}

function reducer(state, action) {
  console.log(`ChatbotFiletProvider - ${action.type}`);
  switch (action.type) {
    case 'load': {
      return {
        botId: action.botId,
        botName: false,
        collection: action.collection,
        saveRequest: {
          target: false,
          value: null,
        },
        currentCellName: 'main.json',
        currentPage: 'settings'
      }
    }

    case 'setBotName': {
      return {
        ...state,
        botName: action.botName,
        currentCellName: 'main.json',
        currentPage: 'settings'
      }
    }

    case 'requestChangeChatbot': {
      return {
        ...state,

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
      return {
        ...state,
        saveRequest: {
          target: false,
          value: null,
        },
        [action.target]: action.value
      }
    }

    case 'applyChangeRequest': {
      // cell切り替えの場合はcurrentPageをデフォルト状態に。
      // bot切り替えの場合はcurrentPageとcurrentCellNameをデフォルト状態に
      const target = state.saveRequest.target;
      switch (target) {
        case 'currentCellName': {
          return {
            ...state,
            saveRequest: {
              target: false,
              value: null,
            },
            currentCellName: state.saveRequest.value,
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
            botId: state.saveRequest.value,
            currentCellName: 'main.json',
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
            [state.saveRequest.target]: state.saveRequest.value,
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

    default:
      throw new Error(`invalid action ${action.type}`)

  }
}

export default function ChatbotFileProvider({ firestore, children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const chatbotFile = useChatbotFile(firestore, state.botId, state.collection);
  const currentCell =
    state && state.currentCellName &&
    chatbotFile && chatbotFile.cells &&
    chatbotFile.cells[state.currentCellName];

  const settings = useSettings(currentCell);
  const memory = useDataTable(currentCell && memory2rows(currentCell.memory));
  const script = useDataTable(currentCell && currentCell.script);
  // const user = useContext(UserContext);


  //---------------------------------------------------------------
  // botのダウンロード

  useEffect(() => {
    if (currentCell) {
      dispatch({ type: 'setBotName', botName: getBotName(currentCell) })
    }
  }, [currentCell]);

  // -----------------------------------------------------------------------
  // cellの編集

  const addNewCell = useCallback(() => {
    chatbotFile.addNewCell();
  }, [chatbotFile]);

  const changeCellName = useCallback((oldName, newName) => {
    chatbotFile.changeCellName(oldName, newName);
  }, [chatbotFile]);


  // -----------------------------------------------------------------------
  // 変更があったらuploadするか確認してページ遷移

  const requestChangeChatbot = useCallback(() => {
    if (memory.hasChanged ||
      script.hasChanged ||
      settings.hasChanged ||
      chatbotFile.hasChanged) {
      dispatch({ type: 'requestChangeView', target: 'botId', value: null });
    } else {
      dispatch({ type: 'changeView', target: 'botId', value: null });
    }
  }, [
    memory.hasChanged,
    script.hasChanged,
    settings.hasChanged,
    chatbotFile.hasChanged,
    dispatch]);

  const requestChangeCurrentCellName = useCallback(newCell => {
    if (state.currentCell !== newCell) {
      if (memory.hasChanged || script.hasChanged || settings.hasChanged) {
        dispatch({ type: 'requestChangeView', target: 'currentCellName', value: newCell });
      } else {
        dispatch({ type: 'changeView', target: 'currentCellName', value: newCell });
      }
    }
  }, [state.currentCell, memory.hasChanged, script.hasChanged, settings.hasChanged, dispatch]);


  const requestChangeCurrentPage = useCallback((newPage) => {
    if (state.currentPage !== newPage) {
      if (memory.hasChanged || script.hasChanged) {
        dispatch({ type: 'requestChangeView', target: 'currentPage', value: newPage });
      } else {
        dispatch({ type: 'changeView', target: 'currentPage', value: newPage });
      }
    }
  }, [state.currentPage, memory.hasChanged, script.hasChanged, dispatch]);





  function handleClose() {

    dispatch({ type: 'cancelChangeRequest' })
  }

  function handleDispose() {
    // 変更を保存せずにページを遷移
    dispatch({ type: 'applyChangeRequest' })
  }

  function handleSave() {
    // ここでfirestoreに保存
    dispatch({ type: 'applyChangeRequest' })
  }

  function handleChangeBot(botId, collection) {
    dispatch({ type: 'load', botId: botId, collection: collection });
  }


  return (
    <ChatbotFileContext.Provider
      value={{
        addNewCell: addNewCell,
        changeCellName: changeCellName,
        requestChangeChatbot: requestChangeChatbot,
        requestChangeCurrentCellName: requestChangeCurrentCellName,
        requestChangeCurrentPage: requestChangeCurrentPage,
        botId: state.botId,

        currentCellName: state.chrrentCellName,
        currentPage: state.currentPage,
        cells: chatbotFile,
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
        open={state.saveRequest.target !== false}
        handleClose={handleClose}
        handleDispose={handleDispose}
        handleSave={handleSave}
      />

    </ChatbotFileContext.Provider>
  )
}