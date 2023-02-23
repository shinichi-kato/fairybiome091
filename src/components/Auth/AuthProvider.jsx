/*
AuthProvider
すべてのユーザについて認証を行う。
認証にはfirebaseSDKを利用する。


*/

import React, { useReducer, createContext, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth, signOut
} from 'firebase/auth';

import AuthDialog from './AuthDialog';
import Landing from '../Landing/Landing';

export const AuthContext = createContext();

const MESSAGE_MAP = {
  "auth/user-not-found": "ユーザが登録されていません",
  "auth/wrong-password": "パスワードが違います",
  "auth/invalid-email": "無効なemailアドレスです",
  "auth/invalid-password": "パスワードは6文字以上必要です",
  "auth/email-already-exists": "このemailは登録済みです",
  "_same_password_required_": "パスワードが一致していません",
};

const initialState = {
  auth: null,
  firebase: null,
  uid: null,
  authState: "notYet",
  message: null,
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
 console.log(`auth - ${action.type}`)
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
        uid:null,
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
        authState: 'logoff',
        message: 'firebaseに接続できません'
      }
    }

    case 'error': {
      let message;
      if(action.errorCode in MESSAGE_MAP){
        message = MESSAGE_MAP[action.errorCode]
      }else{
        message = action.errorCode
      }
      return {
        ...state,
        uid: null,
        message: message
      }
    }
    case 'authOk': {
      return {
        ...state,
        uid: action.uid,
        authState: "authOk",
        message: null,
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function AuthProvider({ firebase, children }) {
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

      unsubscribeRef.current = onAuthStateChanged(auth, user => {
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

      // let id = setTimeout(() => {
      //   dispatch({ type: 'timeout' });
      //   clearTimeout(id);
      // }, 1000);
    }

    return () => {
      if (unsubscribeRef.current) { unsubscribeRef.current(); }
    }

  }, [firebase]);

  // -----------------------------------------------------------
  //
  // ユーザ新規作成
  // emailとpasswordを用い、作成が失敗した(emailが登録済み、
  // パスワードが短すぎる等)の場合入力し直しを促す
  //

  function handleCreateUser(email, password1, password2) {
    if (password1 === password2) {
      createUserWithEmailAndPassword(state.auth, email, password1)
        // .then(
        //   userCredential => {
        //     dispatch({
        //       type: 'ok',
        //       uid: userCredential.uid
        //     })
        //   }
        // )
        .catch((error) => {
          dispatch({
            type: 'error',
            errorCode: error.code
          })
        });
    } else {
      dispatch({
        type: 'error',
        errorCode: '_same_password_required_'
      })
    }
  }

  // -----------------------------------------------------------
  //
  // ログイン
  // emailとpasswordを用いてログインを試みる
  //

  function handleSignIn(email, password) {
    signInWithEmailAndPassword(state.auth, email, password)
      // .then(
      //   userCredential => {
      //     dispatch({
      //       type: 'ok',
      //       uid: userCredential.uid
      //     })
      //   }
      // )
      .catch((error) => {
        dispatch({
          type: 'error',
          errorCode: error.code
        })
      });
  }

  // -----------------------------------------------------------
  //
  // サインアウト
  //

  function handleSignOut(){
    signOut(state.auth);
  }

  return (
    <AuthContext.Provider
      value={{
        uid:state.uid,
        handleSignOut: handleSignOut
      }}
    >
      {state.authState === 'notYet'
        ?
        <Landing />
        :
        state.authState === 'authOk'
          ?
          children
          :
          <AuthDialog
            createUser={handleCreateUser}
            signIn={handleSignIn}
            message={state.message}
          />
      }
    </AuthContext.Provider>
  )
}