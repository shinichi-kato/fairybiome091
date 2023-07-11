import { useReducer, useEffect, useCallback } from 'react';
import { getInitialCellState } from '../Editor/initialState';


const initialState = {
  id: null,
  cell: getInitialCellState(),
  cellName: null,
  hasChanged: false
};

function reducer(state, action) {
  console.log(`useSettings - ${action.type}`);
  switch (action.type) {
    case 'load': {
      return {
        id: action.id,
        cellName: action.cellName,
        cell: {
          ...action.cell,
          script: []
        },
        hasChanged: action.id === state.id && action.cellName === state.cellName,
      }
    }

    case 'changeDesc': {
      return {
        ...state,
        cell: {
          ...state.cell,
          description: action.description,
        },
        hasChanged: true,
      }
    }

    case 'changeValue': {
      return {
        ...state,
        cell: {
          ...state.cell,
          [action.key]: action.value,
        },
        hasChanged: true,
      }
    }

    case 'changeCellOrder': {
      return {
        ...state,
        cell: {
          ...state.cell,
          biome: [...action.cellOrder],
        },
        hasChanged: true,
      }
    }

    case 'addNewCell': {
      return {
        ...state,
        cell: {
          ...state.cell,
          biome: [...state.cell.biome, action.cell],
        },
        hasChanged: true
      }
    }

    case 'saved': {
      return {
        ...state,
        hasChanged: false,
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export function useSettings(botId, cellName, cell) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (cell) {
      dispatch({ type: 'load', cell: cell, id: botId, cellName:cellName });
    }
  }, [cell, botId, cellName]);

  const changeDescription = useCallback((desc) => {
    dispatch({ type: 'changeDesc', description: desc });
  }, []);

  const changeModule = useCallback((kind, module) => {
    dispatch({ type: 'changeValue', key: kind, value: module });
  }, []);

  const changeCoeff = useCallback((coeffName, value) => {
    dispatch({ type: 'changeValue', key: coeffName, value: value });
  }, []);

  const changeCellOrder = useCallback((cellOrder) => {
    dispatch({ type: 'changeCellOrder', cellOrder: cellOrder })
  }, []);

  const saved = useCallback(()=>{
    dispatch({type: 'saved'});
  },[]);


  return {
    ...state,
    changeDescription: changeDescription,
    changeModule: changeModule,
    changeCoeff: changeCoeff,
    changeCellOrder: changeCellOrder,
    saved:saved
  }
}