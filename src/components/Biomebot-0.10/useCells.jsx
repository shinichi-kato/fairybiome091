import { useReducer, useEffect } from 'react';
import {
  doc, collection, getDoc, getDocs
} from 'firebase/firestore';

import CentralStateMachine from './engine/central-state-machine';
import PatternEncoder from './engine/pattern-encoder';
import HarvestDecoder from './engine/harvest-decoder';
import BasicStateMachine from './engine/basic-state-machine';
import EnterlessStateMachine from './engine/enterless-state-machine';
import BowEncoder from './engine/bow-encoder';
import LogEncoder from './engine/log-encoder';

export const modules = {
  'BowEncoder': BowEncoder,
  'PatternEncoder': PatternEncoder,
  'LogEncoder': LogEncoder,
  'CentralStateMachine': CentralStateMachine,
  'BasicStateMachine': BasicStateMachine,
  'EnterlessStateMachine': EnterlessStateMachine,
  'HarvestDecoder': HarvestDecoder,
}

function newModules(name) {
  if (name in modules) {
    return modules[name];
  }
  throw new Error(`invalid module name ${name}`);
}

const initialState = {
  status: 'init',
  botId: null,
  cellNames: [],  // このCellsを構成するcellの名前
  spool: {}, // このcellsを構成するcellの実体
  biomes: {},   // このcellsのcell名:それに属するbiome名のリストの辞書
  memory: {},
  biomeCellNames: [], // このセルがmainだった場合、そのbiome名のリスト
};

function reducer(state, action) {
  console.log(`useCells`, action)
  switch (action.type) {

    case 'loading': {
      return {
        ...state,
        state: 'loading'
      }
    }

    case 'loaded': {
      let spool = {};
      let biomes = {};
      let memory = {};
      for (let d of action.data) {
        spool[d.name] = {
          name: d.name,
          avatarDir: d.avatarDir,
          backgroundColor: d.backgroundColor,
          encoder: d.encoder,
          stateMachine: d.stateMachine,
          decoder: d.decoder,
          precision: d.precision,
          retention: d.retention,
          parentName: d.parentName
        }
        biomes[d.name] = [...d.biome];
        memory = merge(memory, d.memory);
      }
      return {
        botId: action.data[0].botId,
        status: 'loaded',
        cellNames: action.data.map(d => d.name),
        spool: spool,
        biomes: biomes,
        memory: memory,
        biomeCellNames: action.data[0].biome
      }
    }

    case 'loadFailed': {
      console.log(`cannot load ${action.message}`);
      return {
        ...state,
        status: 'loadFailed'
      }
    }

    default:
      throw new Error(`invalid action.type ${action.type}`)
  }
}


export function useCells(firestore, botId, biomeCellNames) {
  /*
    usage:
    メインセルの読み込み
    const main = useCells(firestore, botId)
    
    biomeセルの読み込み
    const biome = useCells(firestore, botId, cellNames)


  */

  const [state, dispatch] = useReducer(reducer, initialState);

  // -----------------------------------------------------------------
  //
  // セルの読み込み
  // リッスンをしたいが、動作中の書き換えがあると困るのでやめておく。
  // state.botIdが同じ場合同一とみなす
  //

  useEffect(() => {
    if (firestore && botId !== state.botId) {
      (async () => {
        let payload = [];
        if (!biomeCellNames) {
          // biomeCellNamesが未定義＝メインセルの読み込み
          const docRef = doc(firestore, "chatbot_active", botId);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const data = snap.data();
            payload.push({
              ...data,
              botId: botId,
              name: botId,
              biomeCellNames: data.biome,
            })
          } else {
            dispatch({ type: 'loadFailed', message: botId });
            return;
          }

        } else if (Array.isArray(biomeCellNames) && biomeCellNames.length !== 0) {
          // biomeCellNamesが定義されている場合はfirestoreからbiomeセルを読み込む
          const biomeRef = collection(firestore, "chatbot_active", botId, "biome");
          const snap = await getDocs(biomeRef);
          snap.forEach(doc => {
            if (doc.exists()) {
              payload.push({
                ...doc.data(),
                botId: botId,
                name: doc.id,
                biomeCellNames: [],
              })
            } else {
              dispatch({ type: 'loadFailed', message: doc.id });
              return;
            }
          })
        } else {
          // biomeCellNamesが空だった場合は何もせず脱出
          return;
        }

        if (payload.length === 0) {
          return;
        }
        let data = [];
        for (let p of payload) {
          // console.log("payload", p)
          const encoder = newModules(p.encoder);
          const stateMachine = newModules(p.stateMachine || 'BasicStateMachine');
          const decoder = newModules(p.decoder);

          data.push({
            ...p,
            encoder: new encoder(p),
            stateMachine: new stateMachine(p),
            decoder: new decoder(p),
          })
        }

        dispatch({type: 'loaded', data: data})
      })();
    }
  }, [firestore, botId, biomeCellNames,
    state.botId]);


  return [state];
}

function merge(target, source) {
  /*see: https://qiita.com/riversun/items/60307d58f9b2f461082a */

  const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
  let result = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    for (const [sourceKey, sourceValue] of Object.entries(source)) {
      const targetValue = target[sourceKey];
      if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
        result[sourceKey] = targetValue.concat(...sourceValue);
      }
      else {
        Object.assign(result, { [sourceKey]: sourceValue });
      }
    }
  }
  return result;
}