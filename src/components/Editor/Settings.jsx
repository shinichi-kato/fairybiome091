import React, { useReducer, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FairyPanel from '../Panel/FairyPanel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';


import {modules} from '../Biomebot-0.10/useCells';

const BOT_MODULES = modules.keys();
const ENCODERS = BOT_MODULES.filter(m=>m.endsWith('Encoder'));
const STATE_MACHINES = BOT_MODULES.filter(m=>m.endsWith('StateMachine'));
const DECODERS = BOT_MODULES.filter(m=>m.endsWith('Decoder'))

 
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
    console.log(settings)
    if(settings.currentCell !== null){
      dispatch({type:'load',cell:settings.cells[settings.currentCell]})
    }
  },[settings.botId,settings.currentCell,settings.cells]);

  function handleChangeDescription(event){
    dispatch({type:'changeDesc', description:event.target.value});
  }

  return (
    <Grid container
      spacing={2}
      padding={1}
    >
      <Grid item xs={12}>
        <FairyPanel bot={{
          isReady: true,
          avatarURL: `${state.avatarDir}peace.svg`,
          backgroundColor: state.backgroundColor,
        }} />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h5">
        {state.botDisplayName}
        </Typography>
      </Grid>
            <Grid item xs={12}>
        <Input
          placeholder="チャットボットの説明"
          value={state.description}
          onChange={handleChangeDescription}
          maxRows={3}
          multiline
          fullWidth
          sx={{
            backgroundColor: "#ffffff",
            p: 1
          }}
        />

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
      <Grid item xs={7}>
        <Typography>
          Encoder
        </Typography>
        <Typography variant="caption">
          チャットボットへの入力を内部コードに変換する方法を指定します
        </Typography>
      </Grid>
      <Grid item xs={5}>
          <Select>
            {ENCODERS.map(m=>
              <MenuItem value={m}>{m}</MenuItem>
            )}
          </Select>
      </Grid>
      <Grid item xs={7}>
        <Typography>
          State Machine
        </Typography>
        <Typography variant="caption">
          内部コードを用いて次の状態と出力を決める方法を指定します
        </Typography>
      </Grid>
      <Grid item xs={5}>
          <Select>
            {STATE_MACHINES.map(m=>
              <MenuItem value={m}>{m}</MenuItem>
            )}
          </Select>
      </Grid>
      <Grid item xs={7}>
        <Typography>
          Decoder
        </Typography>
        <Typography variant="caption">
        内部コードで表された出力をテキストに変換する方法を指定します
        </Typography>
      </Grid>
      <Grid item xs={5}>
          <Select>
            {DECODERS.map(m=>
              <MenuItem value={m}>{m}</MenuItem>
            )}
          </Select>
      </Grid>
      
    </Grid>
  )
}