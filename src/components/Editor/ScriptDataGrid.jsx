/*
    ScriptDataGrid

    DataGridでスクリプトのように行の追加を連続して行えるような
    入力支援を組み込む。

    * 「行を追加」ボタン押下でappendModeのON/OFFが切り替わる。
    * appendModeの状態でEnterキー押下で入力が終わったら自動で次の行を追加し、
      新しい行の編集が始まる
    * 行の編集がFocusOutで終わったらappendModeから抜ける

    ■ 派生コンポーネント
    このコンポーネントではデータの構造に触れず、UIだけを構成する。そのため
    ユーザはこのコンポーネントを使用する際に
    processRowUpdate
    columns
    rows
    handleAppendLastRow
    handleAppendNextRow

    を与える。このコンポーネントは与えられたcolumnsの末尾に削除ボタンを追加する。 

    
    ■ performanceのための設計
    行末以外の行へのappendはrows配列の中で位置を特定する必要があるため、
    これに限りrowsの書き換えを行う。それ以外の場合、つまり書き換え、削除、
    行末へのappendにはupdateRows()を利用する。
*/

import React, { useReducer, useEffect, useCallback } from 'react';
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

function isInclusive(model, instance) {
  // modelに含まれるプロパティとその値がinstanceにすべて含まれていたらtrue
  for (let key in model) {
    if (key in instance) {
      if (instance[key] !== model[key]) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}


function generateInitilaState(rowModel, fieldToFocus) {
  return {
    appendMode: false,
    rowSelectionModel: [], // 選択中の行
    editReuest: false, // 行の追加が完了したらidを記憶
    fieldToFocus: fieldToFocus,
    rowModel: rowModel,// 未記入状態のrowを定義
    rejectMessage: false,
  }
}

function reducer(state, action) {
  console.log(`reducer ScriptDataGrid - ${action.type}`);
  switch (action.type) {
    case 'setAppendMode': {
      return {
        ...state,
        appendMode: action.appendMode
      }
    }

    case 'selectRow': {
      return {
        ...state,
        rowSelectionModel: action.rowSelectionModel,
        editRequest: false,
      }
    }

    case 'editRequest': {
      return {
        ...state,
        rowSelectionModel: [],
        editRequest: action.currentRowId
      }
    }

    case 'editRequestDispatched': {
      return {
        ...state,
        rowSelectionModel: [],
        editRequest: false,
      }
    }

    case 'reject': {
      return {
        ...state,
        rejectMessage: action.message,
        editRequest: false,
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


export default function ScriptDataGrid(props) {
  // props.fieldToFocus 追加モードで最初にフォーカスをセットするフィールド

  const [state, dispatch] = useReducer(reducer, generateInitilaState(
    props.rowModel,
    props.fieldToFocus
    ));
  const apiRef = useGridApiRef();

  const handleAdd = useCallback(() => {
    if (state.appendMode) {
      dispatch({ type: 'setAppendMode', appendMode: false });
    } else {
      if (state.rowSelectionModel.length !== 0) {
        // 行が選択されていたら次の行に追加
        const currentRowId = state.rowSelectionModel[0];
        const oldRows = apiRef.current.getRowModels();
        const newRows = []
        oldRows.forEach((row, id) => {
          newRows.push({ id: id, ...row });
          if (currentRowId === id) {
            newRows.push({ id: randomId(), ...state.rowModel });
          }
        })
        props.handleSave(newRows);

      } else {
        // 最下行が未記入でなければ追加
        const rowIds = gridExpandedSortedRowIdsSelector(apiRef);
        const row = apiRef.current.getRow(rowIds[rowIds.length - 1]);

        if (isInclusive(state.rowModel, row)) {
          // rowModelと同じ=未記入の場合末尾に追記
          const newRows= [];
          const oldRows = apiRef.current.getRowModels();
          oldRows.forEach((row,id)=>{
            newRows.push({id:id, ...row});
          });
          newRows.push({id:randomId(), ...state.rowModel});
          props.handleSave(newRows);
        } else {
          // 未記入行があればそこを編集
          dispatch({type: 'editRequest', currentRowId: row.id})
        }
      }
    }
  }, [apiRef, state.rowSelectionModel, state.rowModel]);

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



  function handleCellEditStop(params) {
    const reason = params.reason;
    if (reason === 'enterKeyDown' && params.row.memKey === "") {
      dispatch({ type: 'setAppendMode', appendMode: true })
    } else {
      dispatch({ type: 'setAppendMode', appendMode: false })
    }
  }

  useEffect(() => {
    if (state.editRequest) {
      apiRef.current.startRowEditMode({
        id: state.editRequest,
        fieldToFocus: state.fieldToFocus
      });
      dispatch({ type: 'editRequestDispatched' });
    }
  }, [state.editRequest, apiRef, state.fieldToFocus]);

  const handleProcessRowUpdateError = useCallback((error) => {
    dispatch({ type: 'reject', message: error.message });
  }, []);

  function handleCloseRejectedDialog() {
    dispatch({ type: 'close' });
  }

  function handleRowSelectionModelChange(model) {
    dispatch({ type: 'selectRow', rowSelectionModel: model });
  }

  function handleDelete(params){
    apiRef.current.updateRows([{ id: params.id, _action: 'delete' }]);
  }

  const newColumns = [
    ...props.scriptColumns,
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

  return (
    <>
      <DataGrid
        {...props}
        apiRef={apiRef}
        columns={newColumns}
        rows={props.scriptRows}
        editMode="row"
        onRowSelectionModelChange={handleRowSelectionModelChange}
        rowSelectionModel={state.rowSelectionModel}
        onCellEditStop={handleCellEditStop}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { handleAdd, handleSaveMemory:props.handleSaveMemory, state },
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

