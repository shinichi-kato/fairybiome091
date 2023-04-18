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
  return field === 'memKey' && /\{[A-Z_]+\}/.test(row.memKey)
}




export default function MemoryEditor({
  memory,
  handleChangeMemoryItem
}) {
  const apiRef = useGridApiRef();
  const [openRejectedDialog, setOpenRejectedDialog] = useState(false);

  function handleClickDelete(id) {
    // エントリの削除
  }

  const columns = [
    { field: 'memKey', headerName: 'キー', width: 150, editable: true },
    { field: 'memValues', headerName: '値', width: 300, editable: true },
    {
      fiels: 'operation', headerName: '操作', width: 60,
      disableClickEventBubbling: true,
      renderCell: (params) =>
        <IconButton
          onClick={e => handleClickDelete(params.id)}
        >
          <DeleteIcon />
        </IconButton>
    }
  ];

  let rows = Object.keys(memory).map((key, index) => ({
    id: index,
    memKey: key,
    memValues: memory[key].join(',')
  }));

  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      // keyが変更された場合：unique制約
      if (newRow.memKey !== oldRow.memKey) {
        if (newRow.memKey in memory) {
          setOpenRejectedDialog(true);
          reject(oldRow);
          return;
        }
      }
      // keyまたはvalueが書き換えられた
      handleChangeMemoryItem(oldRow.memKey, newRow.memKey, newRow.memValues);
      resolve(newRow);
    })
    , [handleChangeMemoryItem, memory]);

  function handleCloseRejectedDialog() {
    setOpenRejectedDialog(false);
  }
  
  return (
    <>
      <DataGrid
        columns={columns}
        rows={rows}
        apiRef={apiRef}
        isCellEditable={isCellEditable}
        processRowUpdate={processRowUpdate}
      />
      <RejectedDialog
        open={openRejectedDialog}
        message="キーが重複しています。違う名前にしてください。"
        handleClose={handleCloseRejectedDialog}
      />
    </>

  )
}