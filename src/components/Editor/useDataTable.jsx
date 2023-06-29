/*
  memoryやscriptのようなデータのリストを管理する。
  hasChanged:
  最後にセーブしてから内容が変更されているかどうかを保持する。
  
  
*/

import { useReducer, useCallback, useEffect } from 'react';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

const initialState = {
  rows: [],
  changeCount: -1,
  hasChanged: false,
  lastInsertRowId: null,
  id: null
}

function reducer(state, action) {
  switch (action.type) {
    case 'setRows': {
      let rows = action.newRows.map(row =>
        'id' in row ? row : { 'id': randomId(), ...row });
      
      let changeCount = action.id !== state.id ? 0 : state.changeCount + 1
      return {
        rows: rows,
        changeCount: changeCount,
        hasChanged: changeCount > 0,
        lastInsertRowId: action.lastInsertRowId || false,
        id: action.id
      }
    }

    case 'saved': {
      return {
        ...state,
        changeCount: 0
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export function useDataTable(id,rows) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (rows && id) {
      dispatch({ type: 'setRows', newRows: rows, id:id })
    }
  }, [id,rows]);

  const update = useCallback((newRows, lastInsertRowId) => {
    dispatch({ type: 'setRows', newRows, lastInsertRowId });
  }, []);

  const saved = useCallback(() => {
    dispatch({ type: 'saved' });
  }, []);

  return {
    ...state,
    hasChanged: state.hasChanged,
    update: update,
    saved: saved
  }
}