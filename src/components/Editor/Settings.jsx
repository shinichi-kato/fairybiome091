import React, { useContext, useReducer } from 'react';
import Grid from '@mui/material/Grid';

export default function Settings({state}){
  return (
    <Grid container>
      <Grid item xs={12}>
        チャットボット選択
      </Grid>
    </Grid>
  )
}