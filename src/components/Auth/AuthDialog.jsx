/*
  emailとpasswordによるfirebase認証
  サインイン画面と新規登録画面を遷移する。
  サインイン画面：
  ・email,password
  ・サインインボタン
  ・新規登録画面へ

  新規登録画面：
  ・email,password, password(確認)
  ・新規登録ボタン
  ・サインインへ

    react-hook-formで書き換えること
    https://zenn.dev/longbridge/articles/648d6b6c499eef
*/

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';

import { StyledInput } from '../StyledInput';


function TabPanel({ value, index, children, other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

export default function AuthDialog({ createUser,signIn,message }) {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  function handleToSignUp() {
    setValue(1);
  }

  function handleToSignIn() {
    setValue(0);
  }

  function handleSignUp(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createUser(
      data.get('email1'),
      data.get('password1'),
      data.get('password2')
    );
  }

  function handleSignIn(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    signIn(
      data.get('email0'),
      data.get('password0')
    );
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="サインイン" {...a11yProps(0)} />
            <Tab label="新規登録" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Box>
              <Typography variant="h3">サインイン</Typography>
            </Box>
            <Box component="form" onSubmit={handleSignIn} noValidate sx={{ mt: 1 }}>
              <FormControl variant="standard">
                <InputLabel shrink htmlFor="email">
                  E-mail
                </InputLabel>
                <StyledInput
                  required
                  placeholder="email@address.jp"
                  id="email0"
                  name="email0"
                  autoComplete='email'
                />
              </FormControl>
              <FormControl variant="standard">
                <InputLabel shrink htmlFor="password-input">
                  password
                </InputLabel>
                <StyledInput
                  name="password1"
                  type="password"
                  required
                  id="password1"
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
              <Link href="#" variant="body2"
                component="button"
                onClick={handleToSignUp}
              >
                新規登録
              </Link>
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Box>
              <Typography variant="h3">新規登録</Typography>
            </Box>
            <Box component="form" onSubmit={handleSignUp} noValidate sx={{ mt: 1 }}>
              <StyledInput
                required
                placeholder="email@address.jp"
                id="email1"
                name="email1"
                autoComplete='email'
              />
              <StyledInput
                name="password1"
                type="password"
                placeholder="パスワード"
                required
                id="password1"
                autoComplete='password'
              />
              <StyledInput
                name="password2"
                type="password"
                placeholder="パスワード再入力"
                required
                id="password2"
                autoComplete='password'
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                ユーザ登録
              </Button>

            </Box>
            <Box>
              {message}
            </Box>
            <Box>
              <Link href="#" variant="body2"
                component="button"
                onClick={handleToSignIn}
              >
                サインイン
              </Link>
            </Box>
          </Box>
        </TabPanel>
      </Box>
    </Container>

  );
}
