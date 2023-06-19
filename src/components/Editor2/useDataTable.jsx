/*
  memoryやscriptのようなデータのリストを管理する。
  hasChanged:
  最後にセーブしてから内容が変更されているかどうかを保持する。
  
  
*/

import { useReducer } from 'react';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

const initialState = {
  rows: [],
  hasChanged: null,
  lastInsertRowId: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'setRows': {
      let rows = action.newRows.map(row =>
        'id' in row ? row : { 'id': randomId(), ...row });
      
      return {
        rows: rows,
        hasChanged: state.hasChanged === null ? false : true,
        lastInsertRowId: action.lastInsertRowId || false,
      }
    }

    case 'saved': {
      return {
        ...state,
        hasChanged: false
      }
    }
  }
}

export function useDataTable(rows) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if(rows){
      dispatch({ type: 'setRows', rows: rows})
    }
  }, [rows]);

  const update = useCallback((newRows, lastInsertRowId)=>{
    dispatch({type:'setRows', newRows, lastInsertRowId});
  },[]);

  const saved = useCallback(()=>{
    dispatch({type:'saved'});
  },[]);
  return {
    ...state,
    update: update,
    saved: saved
  }
}