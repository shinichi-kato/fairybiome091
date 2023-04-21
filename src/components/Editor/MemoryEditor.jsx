/*
    MemoryEditor
    Memoryの内容を編集
    Memoryはkey:[values]という形式で格納され、keyはuniqueである。
    キーは/\{[a-zA-Z_]+\}/という形式で、キーがパターン /\{[A-Z_]+\}/ に
    一致する場合その値は空文字であることが許されず、そのitemは削除できない
*/

import React, { useCallback, useState } from 'react';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import RejectedDialog from './RejectedDialog';

function isCellEditable({ field, row }) {
  return field !== 'memKey' || !/\{[A-Z_]+\}/.test(row.memKey)
}




export default function MemoryEditor({
  memory,
  handleChangeItem,
  handleAddNewItem,
}) {
  const apiRef = useGridApiRef();
  const [rejectMessage, setRejectMessage] = useState(false);

  function handleClickDelete(params) {
    // エントリの削除
    console.log(params)
  }

  const columns = [
    { field: 'memKey', headerName: 'キー', width: 150, editable: true },
    { field: 'memValues', headerName: '値', width: 300, editable: true },
    {
      fiels: 'operation', headerName: '操作', width: 60,
      disableClickEventBubbling: true,
      renderCell: (params) => {
        const disabled = /\{[A-Z_]+\}/.test(params.row.memKey);
        return (<IconButton
          disabled={disabled}
          onClick={e => handleClickDelete(params)}
        >
          <DeleteIcon />
        </IconButton>);
      }}
  ];

  let rows = Object.keys(memory).map((key, index) => ({
    id: index,
    memKey: key,
    memValues: memory[key].join(',')
  }));

  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      console.log(oldRow)
      // keyが変更された場合：unique制約
      if (newRow.memKey !== oldRow.memKey) {
        if (newRow.memKey in memory) {
          setRejectMessage("キーは重複してはいけません。");
          reject(oldRow);
          return;
        }
      }

      // keyは空文字列禁止
      if (newRow.memKey === oldRow.memKey === ""){
        setRejectMessage("キーが空です")
        reject(oldRow)
      }

      /* keyまたはvalueを書き換える。
         空文字""のmemKeyは許可しない。それを利用してoldKeyが空文字列の
         場合、最下行に新しい行を追加する
      */
      handleChangeItem(oldRow.memKey, newRow.memKey, newRow.memValues);
      if(oldRow.memKey === ""){
        handleAddNewItem();
      }

      // 最下行を編集中で、その行のmemKeyが""ではなく、valueが書き換えられた
      // 場合に新しい行を追加する

      resolve(newRow);
    })
    , [handleChangeItem, handleAddNewItem, memory]);

  function handleCloseRejectedDialog() {
    setRejectMessage(false);
  }

  return (
    <>
      <DataGrid
        sx={{ height: "400px" }}
        columns={columns}
        rows={rows}
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