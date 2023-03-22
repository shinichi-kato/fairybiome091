
import React from 'react';
import AuthProvider from '../components/Auth/AuthProvider';
import UserProvider from '../components/User/UserProvider';
import useFirebase from "../useFirebase";
import Editor from '../components/Editor/Editor';


export default function EditPage() {
  const [firebase, firestore] = useFirebase();

  return (
    <AuthProvider firebase={firebase}>
      <UserProvider firestore={firestore}>
        <Editor firestor={firestore} />
      </UserProvider>
    </AuthProvider>

  );
}