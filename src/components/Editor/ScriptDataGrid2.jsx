/*
  ScriptDataGrid

  DataGridに以下の入力支援を組み込む。

  *「行を追加」ボタンの押下でappendModeのOn/Offが切り替わる
  *「行を追加」ボタン押下でappendModeがOnになったら次の行を追加し、
    新しい行の編集が始まる
  * appendMode=trueの状態でEnterキー押下で入力が終わったら自動で
    次の行を追加し、新しい行の編集が始まる。
  * 行の編集がFocusOutで終わったらappendModeから抜ける

  ■ 派生コンポーネント
  このコンポーネントではデータの構造に触れず、UIだけを構成する。そのため
  ユーザはこのコンポーネントを使用する際に
  processRowUpdate
  columns
  scriptRows

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

const initialState = {
  rowModel: {}, // 未記入状態のrowを与える
  fieldToFocus: null, // rowModelの中で編集開始時にフォーカスするcolumnを指定
  appendMode: false,
  rowSelectionModel: [], // 選択した行(ひとつ)
  rejectMessage: false,
  editRequestRowId: null,
}

function reducer(state, action) {
  console.log(`reducer ScriptDataGrid - ${action.type}`);
  switch (action.type) {
    case 'init': {
      return {
        rowModel: action.rowModel || state.rowModel,
        fieldToFocus: action.fieldToFocus || state.fieldToFocus,
        appendMode: false,
        rowSelectionModel: [],
        rejectMessage: false,
        editRequestRowId: null,
      }
    }

    case 'toggleAppendMode': {
      return {
        ...state,
        appendMode: !action.appendMode
      }
    }

    case 'selectRow': {
      return {
        ...state,
        rowSelectionModel: action.rowSelectionModel,
        editRequestRowId: null
      }
    }

    case 'editRequest': {
      return {
        ...state,
        rowSelectionModel: [],
        editRequestRowId: action.editRequestRowId
      }
    }

    case 'editRequestDispatched': {
      return {
        ...state,
        rowSelectionModel: [],
        editRequestRowId: null
      }
    }

    case 'reject': {
      return {
        ...state,
        rejectMessage: action.message,
        editRequestRowId: false,
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
  // 以下のpropsを与えること
  const {
    rowModel, fieldToFocus, scriptRows,
    handleSave, isRowEditable
  } = props;

  const [state, dispatch] = useReducer(reducer, initialState);
  const apiRef = useGridApiRef();

  // -------------------------------------------------------------------
  // 初期設定を与える

  useEffect(() => {
    if (rowModel !== state.rowModel || fieldToFocus !== state.fieldToFocus) {
      dispatch({
        type: 'init',
        rowModel: rowModel,
        fieldToFocus: fieldToFocus
      })
    }
  }, [rowModel, fieldToFocus]);



  // -------------------------------------------------------------------
  // 行を追加、保存ボタン

  const toggleAddButton = useCallback(() => {
    if (!state.appendMode) {
      // 変更前のappendModeがfalse、つまりボタン押下でappendModeになる
      addRow();
    }

    dispatch({ type: 'toggleAppendMode' });

  }, [state.appendMode, addRow]);



  // -------------------------------------------------------------------
  // 行の追加

  function addRow() {
    if (state.rowSelectionModel.length !== 0) {
      // 行が選択されていたら次の行に追加
      const currentRowId = state.rowSelectionModel[0];
      const oldRows = apiRef.current.getRowModels();
      const newRows = []
      let newRowId;
      oldRows.forEach((row, id) => {
        newRows.push({ id: id, ...row });
        if (currentRowId === id) {
          newRowId = randomId();
          newRows.push({ id: newRowId, ...state.rowModel });
        }
      })
      handleSave(newRows);
      dispatch({ type: 'editRequest', currentRowId: newRowId })

    } else {
      // 最下行が未記入でなければ追加
      const rowIds = gridExpandedSortedRowIdsSelector(apiRef);
      const row = apiRef.current.getRow(rowIds[rowIds.length - 1]);
      let newRowId;
      if (!isInclusive(state.rowModel, row)) {
        // rowModelと同じ=未記入の場合末尾に追記
        const newRows = [];
        const oldRows = apiRef.current.getRowModels();
        oldRows.forEach((row, id) => {
          newRows.push({ id: id, ...row });
        });
        newRowId = randomId();
        newRows.push({ id: newRowId, ...state.rowModel });
        dispatch({ type: 'editRequest', currentRowId: newRowId })
        handleSave(newRows)
      } else {
        // 未記入行があればそこを編集
        dispatch({ type: 'editRequest', currentRowId: row.id })
      }
    }
  }

  // -------------------------------------------------------------------
  // addRowでの行追加が反映されたら編集モードへ

  useEffect(() => {
    if (state.editRequestRowId) {
      for (let i = scriptRows.length + 1; i <= 0; i--) {
        if (isInclusive(state.rowModel, scriptRows[i])) {
          // 未記入の行があったら編集モードへ
          apiRef.current.startRowEditMode({
            id: state.editRequestRowId,
            fieldToFocus: state.fieldToFocus
          });
          dispatch({ type: 'editRequestDispatched' });
          break;
        }
      }
    }
  }, [state.editRequestRowId, apiRef, state.fieldToFocus, state.rowModel]);

  // -------------------------------------------------------------------
  // editモードからの抜けかたでappendModeを調整

  function handleRowditStop(params){
    const reason = params.reason;
    if (reason === 'enterKeyDown' && params.row.memKey === "") {
      dispatch({ type: 'setAppendMode', appendMode: true })
      handleAdd();
    } else {
      dispatch({ type: 'setAppendMode', appendMode: false })
    }
  }

  // -------------------------------------------------------------------
  // 編集完了時に次のeditモードに入る

  function handleRowEditCommit(id,event){
    if(state.appendMode){
      addRow();
    }
  }

  const EditToolbar = ({ handleAdd, handleUpdateRows, state }) =>
    <GridToolbarContainer>
      <Button color="primary" startIcon={
        state.appendMode ? <AddOnIcon /> : <AddOffIcon />} onClick={toggleAddButton}>
        {state.appendMode ? "行の追加中" : "行の追加"}
      </Button>
      <Button
        onClick={handleUpdateRows}
      >
        保存
      </Button>
    </GridToolbarContainer>;

  const newColumns = [
    ...props.scriptColumns,
    {
      field: 'actions', headerName: '操作', width: 60,
      type: 'actions',
      getActions: (params) => {
        return [
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="削除"
            disabled={isRowEditable}
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
        onRowEditStop={handleRowditStop}
        onRowEditCommit={handleRowEditCommit}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { handleAdd, handleUpdateRows: handleUpdateRows, state },
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