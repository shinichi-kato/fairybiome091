import {useReducer,useEffect} from 'react';
import { getInitialCellState } from '../Editor/initialState';

function reducer(state, action) {
  console.log(`settings - ${action.type}`);
  switch (action.type) {
    case 'load': {
      const cell = action.cell;
      return {
        ...action.cell,
        botDisplayName: getBotName(cell),
        script: [],
      }
    }

    case 'changeDesc': {
      return {
        ...state,
        description: action.description,
      }
    }

    case 'changeValue': {
      return {
        ...state,
        [action.key]: action.value,
      }
    }

    case 'changeBiome': {
      return {
        ...state,
        biome: [...action.biome],
      }
    }

    case 'addNewCell': {
      return {
        ...state,
        biome: [...state.biome, action.cell],
      }
    }

    case 'changeMemory': {
      return {
        ...state,
        memory: action.memory
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export function useSettings(){

}