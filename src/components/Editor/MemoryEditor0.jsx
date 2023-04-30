/*
    MemoryEditor
    Memoryの内容を編集
    Memoryはkey:[values]という形式で格納され、keyはuniqueである。
    キーは/\{[a-zA-Z_]+\}/という形式で、キーがパターン /\{[A-Z_]+\}/ に
    一致する場合その値は空文字であることが許されず、そのitemは削除できない
*/

import React, { useCallback, useState, useEffect } from 'react';
import {
  DataGrid, useGridApiRef,
  gridVisibleColumnDefinitionsSelector,
  gridExpandedSortedRowIdsSelector,
} from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import RejectedDialog from './RejectedDialog';

function isCellEditable({ field, row }) {
  return field !== 'memKey' || !/\{[A-Z_]+\}/.test(row.memKey)
}

function buildRows(memory) {
  let i = 0;
  let rows = [];
  memory.forEach((val, key) => {
    rows.push({
      id: i,
      memKey: key,
      memValues: val.join(',')
    });
    i++;
  })
  return rows;
}


export default function MemoryEditor({
  memory,
  handleChangeItem,
  isMemoryHaveNewItem,
  handleTouch
}) {
  const apiRef = useGridApiRef();
  const [rejectMessage, setRejectMessage] = useState(false);

  const rows = buildRows(memory);

  const columns = [
    { field: 'memKey', headerName: 'キー', width: 150, editable: true },
    { field: 'memValues', headerName: '値', width: 300, editable: true },
    {
      field: 'operation', headerName: '操作', width: 60,
      disableClickEventBubbling: true,
      renderCell: (params) => {
        const disabled = /\{[A-Z_]+\}/.test(params.row.memKey);
        return (<IconButton
          disabled={disabled}
          onClick={e => handleClickDelete(params)}
        >
          <DeleteIcon />
        </IconButton>);
      }
    }
  ];

  // ------------------------------------------------
  // エディタに新しいデータを入力したあとで非同期的に
  // 次の空行が生成される。それを検知して空行を編集状態にする

  useEffect(() => {
    if (isMemoryHaveNewItem) {
      const rowIndex = memory.size-1;
      handleTouch();
      apiRef.current.scrollToIndexes({ rowIndex: rowIndex, colIndex: 0 });
      const id = gridExpandedSortedRowIdsSelector(apiRef)[rowIndex];
      const column = gridVisibleColumnDefinitionsSelector(apiRef)[0];
      apiRef.current.setCellFocus(id, column.field);
      apiRef.current.startRowEditMode({ id: memory.size - 1 });
    }
  }, [isMemoryHaveNewItem, apiRef, memory])


  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      console.log(oldRow, newRow)
      // keyが変更された場合：unique制約
      if (newRow.memKey !== oldRow.memKey) {
        if (memory.has(newRow.memKey)) {
          setRejectMessage("キーは重複してはいけません。");
          reject(oldRow);
          return;
        }
      }

      // keyが空文字のまま未編集で終了した→編集終了
      if (newRow.memKey === oldRow.memKey === "" && newRow.memValues===oldRow.memValues) {
        
        reject(oldRow);
        return;
      }

      /* keyまたはvalueを書き換える。
         空文字""のmemKeyは許可しない。それを利用してoldKeyが空文字列の
         場合、最下行に新しい行を追加する
      */
      handleChangeItem(oldRow.memKey, newRow.memKey, newRow.memValues);
      resolve(newRow);
    })
    , [handleChangeItem, memory]);

  function handleCloseRejectedDialog() {
    setRejectMessage(false);
  }

  function handleClickDelete(params) {
    // エントリの削除
    console.log(params)
  }
  

  return (
    <>
      <DataGrid
        sx={{ height: "400px" }}
        columns={columns}
        rows={rows}
        editMode="row"
        apiRef={apiRef}
        isCellEditable={isCellEditable}
        processRowUpdate={processRowUpdate}
      />
      <RejectedDialog
        open={rejectMessage !== false}
        message={rejectMessage}
        handleClose={handleCloseRejectedDialog}
      />
    </>

  )
}