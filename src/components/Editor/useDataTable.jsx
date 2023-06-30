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
  hasChanged: false,
  lastInsertRowId: null,
  id: null,
  cellName: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'setRows': {
      let rows = action.newRows.map(row =>
        'id' in row ? row : { 'id': randomId(), ...row });

      return {
        rows: rows,
        hasChanged: action.id === state.id && action.cellName === state.cellName,
        lastInsertRowId: action.lastInsertRowId || false,
        id: action.id,
        cellName: action.cellName
      }
    }

    case 'saved': {
      return {
        ...state,
        hasChanged: false
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export function useDataTable(id, cellName, rows) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (rows && id && cellName) {
      dispatch({ type: 'setRows', newRows: rows, cellName: cellName, id: id })
    }
  }, [id, rows, cellName]);

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