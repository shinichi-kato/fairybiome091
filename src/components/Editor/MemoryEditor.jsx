/*
  MemoryEditor
  DataTableを使ったMemoryEditor
*/

import React, { useContext,useRef } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { GridEditInputCell } from '@mui/x-data-grid';
import ScriptDataGrid from './ScriptDataGrid';
import { ChatbotFileContext } from './ChatbotFileProvider';

const rowModel = {
  memKey: "",
  memValues: ""
};

function isRowEditable({ field, row }) {
  return field !== 'memKey' || !/\{[A-Z_]+\}/.test(row.memKey)
}


export default function MemoryEditor() {
  const chatbotFile = useContext(ChatbotFileContext);
  const memory = chatbotFile.memory;
  const keyMapRef=useRef(new Map());

  // ----------------------------------------------------------------
  // keyMapの取得と更新

  function handleRowEditStop(params) {
    // 追加は対応するが削除は未対応
    const memKey = params.row.memKey;
    keyMapRef.current.set(memKey,true);
  }

  //-----------------------------------------------------------------
  // memKey入力 

  const preProcessEditMemKey = (params) => {
    if (params.hasChanged) {
      const value = params.props.value;
      if (value === '') {
        return { ...params.props, error: "記入が必要です" }
      }
      if (value[0] !== '{') {
        return { ...params.props, error: "記入例：{not_capital_string}" }
      }
      const length = value.length;
      if (length > 3 && value[value.length - 1] === '}') {
        if (!/^{[a-zA-Z_]+}$/.test(value)) {
          return { ...params.props, error: "半角英字か_を{}で囲ったタグにして下さい" }
        }
        if (keyMapRef.current.has(value)) {
          return { ...params.props, error: "同じタグがすでに存在します" }
        }
      }
    }
    return { ...params.props }
  }

  function MemKeyEditInputCell(props) {
    const { error } = props;
    return (
      <Tooltip open={!!error} title={error} arrow>
        <GridEditInputCell {...props} />
      </Tooltip>
    )
  }

  function renderEditMemKey(params) {
    return <MemKeyEditInputCell {...params} />;
  }

  const columns = [
    {
      field: 'memKey',
      headerName: 'キー',
      width: 150,
      editable: true,
      preProcessEditCellProps: preProcessEditMemKey,
      renderEditCell: renderEditMemKey
    },
    { field: 'memValues', headerName: '値', width: 300, editable: true, flex: 1 },
  ];

  function handleSave(newRows, lastInsertRowId) {
    memory.update(newRows, lastInsertRowId);
  }

  return (
    <ScriptDataGrid
      sx={{
        height: 400,
      }}
      rowModel={rowModel}
      fieldToFocus="memKey"
      scriptRows={memory.rows}
      lastInsertRowId={memory.lastInsertRowId}
      scriptColumns={columns}
      scriptRowEditStop={handleRowEditStop}
      handleSave={handleSave}
      isRowEditable={isRowEditable}
    />
  )

}