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
  
  Datagridでは、編集モードを終了するとonRowEditStopイベントがトリガされる。
  onRowEditStopイベントではreasonを調べることでrowFocusOutなど編集が終了した
  理由がわかる。そこでreasonがenterKeyDownであった場合それを記憶しておく。
  続いて実行されるprocessRowUpdateの中で上述の制約のチェックを行う。
  問題なければデータを書き換えがおこなわれる。
  その後、編集モードの終了がenterKeyDownだった場合は新しい行の生成を試みる。

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
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();

const initialState = {
  memory: [],
  isChanged: false,
  rejectMessage: false,
  requireNextRow: false,
  nextEditRowId: false,
};

function reducer(state, action) {
  console.log(`reducer MemoryEidtor - ${action.type}`)
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
        requireNextRow: false,
        nextEditRowId: false,
        isChanged: false
      }
    }
    case 'reject': {
      return {
        ...state,
        rejectMessage: action.message,
        requireNextRow: false,
        nextEditRowId: false,
      }
    }

    case 'close': {
      return {
        ...state,
        rejectMessage: false
      }
    }
    case 'addRow': {
      // memKeyが空文字列の行があったらaddはしないでその行に
      // フォーカスする
      for(let item of state.memory){
        if(item.memKey===""){
          return {
            ...state,
            rejectMessage: false,
            requireNextRow: false,
            nextEditRowId: item.id
          }
        }
      }

      const id = randomId();
      return {
        ...state,
        memory: [
          ...state.memory,
          { id: id, memKey: "", memValues: "" }
        ],
        rejectMessage: false,
        requireNextRow: false,
        nextEditRowId: id,
      }
    }

    case 'endEdit': {
      return {
        ...state,
        requireNextRow: action.reason === 'enterKeyDown'
      }
    }

    case 'startEdit': {
      return {
        ...state,
        requireNextRow: false,
        nextEditRowId: false,
      }
    }

    case 'updateRow': {
      const newRow = action.newRow.row;
      // action.newRow = {
      //   columns, id, field, 
      //   reason: 'rowFocusOut', ... ,
      //   row {
      //     id, memKey, memValues 
      //   }
      // }
      let nextEditRowId = false;

      // memoryの差し替え
      const newMemory = state.memory.map(
        item => item.id === newRow.id ? newRow : item
      );
      
      const reason = action.newRow.reason;
      // 書き換え前のキーが""だったら次の行を生成
      
      if(reason === 'enterKeyDown'){
        nextEditRowId = false;
        for (let item of state.memory) {
          if (item.id === newRow.id) {
            if (item.memKey === "") {
              nextEditRowId =randomId();
              newMemory.push({
                id: nextEditRowId,
                memKey: "",
                memValues: ""
              })
              break;
            }
          }
        }
  
      }

      return {
        ...state,
        memory: newMemory,
        rejectMessage: false,
        nextEditRowId: nextEditRowId,
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
    if (state.nextEditRowId) {
      // フォーカスをそのidの場所に移動
      // インデックスを逆順にたどる
      let ids = gridExpandedSortedRowIdsSelector(apiRef);
      for (let i = ids.length + 1; i >= 0; i--) {
        if (state.nextEditRowId === ids[i]) {
          console.log("行編集自動開始", i, state.nextEditRowId)
          apiRef.current.startRowEditMode({
            id: state.nextEditRowId,
            fieldToFocus: "memKey"
          });
          dispatch({type: 'startEdit'});
          return;
        }
      }
      throw new Error(`id ${state.nextEditRowId} not found`)
    }
  }, [state.nextEditRowId, apiRef])

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
      console.log("rowUpdate", newRow,oldRow)

      if (newRow.id !== oldRow.id && memory.has(newRow.memKey)) {
        // 1. keyの unique 制約
        reject(new Error("キーは重複禁止です"));

      } else if (!/\{[a-zA-Z_]+\}/.test(newRow.memKey)) {
        // 2. keyは正規表現 /\{[a-zA-Z_]+\}/ と一致していることが要求される
        reject(new Error("キーは半角アルファベットまたは'_'からなる文字列を{}で囲った形式にして下さい"));
      }

      else if (newRow.memValues === "") {
        // 4. valuesには NOT NULL 制約がある。
        reject(new Error("値は空にしないで下さい。','で区切ると複数設定できます。"));

      } else {

        resolve(newRow);
      }
    }), [memory]);

  const handleProcessRowUpdateError = useCallback((error) => {
    dispatch({ type: 'reject', message: error.message });
  }, []);

  function handleDelete(params) {

  }

  function handleAdd() {
    dispatch({ type: 'addRow' });
  }

  function onRowEditStop(params, event) {
    dispatch({ type: 'endEdit', reason: params.reason });
  }

  function handleCloseRejectedDialog() {
    dispatch({ type: 'close' });
  }

  return (
    <>
      <DataGrid
        apiRef={apiRef}
        sx={{ height: `${52 * 8}px` }}
        rows={state.memory}
        columns={columns}
        editMode="row"
        isCellEditable={isCellEditable}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        onRowEditStop={onRowEditStop}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { handleAdd, isChanged: state.isChanged, handleSaveMemory },
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