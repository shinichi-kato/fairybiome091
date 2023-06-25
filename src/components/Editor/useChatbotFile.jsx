import { useReducer, useEffect, useCallback } from 'react';
import { loadChatbot } from '../../useFirebase';
import { getInitialCellState } from './initialState';

const initialState = {
  cells: null,
  changeCount: 0
}

function reducer(state, action) {
  switch (action.type) {
    case 'load': {
      return {

        cells: { ...action.cells },
        changeCount: 0
      }
    }

    case 'addNewCell': {
      const mainJson = state.cells['main.json'];

      // 新しいセルの仮名を生成
      const cellNames = Object.keys(state.cells);
      const usedNumbers = cellNames.map(c => {
        let g = c.match(/^セル([0-9]+)$/);
        if (g && g.length === 2 ) {
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
        changeCount: state.changeCount + 1
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
        changeCount: state.changeCount + 1
      }

    }

    case 'updateCell': {
      return {
        ...state,
        cells: {
          ...state.cells,
          [action.cellName]: action.cell
        },
        changeCount: state.changeCount + 1
      }
    }

    case 'deleteCell': {
      let cells = { ...state.cells };
      delete cells[action.cellName];

      return {
        ...state,
        cells: cells,
        changeCount: state.changeCount + 1
      }
    }
    case 'saved': {
      return {
        ...state,
        changeCount: 0
      }
    }
    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export function useChatbotFile(firestore, botId, collection) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (firestore && botId && collection) {
      (async () => {

        const cells = await loadChatbot(firestore, botId, collection);
        dispatch({ type: 'load', cells: cells });
        
      })();

    }
  }, [firestore, botId, collection]);

  const addNewCell = useCallback(() => {
    dispatch({ type: 'addNewCell' })
  }, []);

  const updateCell = useCallback((cellName, cell) => {
    dispatch({ type: 'updateCell', cellName: cellName, cell: cell })
  }, []);

  const changeCellName = useCallback((oldName, newName)=>{
    dispatch({type: 'changeCellName', oldName:oldName, newName:newName});
  },[]);
  const deleteCell = useCallback((cellName) => {
    dispatch({ type: 'deleteCell', cellName:cellName})
  }, []);

  const hasChanged = useCallback(() => {
    return state.changeCount !== 0;
  }, [state.changeCount]);

  return {
    cells: state.cells,
    hasChanged: hasChanged,
    addNewCell: addNewCell,
    changeCellName: changeCellName,
    updateCell: updateCell,
    deleteCell: deleteCell,
  };
}