/*
  MemoryEditor
  
  このコンポーネントが扱う"memory"は {key:[values]} という形式で
  格納されているMapオブジェクトで
  1. keyには unique 制約がある。
  2. keyは正規表現 /\{[a-zA-Z_]+\}/ と一致していることが要求される
  3. keyが正規表現 /\{[A-Z_]+\}/ に一致するのはシステムが要求する必須の項目で、
    キーの削除や変更は禁止
  4. valuesには NOT NULL 制約がある。
  
  以上の制約をUIで実装するとともに、入力しやすいエディタとして次の機能を
  提供する。
  
  * 開始時はviewモードで、既存セルをクリックするとeditモードに遷移する。
    editモードから抜けるとviewモードに戻る。
  * 最後にselectした行を記憶しておく。「行を追加」ボタンを押下したらappendモードに
    遷移し、selectした行の次に行を新たに追加する。
 * appendモードをenterKeyDownで抜けたら次の行をappendする。
  * appendモードをenterKeyDown以外で抜けたらviewモードに遷移する。
  * 入力はrowモードで、行の編集終了時に上述の制約を満足しない場合rejectする。

*/

import React, { useCallback, useReducer, useEffect } from 'react';
import ScriptDataGrid from './ScriptDataGrid';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

function isCellEditable({ field, row }) {
  return field !== 'memKey' || !/\{[A-Z_]+\}/.test(row.memKey)
}

const initialState = {
  memory: [],
  keyMap: new Map(),
}

function reducer(state, action) {
  console.log(`reducer MemoryEditor - ${action.type}`);
  switch (action.type) {
    case 'setMemory': {
      const keyMap = new Map();
      const rows = [];

      action.memory.forEach((val,key)=>{
        rows.push({
          id: randomId(),
          memKey: key,
          memValues: val.join(',')
        });
        keyMap.set(key,true);
      });

      return {
        memory: rows,
        keyMap: keyMap
      }
    }

    case 'append': {
      state.keyMap.set(action.item.memKey,true)
      return {
        memory: [...state.memory, action.item],
        keyMap: state.keyMap
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}


export default function MemoryEditor({
  memory, // 配列
  handleSaveMemory
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(()=>{
    if(memory){
      dispatch({type:'setMemory',memory:memory})
    }
  },[memory]);

  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      console.log("rowUpdate", newRow, oldRow);
      if (newRow.memKey !== "" || newRow.memValues !== "") {
        // 0. 追加した直後はチェックしない

        if (newRow.id !== oldRow.id && state.keyMap.has(newRow.memKey)) {
          // 1. keyの unique 制約
          return reject(new Error("キーは重複禁止です"));

        } else if (!/\{[a-zA-Z_]+\}/.test(newRow.memKey)) {
          // 2. keyは正規表現 /\{[a-zA-Z_]+\}/ と一致していることが要求される
          return reject(new Error("キーは半角アルファベットまたは'_'からなる文字列を{}で囲った形式にして下さい"));
        }

        else if (newRow.memValues === "") {
          // 4. valuesには NOT NULL 制約がある。
          return reject(new Error("値は空にしないで下さい。','で区切ると複数設定できます。"));
        } else {
          dispatch({ type: 'update', newRow: newRow })
          return resolve(newRow);
        }
      } else {
        // このresolveにより内部的にapiRef.current.updateRows([newRow])が実行される
        resolve(newRow);
        dispatch({ type: 'update', newRow: newRow })

      }
    }), [state.keyMap]);



  const columns = [
    { field: 'memKey', headerName: 'キー', width: 150, editable: true },
    { field: 'memValues', headerName: '値', width: 300, editable: true, flex: 1 },
  ];

  const rowModel = {
    memKey: "",
    memValues: ""
  };

  return (
    <ScriptDataGrid
      sx={{ height: `${52 * 8}px` }}
      rowModel={rowModel}
      fieldToFocus="memKey"
      scriptRows={state.memory}
      scriptColumns={columns}
      editMode="row"
      processRowUpdate={processRowUpdate}
      isCellEditable={isCellEditable}
    />

  )

}