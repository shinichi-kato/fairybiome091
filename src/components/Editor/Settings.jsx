import React, { useReducer, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FairyPanel from '../Panel/FairyPanel';

const initialState={
  description: "",
  updatedAt: null,
  userDisplayName: "",
  botDisplayName: "",
  avatarDir: "",
  backgroundColor: "",
  npc: false,
  encoder: "",
  stateMachine: "",
  decoder: "",
  precision: 0.5,
  retention: 0.8,
  refractory: 4,
  biome: [],
  memory: {},
  script: [],
};

function getBotName(cell){
  console.log(cell)
  let botName="";
  if('{BOT_NAME}' in cell.memory){
    botName=cell.memory['{BOT_NAME}'][0];
    if(cell.userDisplayName && cell.userDiplayName !== ""){
      botName+=`@${cell.userDisplayName}`
    }
  }
  return botName;
}

function reducer(state,action){
  switch(action.type){
    case 'load': {
      const cell = action.cell;
      return {
        ...action.cell,
        botDisplayName: getBotName(cell),
        script: []
      }
    }

    case 'changeDesc' :{
      return {
        ...state,
        description:action.description
      }
    }

    default: 
      throw new Error(`invalid action ${action.type}`)
  }
}

export default function Settings({settings}){
  /*
    state.currentCellが編集しているセル、
    state.cellsは辞書になっており、state.cells[cellName]でスクリプトを参照できる。
    Settingに入った時点でstate.cellsからコピーを行う。

    以下の変数は変更できない
    state.cells[cellName]の
      userDisplayName, updatedAt
    state.collection,
    state.botId

  */
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(()=>{
    if(settings.currentCell !== null){
      console.log(settings)
      dispatch({type:'load',cell:settings.cells[settings.currentCell]})
    }
  },[settings.botId,settings.currentCell,settings.cells]);

  function handleChangeDescription(event){
    dispatch({type:'changeDesc', description:event.target.value});
  }

  return (
    <Grid container>
      <Grid item xs={12}>
        <FairyPanel bot={{
          isReady: true,
          avatarURL: `${state.avatarDir}peace.svg`,
          backgroundColor: state.backgroundColor,
        }} />
      </Grid>
      <Grid item xs={12}>
        <Input
          placeholder="チャットボットの説明"
          value={state.description}
          onChange={handleChangeDescription}
          minRows={3}
          multiline
        />

      </Grid>
      <Grid item xs={12}>
        {state.botDisplayName}
      </Grid>
      <Grid item xs={7}>
        更新日
      </Grid>
      <Grid item xs={5}>
        <Typography align="right">{state.updatedAt}</Typography>
      </Grid>
      <Grid item xs={7}>
        <Typography variant="body2">ユーザはこのチャットボットを所有できない</Typography>
      </Grid>
      <Grid item xs={5}>
        <Switch
        />
      </Grid>
    </Grid>
  )
}