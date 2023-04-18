/*
    BiomeLister
    既存のbiome cellの順番を管理する。
    新規にcellを追加する

*/

import React, { useCallback, useState } from 'react';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import UpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditIcon from '@mui/icons-material/Edit';

import RejectedDialog from './RejectedDialog';

function ButtonGroupIconButton(props) {
  // intercept props only implemented by `Button`
  const { disableElevation, fullWidth, variant, ...iconButtonProps } = props;
  return <IconButton {...iconButtonProps} />;
}


export default function BiomeLister({
  cells,
  handleChangeCellOrder,
  handleChangeCellName,
  handleChangeCurrentCell
}) {
  const apiRef = useGridApiRef();
  const [openRejectedDialog, setOpenRejectedDialog] = useState(false);

  const rows = cells.map((cell, index) => ({
    id: index,
    cellName: cell

  }));

  function handleClickUp(id) {
    /*
      idで示されたcellを上の一つと入れ替える
    */
    if (id !== 0) {
      const upperCell = apiRef.current.getRow(id - 1).cellName;
      const lowerCell = apiRef.current.getRow(id).cellName;

      apiRef.current.updateRows([{ id: id - 1, cellName: lowerCell }]);
      apiRef.current.updateRows([{ id: id, cellName: upperCell }]);
      let newCells = [];
      apiRef.current.getRowModels().forEach(c => newCells.push(c.cellName));
      handleChangeCellOrder(newCells)
    }
  }

  function handleClickDown(id) {
    /* 
      idで示されたcellを下の一つと入れ替える
    */
    if (id < apiRef.current.getRowsCount() - 1) {
      const upperCell = apiRef.current.getRow(id).cellName;
      const lowerCell = apiRef.current.getRow(id + 1).cellName;

      apiRef.current.updateRows([{ id: id, cellName: lowerCell }]);
      apiRef.current.updateRows([{ id: id + 1, cellName: upperCell }]);

      let newCells = [];
      apiRef.current.getRowModels().forEach(c => newCells.push(c.cellName));
      handleChangeCellOrder(newCells)
    }

  }

  function handleClickEdit(id) {
    // currentCellを切り替える
    const cell = apiRef.current.getRow(id);
    handleChangeCurrentCell(cell.cellName);
  }

  function handleCloseRejectedDialog() {
    setOpenRejectedDialog(false);
  }

  const columns = [
    { field: 'cellName', headerName: 'セル名', width: 150, editable: true },
    {
      field: 'operation', headerName: '操作', width: 150,
      disableClickEventBubbling: true,
      renderCell: (params) =>
        <ButtonGroup variant="text" aria-label="outlined primary button group">
          <ButtonGroupIconButton
            onClick={e => handleClickUp(params.id)}
          >
            <UpIcon />
          </ButtonGroupIconButton>
          <ButtonGroupIconButton
            onClick={e => handleClickDown(params.id)}
          >
            <DownIcon />
          </ButtonGroupIconButton>
          <ButtonGroupIconButton
            onClick={e => handleClickEdit(params.id)}
          >
            <EditIcon />
          </ButtonGroupIconButton>
        </ButtonGroup>
    },
  ];


  const processRowUpdate = useCallback((newRow, oldRow) =>
    new Promise((resolve, reject) => {
      // unique制約
      if (newRow.cellName !== oldRow.cellName) {
        if (newRow.cellName === 'main.json' ||
          cells.indexOf(newRow.cellName) !== -1) {
            // ↑cellsから情報を取っているが、api経由にすること
          setOpenRejectedDialog(true);
          reject(oldRow);
          return;
        }
      }
      handleChangeCellName(oldRow.cellName, newRow.cellName);
      resolve(newRow);
    })
    , [handleChangeCellName, cells]);

  return (
    <>
      <DataGrid
        sx={{ height: "400px" }}
        rows={rows}
        columns={columns}
        apiRef={apiRef}
        processRowUpdate={processRowUpdate}
      />
      <RejectedDialog
        open={openRejectedDialog}
        message="セルの名前が重複しています。違う名前にしてください。"
        handleClose={handleCloseRejectedDialog}
      />
    </>

  )


}