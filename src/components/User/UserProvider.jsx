/*
UserProvider
=========================

firestoreに格納されたユーザ情報のCRUDインタフェース
firestoreには以下のユーザ情報を格納する。

usersコレクション
  displayName
  avatarDir,
  backgroundColor,
  logコレクション
    
*/
import React, { useReducer, createContext, useEffect, useState, useContext } from 'react';
import { doc, setDoc, getDoc } from "firebase/firestore";
import UserSettingsDialog from './UserSettingsDialog';
import { AuthContext } from '../Auth/AuthProvider';
export const UserContext = createContext();

const initialState = {
  displayName: "",
  avatarDir: "",
  backgroundColor: "",
  userState: "init"
};

function reducer(state, action) {
  console.log(`user - ${action.type}`);
  switch (action.type) {
    case 'setUser': {
      return {
        diplayName: action.displayName,
        avatarDir: action.avatarDir,
        backgroundColor: action.backgroundColor,
        userState: "ok"
      }
    }

    case 'empty': {
      return {
        ...initialState,
        userState: "openDialog"
      }
    }

    case 'openDialog': {
      return {
        ...state,
        userState: "openDialog"
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function UserProvider({ firestore, children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [log, setLog] = useState([]);

  const auth = useContext(AuthContext);

  useEffect(() => {
    if (firestore) {
      getDoc(doc(firestore, "users", auth.uid))
        .then(snap => {
          if (snap.exists()) {
            const u = snap.data();
            dispatch({
              type: 'setUser',
              displayName: u.displayName,
              avatarDir: u.avatarDir,
              backgroundColor: u.backgroundColor,
            })
          } else {
            dispatch({
              type: 'openDialog'
            })
          }
        });

      // logはここでサブスクリプションする
    }
  }, [firestore, auth.uid]);

  function openUserSettings() {
    dispatch({
      type: 'openDialog'
    });
  }

  function changeUserSettings(displayName, avatarDir, backgroundColor) {
    dispatch({
      type: 'setUser',
      diplayName: displayName,
      avatarDir: avatarDir,
      backgroundColor: backgroundColor,
    });
    setDoc(doc(firestore, "users", auth.uid), {
      displayName: displayName,
      avatarDir: avatarDir,
      backgroundColor: backgroundColor
    }).then(() => {

    })
  }

  return (
    <UserContext.Provider
      value={{
        displayName: state.displayName,
        avatarDir: state.avatarDir,
        backgroundColor: state.backgroundColor,
        log: state.log,
        openUserSetting: openUserSettings
      }}
    >
      {state.userState === 'openDialog'
        ?
        <UserSettingsDialog
          state={state}
          handleChangeUserSettings={changeUserSettings}
        />
        :
        children
      }
    </UserContext.Provider>
  )
}