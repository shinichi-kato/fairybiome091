/*
Inputで数値入力を受付け、値が0<x<1に入るようにvalidateする。
初期値props.valueがinvalidである場合、0と解釈する。
ユーザ入力を受け付けた結果、値がvalidである限り

props.value
props.handleChangeValue
 
*/

import React, { useReducer } from 'react';
import { styled } from '@mui/system';
import TextField from '@mui/material/TextField';

const RE_FLOAT = /^ *[+-]?([0-9]*[.])?[0-9]+?$/;

// function zen2han(str) {
//   return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
//       return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
//   });
// }

const CoeffInput = styled(TextField)({
  color: 'darkslategray',
  backgroundColor: '#ffffff',
  padding: 2,
  borderRadius: 4,
});

const initialState={
  error: false,
  helperText: null
}

function reducer(state, action) {
  switch (action.type) {
    case 'NaNError':{
      return {
        error: true,
        helperText: "数値にしてください"
      }
    }
    case 'RangeError': {
      return {
        error: true,
        helperText: "0より大きく1.0未満にしてください"
      };
    }
    case 'changeValue': {
      return {
        error: false,
        helperText: null
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function CoefficientInput(props) {

  const [state, dispatch] = useReducer(reducer, initialState);

  function handleChange(event) {
    
    props.handleChangeValue(event.target.value);
    const v = parseFloat(event.target.value);
    if (Number.isNaN(v) || !RE_FLOAT.test(event.target.value)) {
      dispatch({
        type:'NaNError',
        value: event.target.value,
      });
    } else  if (v <= 0 || 1.0 <= v) {
      dispatch({
        type:'RangeError',
        value: event.target.value,
      });
    } else {
      dispatch({
        type: 'changeValue',
        value: event.target.value
      });

    }
  }


  return (
    <CoeffInput
      value={props.value}
      onChange={handleChange}
      error={state.error}
      helperText={state.helperText}
    />

  )
}