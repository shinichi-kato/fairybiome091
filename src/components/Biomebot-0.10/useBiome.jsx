import { useReducer, useEffect, useCallback } from 'react';
import { useCells } from './useCells';
import { db } from '../db';

export const BIOME_MAIN_READY = 1;
export const BIOME_READY = 2;


const initialState = {
  status: 'init',
  botId: null,
  isReady: false,
  mode: 'main',
  backgroundColor: '',
  avatarDir: '',
  spool: {},
  order: {
    'main': [],
    'biome': [],
  },
}


function reducer(state, action) {
  console.log("useBiome reducer", action.type)
  switch (action.type) {

    case 'main_loaded': {
      return {
        ...state,
        botId: action.botId,
        isReady: false,
        status: BIOME_MAIN_READY,
        avatarDir: action.avatarDir,
        backgroundColor: action.backgroundColor,
        spool: {
          ...action.spool
        },
        order: {
          'main': action.order,
          'biome': []
        },
      }
    }

    case 'biome_loaded': {
      return {
        ...state,
        status: BIOME_READY,
        isReady: true,
        spool: {
          ...state.spool,
          ...action.spool,
        },
        order: {
          'main': state.order.main,
          'biome': action.order
        }
      }
    }

    case 'update': {
      const cellName = state.order[action.mode][action.index];
      const cell = state.spool[cellName];
      let newOrder = {
        'main': [...state.order.main],
        'biome': [...state.order.biome]
      }

      // hoist/drop
      let pos = state.order.biome.indexOf(cellName);
      let mode = 'biome';
      if (pos === -1) {
        pos = state.order.main.indexOf(cellName);
        mode = 'main';
      }

      if (cell.retention < Math.random()) {
        // drop
        if (pos !== -1 && pos < newOrder.length - 1) {
          let removed = newOrder[mode].splice(pos, 1);
          newOrder[mode].push(removed[0]);
        }
      } else {
        // hoist
        if (pos > 0) {
          let removed = newOrder[mode].splice(pos, 1)
          newOrder[mode].unshift(removed[0]);
        }
      }

      return {
        ...state,
        mode: action.mode,
        order: newOrder
      }
    }


    default:
      throw new Error(`invalid action.type ${action.type}`);
  }
}

export function useBiome(firestore, botId) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mainState] = useCells(firestore, botId);
  const [biomeState] = useCells(firestore, botId, mainState.biomeCellNames);

  useEffect(() => {
    if (mainState.status === 'loaded' && state.botId !== botId) {
      (async () => {
        await db.open(botId);
        await db.appendMemoryItems(mainState.memory);
        const mainCellName = mainState.cellNames[0];
        dispatch({
          type: 'main_loaded',
          botId: botId,
          avatarDir: mainState.spool[mainCellName].avatarDir,
          spool: mainState.spool,
          order: mainState.cellNames,
          backgroundColor: mainState.spool[mainCellName].backgroundColor,
        });

      })();

    }
  }
    , [
      botId,
      state.botId,
      mainState.botId,
      mainState.status,
      mainState.cellNames,
      mainState.spool,
      mainState.memory,
    ]);

  useEffect(() => {
    if (biomeState.status === 'loaded') {
      db.appendMemoryItems(biomeState.memory).then(() => {
        dispatch({
          type: 'biome_loaded',
          spool: biomeState.spool,
          order: biomeState.cellNames
        });

      })

    }
  }, [
    biomeState.status,
    biomeState.cellNames,
    biomeState.spool,
    biomeState.memory]);


  const update = useCallback((mode, index) => {
    dispatch({ type: 'update', mode: mode, index: index })
  }, []);

  return [
    state,
    update
  ]
}

