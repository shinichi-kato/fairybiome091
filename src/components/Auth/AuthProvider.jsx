/*
AuthProvider
すべてのユーザについて認証を行う。
認証にはfirebaseSDKを利用する。


*/

import React, { useReducer, createContext, useEffect } from 'react';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

import AuthDialog from './AuthDialog';
import Landing from './Landing';

export const AuthContext = createContext();

const MEASSAGE_MAP = {
  "auth/user-not-found": "ユーザが登録されていません",
  "auth/wrong-password": "パスワードが違います",
  "auth/invalid-email": "無効なemailアドレスです",
  "auth/invalid-password": "パスワードは6文字以上必要です",
  "auth/email-already-exists": "このemailは登録済みです",
};

const initialState = {
  app: {
    auth: null,
    firebase: null,
  },
  uid: null,
  authState: "notYet",
  message: "",
};

function reducer(state, action) {
  /* 
  authState   画面                      状態
  -----------------------------------------------------------
  notYet      ランディング              認証未確定
  logoff      登録/サインイン           ログオフ状態
  ok          透過                      ログオン状態
  timeout     　　　　　　　　　　　　　firebaseが応答しない
  ------------------------------------------------------------
  */
  switch (action.type) {
    case 'init': {
      return {
        ...initialState,
        auth: action.auth,
        authState: 'notYet'
      }
    }

    case 'logoff': {
      return {
        ...state,
        authState: 'logoff'
      }
    }

    case 'login': {
      return {
        ...state,
        uid: action.uid,
        authState: 'ok'
      }
    }

    case 'timeout': {
      return {
        ...state,
        authState: 'logoff'
      }
    }

    case 'error': {
      return {
        ...state,
        message: MEASSAGE_MAP[action.errorCode]
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function AuthProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubscribeRef = useRef();


  // -------------------------------------------------
  // 初期化
  //

  useEffect(() => {
    if (firebase) {
      const auth = getAuth(firebase);
      dispatch({
        type: "init",
        auth: auth
      });

      unsubscribeRef.current = onAuthStateChange(auth, user => {
        if (user) {
          dispatch({
            type: "authOk",
            uid: user.uid
          });
        } else {
          dispatch({
            type: "logoff"
          });
        }
      });

      let id = setTimeout(() => { initialAuthTimeout(id) }, 1000);
    }

    return () => {
      if (unsubscribeRef.current) { unsubscribeRef.current(); }
    }

  }, [firebase, firestore]);

  function initialAuthTimeout(id) {
    if (!state.auth.currentUser) {
      dispatch({ type: 'timeout' });

    }
    clearTimeout(id);
  }

  // -----------------------------------------------------------
  //
  // ユーザ新規作成
  // emailとpasswordを用い、作成が失敗した(emailが登録済み、
  // パスワードが短すぎる等)の場合入力し直しを促す
  //

  function createUser(email, password) {
    createUserWithEmailAndPassword(state.auth, email, password)
      .then(
        userCredential => {
          dispatch({
            type: 'ok',
            uid: userCredential.uid
          })
        }
      )
      .catch((error) => {
        dispatch({
          type: 'error',
          errorCode: error.code
        })
      });
  }

  return (
    <AuthContext.Provider
      value={{}}
    >
      {state.authState === 'notYet'
        ?
        <Landing />
        :
        state.authState === 'logoff'
          ?
          <AuthDialog
            createUser={createUser}
            message={state.message}
          />
          :
          props.children
      }
    </AuthContext.Provider>
  )
}