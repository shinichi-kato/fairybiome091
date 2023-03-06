/*
  Biomebotエディタ
  
  ユーザはindexDB上に保存された自分が所有するチャットボットのデータを
  このエディタ画面で編集でき、firestore上に保存できる。管理者権限を
  持つユーザは他のユーザのチャットボットも閲覧・編集できる。
  編集した結果をfirestoreに保存すると、サブスクライブの機構によって
  即時他のアプリのチャットボットに反映される。
  
*/
import React from 'react';
import AuthProvider from '../components/Auth/AuthProvider';
import useFirebase from "../useFirebase";


export default function Index() {
  const [firebase, firestore] = useFirebase();

  return (
    <AuthProvider firebase={firebase}>

          中身
    </AuthProvider>

  );
}