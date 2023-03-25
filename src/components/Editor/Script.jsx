import React, { useContext, useReducer } from 'react';
import Grid from '@mui/material/Grid';

export default function Script({state}){
  return (
    <Grid container>
      <Grid item xs={12}>
        スクリプト編集
      </Grid>
    </Grid>
  )
}