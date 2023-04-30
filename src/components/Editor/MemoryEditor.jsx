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
  
  * 入力はrowモードで、行の編集終了時に上述の制約を満足しない場合rejectする。
  * 新しい行(編集前のkeyが"")の入力が終わったとき、keyが空文字の行がなければ
    新しく行を追加し、その行のeditモードに入る。
   この状態を管理するためaddingRowIdという値を用いる。行の追加ボタンを押下する
   ことで最終行の下に新しい行が追加され、そのRowIdがaddingRowIdに渡される。
   追加した行の入力が終わると次の空行が作られ
   フォーカスが移動しaddingRowIdが更新される。
   updateRowIdに入った時点でaddingRowIdとnewRowのidが異なっていたら他の行の
   編集であるためaddingRowIdをfalseにする。

*/

import React, { useReducer, useCallback, useEffect } from 'react';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarContainer,
  useGridApiRef,
  gridVisibleColumnDefinitionsSelector,
  gridExpandedSortedRowIdsSelector,
} from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

const initialState = {
  memory: [],
  isChanged: false,
  rejectMessage: false,
  addingRowId: false,

};

function reducer(state, action) {
  switch (action.type) {
    case 'upkeep': {
      let rows = [];
      action.memory.forEach((val, key) => {
        rows.push({
          id: randomId(),
          memKey: key,
          memValues: val.join(',')
        });
      })
      return {
        memory: rows,
        rejectMessage: false,
        addingRowId: false,
        isChanged: false
      }
    }
    case 'reject': {
      return {
        ...state,
        rejectMessage: action.message
      }
    }

    case 'close': {
      return {
        ...state,
        rejectMessage: false
      }
    }
    case 'addRow': {
      const id = randomId();
      return {
        ...state,
        memory: [
          ...state.memory,
          { id: id, memKey: "", memValues: "" }
        ],
        rejectMessage: false,
        addingRowId: id,
      }
    }

    case 'editRow': {
      const newRow = action.newRow;
      if (state.addingRowId === newRow.id) {
        // 追加モードが生きている→行を増やす
        const id = randomId();
        return {
          ...state,
          memory: [
            ...state.memory,
            newRow,
            { id: id, memKey: "", memValues: "" }
          ],
          rejectMessage: false,
          addingRowId: id
        }
      }

      return {
        ...state,
        memory: state.mempry.map(i => i.id === newRow.id ? newRow : i),
        rejectMessage: false,
        addingRowId: false
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

function isCellEditable({ field, row }) {
  return field !== 'memKey' || !/\{[A-Z_]+\}/.test(row.memKey)
}

const EditToolbar = ({ handleAdd, isChanged, handleSaveMemory }) =>
  <GridToolbarContainer>
    <Button color="primary" startIcon={<AddIcon />} onClick={handleAdd}>
      行の追加
    </Button>
    <Button
      onClick={handleSaveMemory}
      disabled={!isChanged}
    >
      保存
    </Button>
  </GridToolbarContainer>;



export default function MemoryEditor({
  memory, //Mapオブジェクト
  handleSaveMemory,
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const apiRef = useGridApiRef();

  useEffect(() => {
    if (memory) {
      dispatch({ type: 'upkeep', memory: memory })
    }
  }, [memory])

  useEffect(() => {
    if (state.addingRowId) {
      // フォーカスをそのidの場所に移動
      // インデックスを逆順にたどる
      let ids = gridExpandedSortedRowIdsSelector(apiRef);
      for (let i = ids.length + 1; i >= 0; i--) {
        if (state.addingRowId === ids[i]) {
          const column = gridVisibleColumnDefinitionsSelector(apiRef)[0];
          apiRef.current.setCellFocus(i, column.field);
          apiRef.current.startRowEditMode({ id: state.addingRowId });
          return;
        }
      }
      console.log("err")
    }
  }, [state.addingRowId, apiRef])

  const columns = [
    { field: 'memKey', headerName: 'キー', width: 150, editable: true },
    { field: 'memValues', headerName: '値', width: 300, editable: true, flex: 1 },
    {
      field: 'actions', headerName: '操作', width: 60,
      type: 'actions',
      getActions: (params) => {
        const disabled = /\{[A-Z_]+\}/.test(params.row.memKey);
        return [
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="削除"
            disabled={disabled}
            onClick={e => handleDelete(params)}
          />
        ]
      }
    }
  ];

  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      // rejectすると変更は破棄されeditmodeのまま
      // resolve(oldRow)すると変更せずviewmodeに抜ける
      // resolve(newRow)すると変更してviewmodeに抜ける

      if (memory.has(newRow.memKey)) {
        // 1. keyの unique 制約
        dispatch({ type: 'reject', message: "キーは重複しないようにして下さい" });
        reject(oldRow);

      } else if (!newRow.memKey.test(/\{[a-zA-Z_]+\}/)) {
        // 2. keyは正規表現 /\{[a-zA-Z_]+\}/ と一致していることが要求される
        dispatch({ type: 'reject', message: "キーは半角アルファベットまたは'_'からなる文字列を{}で囲った形式にして下さい" });
        reject(oldRow);

      } else if (newRow.values === "") {
        // 4. valuesには NOT NULL 制約がある。
        dispatch({ type: 'reject', message: "値は空にしないで下さい。','で区切ると複数設定できます。" });
        reject(oldRow);

      } else {

        resolve(newRow);
      }
    }), [memory]);

  function handleDelete(params) {

  }

  function handleAdd() {
    dispatch({ type: 'addRow' });
  }

  function onRowEditStop(params, event) {
    dispatch({ type: 'editRow', newRow: params });
  }

  return (
    <DataGrid
      apiRef={apiRef}
      sx={{ height: `${52 * 8}px` }}
      rows={state.memory}
      columns={columns}
      editMode="row"
      isCellEditable={isCellEditable}
      processRowUpdate={processRowUpdate}
      onRowEditStop={onRowEditStop}
      slots={{
        toolbar: EditToolbar,
      }}
      slotProps={{
        toolbar: { handleAdd, isChanged: state.isChanged, handleSaveMemory },
      }}
    />)
}