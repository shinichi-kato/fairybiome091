/*
UserProvider
=========================

firestoreに格納されたユーザ情報のCRUDインタフェース
firestoreには以下のユーザ情報を格納する。

usersコレクション
  displayName
  avatarDir,
  backgroundColorIndex,
  logコレクション
    
*/
import React, { useReducer, createContext, useEffect, useState, useContext } from 'react';
import { useStaticQuery, graphql } from "gatsby"
import { doc, setDoc, getDoc } from "firebase/firestore";
import UserSettingsDialog from './UserSettingsDialog';
import { AuthContext } from '../Auth/AuthProvider';
export const UserContext = createContext();


function initialStateFactory(palette) {
  return {
    displayName: "",
    avatarDir: "",
    backgroundColorIndex: 0,
    backgroundColorPalette: [...palette],
    userState: "init"
  }
};

function reducer(state, action) {
  console.log(`user - ${action.type}`);
  switch (action.type) {
    case 'setUser': {
      return {
        ...state,
        diplayName: action.displayName,
        avatarDir: action.avatarDir,
        backgroundColorIndex: action.backgroundColorIndex,
        userState: "ok"
      }
    }

    case 'openDialog': {
      return {
        ...state,
        userState: "openDialog"
      }
    }

    case 'closeDialog': {
      return {
        ...state,
        userState: "ok"
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`);
  }
}

export default function UserProvider({ firestore, children }) {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          backgroundColorPalette
        }
      }
    }
  `);

  const [state, dispatch] = useReducer(
    reducer,
    initialStateFactory(data.site.siteMetadata.backgroundColorPalette)
  );

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
              backgroundColorIndex: u.backgroundColorIndex,
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

  function handleCloseUserSettings(){
    dispatch({type: 'closeDialog'})
  }

  function changeUserSettings(data) {
    dispatch({
      type: 'setUser',
      diplayName: data.displayName,
      avatarDir: data.avatarDir,
      backgroundColorIndex: data.backgroundColorIndex,
    });
    setDoc(doc(firestore, "users", auth.uid), {
      displayName: data.displayName,
      avatarDir: data.avatarDir,
      backgroundColorIndex: data.backgroundColorIndex
    }).then(() => {

    })
  }

  return (
    <UserContext.Provider
      value={{
        displayName: state.displayName,
        avatarDir: state.avatarDir,
        backgroundColor: state.backgroundColorPalette[state.backgroundColorIndex],
        log: state.log,
        openUserSetting: openUserSettings
      }}
    >
      {state.userState === 'openDialog'
        ?
        <UserSettingsDialog
          user={state}
          handleChangeUserSettings={changeUserSettings}
          handleCancel={handleCloseUserSettings}
        />
        :
        children
      }
    </UserContext.Provider>
  )
}