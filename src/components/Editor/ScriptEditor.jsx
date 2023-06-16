/*
  ScriptEditor

  このコンポーネントが扱うScriptは
  [
    {in: [str,...]}
  ]

  */
import React, { useContext, useReducer } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { GridEditInputCell } from '@mui/x-data-grid';
import ScriptDataGrid from './ScriptDataGrid';
import globalChance from 'chance';
const chanceId = globalChance();
const randomId = () => chanceId.guid();


const rowModel={
  intent: "",
  in: "",
  out: ""
};


export default function Script({ state }) {

  const columns = [
    {
      field: "intent",
      headerName: ""
    }
  ]
  return (
    <ScriptDataGrid
      sx={{height: 'calc ( 100vw - 36px );'}}
      rowMode={rowModel}
    />
    )
}