/*
FairyBiomeチャット画面

  ユーザがアプリを起動したとき、ブラウザにチャットボットのデータがなければ
  /static/chatbot/Biomebot/に格納されているチャットボットの中からランダムに
  選んだ一つがブラウザにダウンロードされ、firestore上にアップロードされる。
  以降firestore上にアップロードされたチャットボットのデータはサブスクライブ
  する。

  firestoreは内部的にローカルキャッシュをもち、データが変更された場合は
  変更点だけがロードされ、ローカルキャッシュと組み合わされてアプリ側には
  常に完全な辞書の内容が渡される。。
  
  これによりfirestore上とローカルのデータが同じになるようにする。

  ユーザは同時に最大１体のチャットボットを所有できる。
  
*/

import React from 'react';
import AuthProvider from '../components/Auth/AuthProvider';
import UserProvider from '../components/User/UserProvider';
import Main from '../components/Main/Main';
import useFirebase from "../useFirebase";




export default function Index() {
  const [firebase, firestore] = useFirebase();

  return (
    <AuthProvider firebase={firebase}>
      <UserProvider firestore={firestore}>
        <Main
          firestore={firestore}
        />
      </UserProvider>
    </AuthProvider>

  );
}
