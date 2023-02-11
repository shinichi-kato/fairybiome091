/*
  emailとpasswordによるfirebase認証
  新規ユーザ登録またはサインイン。
  
*/

import React, { useReducer } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { StyledInput } from './StyledInput';
import Button from '@mui/material/Button';



export default function AuthDialog({ auth, createUser ,message}) {

  function handleSubmit(event){
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createUser(
      data.get('email'),
      data.get('password')
    );
  }

  function handleForgotPassword(){
    sendPasswordReserEmail()
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
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <FormControl variant="standard">
            <InputLabel shrink htmlFor="email">
              E-mail
            </InputLabel>
            <StyledInput
              required
              placeholder="email@address.jp"
              id="email"
              name="email"
              autoComplete='email'
            />
          </FormControl>
          <FormControl variant="standard">
            <InputLabel shrink htmlFor="password-input">
              password
            </InputLabel>
            <StyledInput
              name="password"
              type="password"
              required
              id="password"
              autoComplete='password'
            />
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            サインイン
          </Button>
        </Box>
        <Box>
          {message}
        </Box>
        <Box>
          <Link href="#" variant="body2"
            component="button"
            onClick={handleForgotPassword}
          >
            パスワードを忘れましたか？
          </Link>
          <Link href="#" variant="body2"
            component="button"
            onClick={handleSignUp}
          >
            新規登録
          </Link>
        </Box>
      </Box>
    </Container>
  )
}