import { useReducer, useEffect, useCallback } from 'react';
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

function initialState(mainCellName) {
  const cellNames = mainCellName ? [mainCellName] : [];
  return {
    status: 'init',
    parentName: null, // cellがbiomeの場合mainセルの名前
    cellNames: cellNames,  // mainまたはbiomeセルの名前
    spool: {},
    biomes: [],   // 各cellのbiome(mainのbiomeのみ使用)
    memory: {}
  }
};


function reducer(state, action) {
  console.log(`useCells - ${action.type}`)
  switch (action.type) {

    case 'setBiomeCells': {
      let cellNames;
      if (typeof action.cellNames === 'string') {
        cellNames = [cellNames];
      }
      else if (Array.isArray(action.cellNames)) {
        cellNames = [...action.cellNames]
      }
      return {
        status: "init",
        parentName: action.parentName,
        cellNames: cellNames,
        spool: {},
        biomes: [],
        memory: {},
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

    default:
      throw new Error(`invalid action.type ${action.type}`)
  }
}


export function useCells(firestore, mainCellName) {
  /*
    usage:
    メインセルの読み込み
    const main = useCells(firestore, mainCellPath)
    
    biomeセルの読み込み
    const biome = useCells(firestore)
    biome.loadBiome(cellpaths)

  */

  const [state, dispatch] = useReducer(reducer, initialState(mainCellName));

  // loadではcellNamesを書き換える。
  // それが下のuseEffectをトリガする
  function load(parentName, cellNames) {
    dispatch({
      type: 'setBiomeCells',
      parentName: parentName,
      cellNames: cellNames
    });
  }

  // セルの読み込み
  // リッスンをしたいが、動作中の書き換えがあると困るのでやめておく。
  useEffect(() => {
    if (state.cellNames.length !== 0) {
      const loadPromise = new Promise(
        async (resolve, reject) => {
          if (!state.parentName) {
            // メインセルの場合
            const cellName = state.cellNames[0]
            const docRef = doc(firestore, "chatbot_active", cellName);
            const snap = await getDoc(docRef);
            if (snap.exits()) {
              resolve([{
                ...snap.data(),
                filename: cellName
              }])
            }

          } else {
            // biomeセルの場合
            const colRef = collection(firestore, "chatbot_active", state.parentName, "biome");
            const snap = await getDocs(colRef);
            let data = [];
            snap.forEach(doc => {
              if (doc.exists()) {
                data.push({
                  ...doc.data(),
                  filename: doc.id
                })
              }
            })
            resolve(data);
          }
        }
      )
      loadPromise
        .then(payload => {
          let data = [];
          for (let d of payload) {
            const encoder = newModules(d.encoder);
            const stateMachine = newModules(d.stateMachine || 'BasicStateMachine');
            const decoder = newModules(d.decoder);

            data.push({
              name: d.filename,
              avatarDir: d.avatarDir,
              backgroundColor: d.backgroundColor,
              encoder: new encoder(d),
              stateMachine: new stateMachine(d),
              decoder: new decoder(d),

              precision: d.precision,
              retention: d.retention,
              biome: d.biome,
              memory: d.memory
            });
          }

          dispatch({ type: 'loaded', data: data });
        })
    }

  }, [state.cellNames, firestore, state.parentName]);

  return [state, load];
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