import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ProTip from '../components/ProTip';
import Link from '../components/Link';
import Copyright from '../components/Copyright';
import { initializeFirebaseApp, firebaseApp } from "../firebase";

initializeFirebaseApp();

export default function Index() {


  return (

    <AuthProvider>

    </AuthProvider>

  );
}
