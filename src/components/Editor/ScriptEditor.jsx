/*
  ScriptEditor
*/

import React, { useContext, useRef } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { GridEditInputCell } from '@mui/x-data-grid';
import ScriptDataGrid from './ScriptDataGrid';
import { ChatbotFileContext } from './ChatbotFileProvider';

const rowModel = {
  intent: "",
  in: "",
  out: ""
};

export default function ScriptEditor() {
  const chatbotFile = useContext(ChatbotFileContext);
  const script = chatbotFile.script;
  const intentMapRef = useRef(new Map());

  function isRowEditable({ field, row }) {
    return true
  }

  //-----------------------------------------------------------------
  // intent入力 
  // intentはなくてもよいが、空文字列でない場合は重複してはいけない

  const preProcessEditIntent = (params) => {
    if (params.hasChanged) {
      const value = params.props.value;
      if (intentMapRef.current.has(value)) {
        return { ...params.props, error: "同じタグがすでに存在します" }
      }
    }
    return { ...params.props }
  }

  function IntentEditInputCell(props) {
    const { error } = props;
    return (
      <Tooltip open={!!error} title={error} arrow>
       <span> <GridEditInputCell {...props} /></span>
      </Tooltip>
    )
  }

  function renderEditIntent(params) {
    return <IntentEditInputCell {...params} />;
  }

  function handleRowEditStop(params){
    // intentKeyの更新
  }

  const columns = [
    {
      field: 'intent',
      headerName: 'intent',
      width: 100,
      editable: true,
      preProcessEditCellProps: preProcessEditIntent,
      renderEditCell: renderEditIntent,
    },
    { field: 'in', headerName: 'in', flex: 1, editable: true},
    { field: 'out', headerName: 'out', flex: 1, editable: true}
  ]

  function handleSave(newRows, lastInsertRowId) {
    script.update(newRows, lastInsertRowId);
  }
  return (
    <ScriptDataGrid
      sx={{
        height: 800,
      }}
      rowModel={rowModel}
      fieldToFocus="in"
      scriptRows={script.rows}
      lastInsertRowId={script.lastInsertRowId}
      scriptColumns={columns}
      scriptRowEditStop={handleRowEditStop}
      handleSave={handleSave}
      isRowEditable={isRowEditable}
    />
  )


}  
