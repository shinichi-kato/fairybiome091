/*
 チャットボット選択
 administratorの場合のみ表示され、chatbot_activeや
 chatbot_originにある
 すべてのチャットボットから一つを選ぶ。
*/
import React, { useEffect, useReducer } from 'react';
import Grid from '@mui/material/Grid';

const initialState={
  bot_active: [],
  bot_origin: [],
  botId: null,
  collection: null,
};

function reducer(state, action){
  switch(action.type){
    case '':{

    }
    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export default function SelectBot({firestore, state}){
  const [state, dispatch] = useReducer(reducer,initialState);

  useEffect(async ()=>{
    if(firestore){
      
    }
  },[firestore]);
  
  return (
    <Grid container>
      <Grid item xs={12}>
        チャットボット選択
      </Grid>
    </Grid>
  )
}