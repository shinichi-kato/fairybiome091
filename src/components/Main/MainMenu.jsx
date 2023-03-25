import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import { navigate } from "gatsby";

export default function MainMenu({ state,
  handleToCreateBot,
  handleToChatRoom,
  handleToUserSettings,
  administrator }) {

  function toAdminPage() {
    navigate('/admin/');
  }

  function toEditPage() {
    navigate('/edit/');
  }

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
        {
          (administrator || state.botReady) &&
          <Box>
            <Button
              onClick={toEditPage}
            >
              チャットボットの編集
            </Button>
          </Box>

        }
        {administrator &&
          <Box>
            <Button
              onClick={toAdminPage}
            >
              システム
            </Button>
          </Box>

        }
      </Box>
    </Container>
  )
}