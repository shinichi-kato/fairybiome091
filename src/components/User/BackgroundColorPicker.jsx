import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';
import { colorPalette } from '../../theme';

const PaletteCell = styled(Box)(({ theme }) => ({
  borderRadius: 6,
  width: 32,
  height: 32,
  display: 'flex',
  justifyContent: 'center',
  margin: theme.spacing(1)
}));

export default function BackgroundColorPicker({ index, handleSetIndex }) {
  const cells = colorPalette.map((c, i) => (
    <PaletteCell
      key={i}
      sx={{ backgroundColor: c }}
      onClick={(e) => handleSetIndex(i)}
    >
      {index === i && <Box><CheckIcon sx={{ color: "#ffffff" }}/></Box>}
    </PaletteCell>
  ))

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',

      }}
    >
      {cells}
    </Box>
  )
}