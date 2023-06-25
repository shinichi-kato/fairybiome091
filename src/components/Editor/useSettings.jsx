import { useReducer, useEffect, useCallback } from 'react';
import { getInitialCellState } from '../Editor0/initialState';

function getBotName(cell) {
  if ('memory' in cell) {
    let botName = "";
    if (cell.memory.has('{BOT_NAME}')) {
      botName = cell.memory.get('{BOT_NAME}')[0];
    }
    return botName;
  }
  return false;
}

const initialState = {
  cell: getInitialCellState(),
  changeCount: 0
};

function reducer(state, action) {
  console.log(`useSettings - ${action.type}`);
  switch (action.type) {
    case 'load': {
      const cell = action.cell;
      return {
        cell: {
          ...cell,
          botDisplayName: getBotName(cell),
          script: []
        },
        changeCount: 0
      }
    }

    case 'changeDesc': {
      return {
        cell: {
          ...state.cell,
          description: action.description,
        },
        changeCount: state.changeCount + 1
      }
    }

    case 'changeValue': {
      return {
        cell: {
          ...state.cell,
          [action.key]: action.value,
        },
        changeCount: state.changeCount + 1
      }
    }

    case 'changeCellOrder': {
      return {
        cell: {
          ...state.cell,
          biome: [...action.cellOrder],
        },
        changeCount: state.changeCount + 1
      }
    }

    case 'addNewCell': {
      return {
        cell: {
          ...state.cell,
          biome: [...state.cell.biome, action.cell],
        },
        changeCount: state.changeCount + 1
      }
    }

   case 'saved': {
      return {
        ...state,
        changeCount: state.changeCount + 1
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export function useSettings(cell) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const hasChanged = useCallback(()=>{
    return state.changeCount !== 0;
  },[state.changeCount]);

  useEffect(() => {
    if (cell) {
      dispatch({ type: 'load', cell: cell, hasChanged: hasChanged});
    }
  }, [cell,hasChanged]);

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


 return {
  ...state.cell,
  hasChange: hasChanged,
  changeDescription: changeDescription,
  changeModule: changeModule,
  changeCoeff: changeCoeff,
  changeCellOrder: changeCellOrder,
 }
}