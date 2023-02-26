import React, { useReducer, useContext } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import BackgroundColorPicker from './BackgroundColorPicker';
import AvatarSelector from './AvatarSelector';
import { StyledInput } from '../StyledInput';
import { AuthContext } from '../Auth/AuthProvider';

function isValid(state) {
  return (
    state.backgroundColorIndex < state.backgroundColorPalette.length &&
    state.avatarDir !== "" && typeof state.avatarDir === 'string' &&
    state.displayName !== "" && typeof state.displayName === 'string'
  );
}

function initialStateFactory(state) {
  return {
    backgroundColorIndex: state.backgroundColorIndex,
    backgroundColorPalette: state.backgroundColorPalette,
    avatarDir: state.avatarDir,
    displayName: state.displayName,
    isValid: isValid(state),
    startedValid: isValid(state),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'init': {
      return {
        ...state,
        displayName: "",
        backgroundColorIndex: 0,
        avatarDir: "",
        isValid: false
      };
    }

    case 'changeDisplayName': {
      const newState = {
        ...state,
        displayName: action.displayName
      };

      return {
        ...newState,
        isValid: isValid(newState)
      }
    }

    case 'changeAvatarDir': {
      const newState = {
        ...state,
        avatarDir: action.avatarDir
      }

      return {
        ...newState,
        isValid: isValid(newState)
      }
    };

    case 'changeBackgroundColorIndex': {
      const newState = {
        ...state,
        backgroundColorIndex: action.backgroundColorIndex
      };

      return {
        ...newState,
        isValid: isValid(newState)
      }
    };

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function UserDialog({ user, handleChangeUserSettings, handleCancel }) {
  const [state, dispatch] = useReducer(reducer, initialStateFactory(user));
  const auth = useContext(AuthContext);

  function handleChangeAvatarDir(d) {
    dispatch({
      type: 'changeAvatarDir',
      avatarDir: d
    })
  }

  function handleChangeDisplayName(e) {
    dispatch({
      type: 'changeDisplayName',
      displayName: e.target.value
    });
  }

  function handleChangeBackgroundColorIndex(i) {
    dispatch({
      type: 'changeBackgroundColorIndex',
      backgroundColorIndex: i
    })
  }

  function handleSubmit(e) {
    handleChangeUserSettings(state)
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
        <Box alignSelf="center">
          <Typography variant="h4">ユーザ設定</Typography>
        </Box>
        <Box>
          <AvatarSelector
            avatarDir={state.avatarDir}
            handleChangeAvatarDir={handleChangeAvatarDir}
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
            value={state.displayName}
            onChange={handleChangeDisplayName}
          />
        </Box>
        <Box>
          <Typography>背景色</Typography>
        </Box>
        <Box>
          <BackgroundColorPicker
            state={state}
            handleChangeIndex={handleChangeBackgroundColorIndex}
          />
        </Box>
        <Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!state.isValid}
            sx={{ mt: 3, mb: 2 }}
            onClick={handleSubmit}
          >
            OK
          </Button>
          <Button
            onClick={handleCancel}
            disabled={state.isValid || state.startedValid}
          >
            取り消し
          </Button>
          <Button
            onClick={auth.handleSignOut}
          >
            サインアウト
          </Button>
        </Box>
      </Box>
    </Container>
  )
}