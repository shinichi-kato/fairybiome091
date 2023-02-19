import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import BackgroundColorPicker from './BackgroundColorPicker';
import AvatarSelector from './AvatarSelector';
import { StyledInput } from '../StyledInput';

export default function UserDialog({ state, handleSetUser }) {
  const [bgIndex, setBgIndex] = useState(state.backgroundColor);
  const [displayName, setDisplayName] = useState(state.displayName);
  const [avatarDir, setAvatarDir] = useState(state.avatarDir);



  function handleSubmit(e){
    handleSetUser({
      displayName: displayName,
      backgroundColor: bgIndex,
      avatarDir: avatarDir
    })
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
          <AvatarSelector
            avatarDir={avatarDir}
            handleSetAvatarDir={setAvatarDir}
          />
        </Box>
        <Box>
          <Typography>表示名</Typography>
        </Box>
        <Box>
          <StyledInput
            required
            id="displayName"
            name="displayName"
            value={displayName}
            onChange={e=>setDisplayName(e.target.value)}
          />
        </Box>
        <Box>
          <Typography>背景色</Typography>
        </Box>
        <Box>
          <BackgroundColorPicker
            index={bgIndex}
            handleSetIndex={setBgIndex}
          />
        </Box>
        <Box>
        <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleSubmit}
              >
                OK
              </Button>
        </Box>
      </Box>
    </Container>
  )
}