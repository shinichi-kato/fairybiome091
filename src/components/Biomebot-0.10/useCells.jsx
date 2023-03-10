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

const modules = {
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
  parentName: null, // cellがbiomeの場合mainセルの名前
  cellNames: [],  // このCellsを構成するcellの名前
  spool: {}, // このcellsを構成するcellの実体
  biomes: [],   // このcellsに属するbiome名のリスト
  memory: {}
};


function reducer(state, action) {
  console.log(`useCells - ${action.type}`)
  switch (action.type) {

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
        status: 'loaded',
        cellNames: action.data.map(d => d.name),
        spool: spool,
        biomes: biomes,
        memory: memory,
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


export function useCells(firestore, cellNames, parentName) {
  /*
    usage:
    メインセルの読み込み
    const main = useCells(firestore,cellName)
    
    biomeセルの読み込み
    const biome = useCells(firestore, cellNames,parentName)

    cellNamesがstringかarrayになったらセルを読み込む

  */

  const [state, dispatch] = useReducer(reducer, initialState);

  // -----------------------------------------------------------------
  //
  // セルの読み込み
  // リッスンをしたいが、動作中の書き換えがあると困るのでやめておく。

  useEffect(() => {
    if (firestore) {
      (async () => {
        let payload = [];
        if (typeof cellNames === 'string') {
          // cellNamesがstringの場合はfirestoreからメインセルを読み込む
          const cellName = cellNames;
          const docRef = doc(firestore, "chatbot_active", cellName);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            payload.push({
              ...snap.data(),
              name: snap.id,

            })
          } else {
            dispatch({ type: 'loadFailed', message: cellName });
            return;
          }
        } else if (Array.isArray(cellNames) && cellNames.length !== 0) {
          // cellNamesが配列の場合はfirestoreからbiomeセルを読み込む
          const colRef = collection(firestore, "chatbot_active", parentName, "biome");
          const snap = await getDocs(colRef);
          snap.forEach(doc => {
            if (doc.exists()) {
              payload.push({
                ...doc.data(),
                name: doc.id,
                parentName: parentName
              })
            } else {
              dispatch({ type: 'loadFailed', message: doc.id });
              return;
            }
          })
        } else {
          return;
        }

        let data = [];
        for (let p of payload) {
          console.log(p)
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

        if (data.length !== 0) {
          dispatch({
            type: 'loaded',
            data: data
          })
        }
      })();
    }
  }, [firestore, cellNames, parentName]);


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