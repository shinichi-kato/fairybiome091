import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;

// https://www.ppgpaints.com/color/color-families/neutrals

export const colorPalette=[
  '#535353', // black
  '#c7b7a1', // neutral
  '#789bc5', // blue
  '#b0bf74', // green
  '#ddb763', // yellow
  '#d58b5f', // orange
  '#c4736e', // red
  '#9e88aa', // purple
];
