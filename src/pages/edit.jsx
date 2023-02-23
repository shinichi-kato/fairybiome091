/*
  biomebotエディタ
  もとのデータは/static/chatbot/biomebotに格納されている。
  ユーザがアプリを起動したとき、ユーザ用のチャットボットがなければこの中から
  ランダムに選んだ一つがfirestoreにロードされ、ユーザ用のチャットボットになる。
  firestore上のチャットボットはこのエディタ画面から編集でき、firestoreに保存できる。
  firestore上のチャットボットはローカルファイルにダウンロードすることができ、
  
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