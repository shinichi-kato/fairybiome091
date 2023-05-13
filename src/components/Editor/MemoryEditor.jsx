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

import React, { useReducer, useCallback, useEffect } from 'react';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarContainer,
  useGridApiRef,
  gridExpandedSortedRowIdsSelector,
} from '@mui/x-data-grid';

import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddOnIcon from '@mui/icons-material/AddCircle';
import AddOffIcon from '@mui/icons-material/AddCircleOutline';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();


const initialState = {
  memory: [], // Mapオブジェクトをrow形式に変換して保持
  appendMode: false,
  rowSelectionModel: [], // 選択中の行（DataGridでは最大一つ)
  editRequest: false, // 行の追加が完了したらidを記憶。
  memKeys: new Map(), // memKeyのunique制約を計算するためにkeyを保持
  rejectMessage: false,
}

function reducer(state, action) {
  console.log(`reducer MemoryEidtor - ${action.type}`)
  switch (action.type) {
    case 'load': {
      let rows = [];
      let memKeys = new Map();
      action.memory.forEach((val, key) => {
        rows.push({
          id: randomId(),
          memKey: key,
          memValues: val.join(',')
        });
        memKeys.set(key, true);
      });
      return {
        memory: rows,
        memKeys: memKeys,
        appendMode: false,
        rowSelectionModel: [],
        editRequest: false,
        rejectMessage: false,
      }
    }

    case 'changeMode': {
      return {
        ...state,
        appendMode: action.mode
      }
    }
    case 'selectRow': {
      return {
        ...state,
        rowSelectionModel: action.rowSelectionModel
      }
    }

    case 'appendNextRow': {
      let newRows = [];
      const newId = randomId();
      for (let row of state.memory) {
        newRows.push(row);
        if (row.id === action.currentRowId) {
          newRows.push({ id: newId, memKey: "", memValues: "" });
        }
      }

      return {
        ...state,
        memory: newRows,
        appendMode: true,
        rowSelectionModel: [],
        editRequest: newId,
        rejectMessage: false
      }
    }

    case 'appendLastRow': {
      const newId = randomId();
      return {
        memory: [...state.memory,
        { id: newId, memKey: "", memValues: "" }
        ],
        appendMode: true,
        rowSelectionModel: [],
        editRequest: newId,
        rejectMessage: false
      }
    }

    case 'editRequest': {
      return {
        ...state,
        rowSelectionModel: [],
        editRequest: action.currentRowId
      }
    }

    case 'editDispatched': {
      return {
        ...state,
        rowSelectionModel: [],
        editRequest: false,
      }
    }

    case 'addKey': {
      const newMemKeys = new Map(state.memKeys);
      newMemKeys.set(action.key);
      return {
        ...state,
        memKeys: newMemKeys
      }
    }

    case 'update': {
      let newRows = [];
      for (let row of state.memory) {
        if (row.id === action.newRow.id) {
          newRows.push(action.newRow);
        } else {
          newRows.push(row);
        }
      }
      const newMemKeys = new Map(state.memKeys);
      newMemKeys.set(action.newRow.memKey);
      let editRequest = state.editRequest;

      if (state.appendMode) {
        editRequest = randomId();
        newRows.push({ id: editRequest, memKey: "", memValues: "" });
      }
      return {
        ...state,
        memory: newRows,
        memKeys: newMemKeys,
        editRequest: editRequest
      }
    }

    case 'reject': {
      return {
        ...state,
        rejectMessage: action.message,
        requireNextRow: false,
      }
    }

    case 'close': {
      return {
        ...state,
        rejectMessage: false
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

function isCellEditable({ field, row }) {
  return field !== 'memKey' || !/\{[A-Z_]+\}/.test(row.memKey)
}

const EditToolbar = ({ handleAdd, handleSaveMemory, state }) =>
  <GridToolbarContainer>
    <Button color="primary" startIcon={
      state.appendMode ? <AddOnIcon /> : <AddOffIcon />} onClick={handleAdd}>
      {state.appendMode ? "行の追加中" : "行の追加"}
    </Button>
    <Button
      onClick={handleSaveMemory}
    >
      保存
    </Button>
  </GridToolbarContainer>;


export default function MemoryEditor({
  memory, // Mapオブジェクト
  handleSaveMemory
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const apiRef = useGridApiRef();

  useEffect(() => {

    if (memory.size !== 0) {
      dispatch({ type: 'load', memory: memory })

    }
  }, [memory]);


  const handleAdd = useCallback(() => {
    /* select中の行の下に新しい行を追加。
       selectされてなければ最下行に追加。
       modeをappendに遷移する            */
    if (state.appendMode) {
      dispatch({ type: "changeMode", mode: false });
    } else {
      if (state.rowSelectionModel.length !== 0) {
        const rowId = state.rowSelectionModel[0];
        dispatch({ type: 'appendNextRow', currentRowId: rowId });

      } else {
        // 最下を探し、空行でなければ追加
        const rowIds = gridExpandedSortedRowIdsSelector(apiRef);
        const row = apiRef.current.getRow(rowIds[rowIds.length - 1]);
        if (row.memKey !== "") {
          dispatch({ type: 'appendLastRow' });
        } else {
          // 空行が既存ならそこを編集
          dispatch({ type: 'editRequest', currentRowId: row.id })
        }
      }
    }

  }, [apiRef, state.rowSelectionModel, state.appendMode]);



  function handleCellEditStop(params) {
    const reason = params.reason;
    if (reason === 'enterKeyDown' && params.row.memKey === "") {
      dispatch({ type: 'changeMode', mode: true })
    } else {
      dispatch({ type: 'changeMode', mode: false })
    }
  }

  /* */
  useEffect(() => {
    if (state.editRequest) {
      apiRef.current.startRowEditMode({
        id: state.editRequest,
        fieldToFocus: "memKey"
      });

      dispatch({ type: 'editDispatched' })
    }
  }
    , [state.editRequest, apiRef, state.rowSelectionModel]);


  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      console.log("rowUpdate", newRow, oldRow);
      if (newRow.memKey !== "" || newRow.memValues !== "") {
        // 0. 追加した直後はチェックしない

        if (newRow.id !== oldRow.id && state.memKeys.has(newRow.memKey)) {
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
        dispatch({ type: 'update', newRow:newRow })

      }
    }), [state.memKeys]);

  const handleProcessRowUpdateError = useCallback((error) => {
    dispatch({ type: 'reject', message: error.message });
  }, []);







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

  function handleCloseRejectedDialog() {
    dispatch({ type: 'close' });
  }

  function handleDelete(params) {

  }

  function handleRowSelectionModelChange(model) {
    dispatch({ type: 'selectRow', rowSelectionModel: model });
  }

  return (
    <>
      <DataGrid
        apiRef={apiRef}
        sx={{ height: `${52 * 8}px` }}
        rows={state.memory}
        columns={columns}
        editMode="row"
        onRowSelectionModelChange={handleRowSelectionModelChange}
        rowSelectionModel={state.rowSelectionModel}
        onCellEditStop={handleCellEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        isCellEditable={isCellEditable}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { handleAdd, handleSaveMemory, state },
        }}
      />
      <Snackbar
        open={state.rejectMessage !== false}
        onClose={handleCloseRejectedDialog}
      >
        <Alert severity="error" >
          {state.rejectMessage}
        </Alert>
      </Snackbar>
    </>
  )

}