import React, { useReducer, useContext } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';

export default function MainMenu({ state, 
  handleToCreateBot, 
  handleToChatRoom,
  handleToUserSettings }) {



  return (
    <Container
      maxWidth="xs"
      disableGutters
      sx={{
        height: "100vh"
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box>
          <Button
            variant="contained"
            disabled={!state.botReady}
            onClick={handleToChatRoom}
          >
            チャットルームに入る
          </Button>
        </Box>
        <Box>
        <Button
          onClick={handleToCreateBot}
        >
          新しく始める
        </Button>
        </Box>
        <Box>
          <Button
            onClick={handleToUserSettings}
          >
            ユーザ情報の設定
          </Button>
        </Box>
      </Box>
    </Container>
  )
}