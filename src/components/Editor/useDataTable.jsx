/*
  memoryやscriptのようなデータのリストを管理する。
  hasChanged:
  最後にセーブしてから内容が変更されているかどうかを保持する。
  
  
*/

import { useReducer,useCallback,useEffect } from 'react';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

const initialState = {
  rows: [],
  changeCount: 0,
  lastInsertRowId: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'setRows': {
      let rows = action.newRows.map(row =>
        'id' in row ? row : { 'id': randomId(), ...row });
      
      return {
        rows: rows,
        changeCount: state.changeCount+1,
        lastInsertRowId: action.lastInsertRowId || false,
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

export function useDataTable(rows) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if(rows){
      dispatch({ type: 'setRows', newRows: rows})
    }
  }, [rows]);

  const update = useCallback((newRows, lastInsertRowId)=>{
    dispatch({type:'setRows', newRows, lastInsertRowId});
  },[]);

  const saved = useCallback(()=>{
    dispatch({type:'saved'});
  },[]);

  const hasChanged = useCallback(()=>{
    return state.changeCount !== 0
  },[state.changeCount]);

  return {
    ...state,
    hasChanged: hasChanged,
    update: update,
    saved: saved
  }
}