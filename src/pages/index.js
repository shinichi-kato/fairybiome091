import React from 'react';
import AuthProvider from '../components/Auth/AuthProvider';
import UserProvider from '../components/User/UserProvider';
import EcosystemProvider from '../components/Ecosystem/EcosystemProvider';
import useFirebase from "../useFirebase";



export default function Index() {
  const [firebase, firestore] = useFirebase();

  return (
    <AuthProvider firebase={firebase}>
      <UserProvider firestore={firestore}>
        <EcosystemProvider>

          中身
        </EcosystemProvider>
      </UserProvider>
    </AuthProvider>

  );
}
