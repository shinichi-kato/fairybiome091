/*
  アプリケーションのメインロジック

  以下のメニューを表示する。
  * チャットルームに入る
  * チャットボットの新規作成
  * ユーザ設定
  * ログアウト
  
  ユーザのチャットボットがまだ作られていない場合は
  「チャットルームに入る」を表示しない。


*/

import React, { useReducer, useContext, useEffect } from 'react';

import EcosystemProvider from '../Ecosystem/EcosystemProvider';
import BiomebotProvider from '../Biomebot-0.10/BiomebotProvider';
import MainMenu from './MainMenu';
import ChatRoom from '../ChatRoom/ChatRoom';
import CreateBot from './CreateBot';
import { UserContext } from '../User/UserProvider';

const initialState = {
  botId: null,
  botReady: false,
  page: "mainMenu"
};

function reducer(state, action) {
  console.log(`Main - ${action.type}`)
  switch (action.type) {
    case 'setBotId': {
      return {
        ...state,
        botId: action.botId,
        botReady: false,
      }
    }
    case 'toCreateBot': {
      return {
        ...state,
        page: "CreateBot",
        botReady: false,
      }
    }
    case 'setPage': {
      return {
        ...state,
        botReady: false,
        page: action.page,
      }
    }

    case 'botReady': {
      return {
        ...state,
        botReady: true
      }
    }

    case 'botNotFound': {
      return {
        ...state,
        botReady: false,
        botId: false
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
  

}

export default function Main({ firestore }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const user = useContext(UserContext);

  useEffect(() => {
    if (user.uid && !state.botId) {
      dispatch({ type: 'setBotId', botId: user.uid })
    }
  }, [user.uid, state.botId]);

  const handleBotReady = () => { dispatch({ type: 'botReady' }) };
  const handleBotNotFound = () => { dispatch({ type: 'botNotFound' }) };
  const handleToCreateBot = () => { dispatch({ type: 'setPage', page: 'createBot' }) };
  const handleToChatRoom = () => { dispatch({ type: 'setPage', page: 'chatRoom' }) };
  const handleToMainMenu = () => { dispatch({ type: 'setPage', page: 'mainMenu' }) };

  return (
    <EcosystemProvider>
      <BiomebotProvider
        firestore={firestore}
        botId={state.botId}
        handleBotReady={handleBotReady}
        handleBotNotFound={handleBotNotFound}
      >{
          state.page === 'mainMenu' &&
          <MainMenu
            state={state}
            handleToCreateBot={handleToCreateBot}
            handleToChatRoom={handleToChatRoom}
            handleToUserSettings={user.openUserSettings}
            administrator={user.administrator}
          />
        }
        {
          state.page === 'chatRoom' &&
          <ChatRoom
            firestore={firestore}
            handleToMainMenu={handleToMainMenu}
          />
        }
        {
          state.page === 'createBot' &&
          <CreateBot
            botId={user.uid}
            firestore={firestore}
            handleToMainMenu={handleToMainMenu}
          />
        }
      </BiomebotProvider>
    </EcosystemProvider>
  )
}