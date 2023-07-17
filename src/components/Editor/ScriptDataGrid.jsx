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
  // modelが空でなく
  // modelに含まれるプロパティとその値がinstanceにすべて含まれていたらtrue

  if (!Object.keys(model).length) {
    return false;
  }
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


const initialState = {
  rowModel: {}, // 未記入状態のrowを与える
  fieldToFocus: null, // rowModelの中で編集開始時にフォーカスするcolumnを指定
  appendMode: false,
  rowSelectionModel: [], // 選択した行(ひとつ)
  rejectMessage: false,
  editRequestRowId: null,
  rowModesModel: {}
}

function reducer(state, action) {
  // console.log(`reducer ScriptDataGrid - ${action.type}`);
  switch (action.type) {
    case 'init': {
      return {
        rowModel: action.rowModel || state.rowModel,
        fieldToFocus: action.fieldToFocus || state.fieldToFocus,
        appendMode: false,
        rowSelectionModel: [],
        rejectMessage: false,
        editRequestRowId: null,
        rowModesModel: {},
      }
    }

    case 'toggleAppendMode': {
      return {
        ...state,
        appendMode: !state.appendMode
      }
    }

    case 'setAppendMode': {
      return {
        ...state,
        appendMode: action.appendMode,
      }
    }

    case 'selectRow': {
      return {
        ...state,
        rowSelectionModel: action.rowSelectionModel,
        editRequestRowId: null
      }
    }

    case 'unselectRow': {
      return {
        ...state,
        rowSelectionModel: []
      }
    }

    case 'editRequest': {
      return {
        ...state,
        rowSelectionModel: [],
        editRequestRowId: action.editRequestRowId,
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
    rowModel, fieldToFocus, scriptRows, scriptColumns,
    handleSave, isRowEditable, lastInsertRowId, scriptRowEditStop
  } = props;

  const [state, dispatch] = useReducer(reducer, initialState);
  const apiRef = useGridApiRef();

  // -------------------------------------------------------------------
  // 初期設定を与える

  useEffect(() => {
    if (!isInclusive(state.rowModel, rowModel) || fieldToFocus !== state.fieldToFocus) {
      dispatch({
        type: 'init',
        rowModel: rowModel,
        fieldToFocus: fieldToFocus
      })
    }
  }, [rowModel, state.rowModel, fieldToFocus, state.fieldToFocus]);


  // -------------------------------------------------------------------
  // ブランク行の削除

  const removeBlankRow = useCallback(() => {
    // 行の削除はupdateRowsで処理できるため、元データの更新はしない。

    const oldRows = apiRef.current.getRowModels();
    oldRows.forEach((row, id) => {
      if (isInclusive(state.rowModel, row)) {
        apiRef.current.updateRows([{ id: id, _action: 'delete' }]);
      }
    });

  }, [apiRef, state.rowModel]);

  // -------------------------------------------------------------------
  // 行の追加

  const addRow = useCallback((updatedRow) => {
    // 行の追加。追加はupdateで対応できず、元データの更新をかける。
    // updatedRowはrowUpdateで渡される更新後の内容

    let newRowId;
    let newRows = [];
    const oldRows = apiRef.current.getRowModels();

    if (state.rowSelectionModel.length !== 0) {
      // 行を選択してボタンを押下した場合は選択行の次の行に
      // modelを追加してeditRequest
      const currentRowId = state.rowSelectionModel[0];
      oldRows.forEach((row, id) => {
        newRows.push({ id: id, ...row });
        if (currentRowId === id) {
          newRowId = randomId();
          newRows.push({ id: newRowId, ...state.rowModel });
        }
      })

    } else {

      if (updatedRow) {
        // 行を入力した後(=updatedRowがある)はその行を変更して
        // 次の行を追加する
        oldRows.forEach((row, id) => {
          if (updatedRow.id === id) {
            newRows.push(updatedRow);
            newRowId = randomId();
            newRows.push({ id: newRowId, ...state.rowModel });
          } else {
            newRows.push({ id: id, ...row });
          }
        });
      } else {
        // 行が選択されておらずAddボタン押下した場合は末尾に
        // modelを追加する
        oldRows.forEach((row, id) => {
          newRows.push({ id: id, ...row });
        });
        newRowId = randomId();
        newRows.push({ id: newRowId, ...state.rowModel });
      }
    }
    handleSave(newRows, newRowId)
    dispatch({ type: 'editRequest', editRequestRowId: newRowId });

  }, [apiRef, handleSave,
    state.rowModel, state.rowSelectionModel]);


  // -------------------------------------------------------------------
  // addRowでの行追加が反映されたら編集モードへ

  useEffect(() => {
    if (state.editRequestRowId && state.editRequestRowId === lastInsertRowId) {
      apiRef.current.startRowEditMode({
        id: state.editRequestRowId,
        fieldToFocus: state.fieldToFocus
      });
      dispatch({ type: 'editRequestDispatched' });
    }
  }, [state.editRequestRowId, apiRef, state.fieldToFocus, lastInsertRowId]);

  // -------------------------------------------------------------------
  // editモードからの抜けかたでappendModeを調整

  function handleRowEditStop(params) {
    if (scriptRowEditStop) {
      const mode = scriptRowEditStop(params);
      dispatch({ type: 'setAppendMode', appendMode: mode==="append" });

    }
  }

  // -------------------------------------------------------------------
  // 編集完了時に次のeditモードに入る

  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      // console.log("rowUpdate")
      if (state.appendMode) {
        addRow(newRow);
      }
      return resolve(newRow);

    }), [state.appendMode, addRow]);

  // -------------------------------------------------------------------

  const handleProcessRowUpdateError = useCallback((error) => {
    dispatch({ type: 'reject', message: error.message });
  }, []);

  function handleCloseRejectedDialog() {
    dispatch({ type: 'close' });
  }

  function handleRowSelectionModelChange(model) {
    dispatch({ type: 'selectRow', rowSelectionModel: model });
  }

  function handleDelete(params) {
    apiRef.current.updateRows([{ id: params.id, _action: 'delete' }]);
  }

  function handleClickSave() {
    // 現在apiが保持しているrowsをsave
    // saveボタンのように行の追加が伴わない場合
    let rowsMap = apiRef.current.getRowModels();
    let rows = [];
    rowsMap.forEach((val,key)=>{
      rows.push({...val});
    })
    props.handleSave(rows);

  }

  // -------------------------------------------------------------------
  // 行を追加、保存ボタン

  const toggleAddButton = useCallback(() => {
    if (!state.appendMode) {
      // 変更前のappendModeがfalse、つまりボタン押下でappendModeになる
      addRow();
    } else {
      // 変更前のappendModeがtrue、つまりボタン押下でappendMode解除
      // 空行があったら削除する
      removeBlankRow();
    }

    dispatch({ type: 'toggleAppendMode' });

  }, [state.appendMode, addRow, removeBlankRow]);


  const EditToolbar = ({ toggleAddButton, handleClickSave, state }) =>
    <GridToolbarContainer>
      <Button color="primary" startIcon={
        state.appendMode ? <AddOnIcon /> : <AddOffIcon />} onClick={toggleAddButton}>
        {state.appendMode ? "行の追加中" : "行の追加"}
      </Button>
      <Button
        onClick={handleClickSave}
      >
        保存
      </Button>
    </GridToolbarContainer>;

  const newColumns = [
    ...scriptColumns,
    {
      field: 'actions', headerName: '操作', width: 60,
      type: 'actions',
      getActions: (params) => {
        const disabled = isRowEditable(params);
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
        rows={scriptRows}
        editMode="row"
        rowSelectionModel={state.rowSelectionModel}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        onRowEditStop={handleRowEditStop}
        onRowSelectionModelChange={handleRowSelectionModelChange}
        processRowUpdate={processRowUpdate}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { toggleAddButton, handleClickSave, state },
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