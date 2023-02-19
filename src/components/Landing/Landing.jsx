import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function Landing() {
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
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <Box>
          FairyBiome
        </Box>
      </Box>
    </Container>
  )
}