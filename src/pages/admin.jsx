/*
  Administratorモード
  
  この画面は管理者権限のあるユーザのみ使用でき、以下の操作ができる。

  ## チャットボットデータのインストール
  システムセットアップ時にはfirestore上にチャットボットのデータがなく、
  この画面上のコマンドによりstatic/chatbotからのコピーを行う。
  
  ## ログのダウンロード
  ユーザを選択してそのユーザの会話ログをダウンロードする

  ## チャットボットのダウンロード/アップロード
  firestore上のチャットボットデータを.json形式でダウンロードする。
  
*/

import React from 'react';
import AuthProvider from '../components/Auth/AuthProvider';
import UserProvider from '../components/User/UserProvider';
import useFirebase from "../useFirebase";
import Admin from '../components/Admin/Admin';


export default function Index() {
  const [firebase, firestore] = useFirebase();

  return (
    <AuthProvider firebase={firebase}>
      <UserProvider firestore={firestore}>
        <Admin firestore={firestore}/>
      </UserProvider>
    </AuthProvider>

  );
}