/*
  MemoryEditor
  DataTableを使ったMemoryEditor
*/

import React, { useContext, useRef } from 'react';
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
  const keyMapRef = useRef(new Map());

  // ----------------------------------------------------------------
  // addRowでの行追加が反映されたら編集モードへ
  // keyMapの取得と更新

  function handleRowEditStop(params) {

    // 追加は対応するが削除は未対応
    const memKey = params.row.memKey;
    keyMapRef.current.set(memKey, true);

    // editモードからの抜けかたでappendModeを調整
    // params.row.memKeyの内容は変更前。新規作成した行でEnter終わりの場合
    // 次の行を作る
    let action="";
    if(params.reason === 'enterKeyDown' && params.row.memKey===""){
      action="append"
    }
    return action;
  }

  //-----------------------------------------------------------------
  // memKey入力 
  // memKeyは空文字ではならず、{not_capital_string}のような形式であり
  // 重複は禁止

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
        <span><GridEditInputCell {...props} /></span>
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
    // updateとフレッシュなsaveの区別をどうするか
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