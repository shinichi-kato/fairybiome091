/*
  Biomebotエディタ
  
  ユーザはindexDB上に保存された自分が所有するチャットボットのデータを
  このエディタ画面で編集でき、firestore上に保存できる。管理者権限を
  持つユーザは他のユーザのチャットボットも閲覧・編集できる。
  編集した結果をfirestoreに保存すると、サブスクライブの機構によって
  即時他のアプリのチャットボットに反映される。

  state 遷移
  init
  ↓
  selectBot ユーザがadministratorの場合selectページに遷移してbotId取得。
          そうでなければbotIdはuserIdと同じにしてloadingへ
  ↓
  loading  ファイルを取得中          saving ファイル保存中
  ↓↑                               ↓↑  
  settings 初期はcellがmain.jsonで、cellを切り替えたらloadingへ
           保存したらsavingへ。admininstratorの場合戻るでopenへ           
  ↓↑
  script   スクリプト編集。
           将来的にログのスクリプト化も
  
  
*/

import React, { useContext, useReducer, useEffect } from 'react';
import Container from '@mui/material/Container';
import { UserContext } from '../User/UserProvider';
import { loadChatbot } from '../../useFirebase';
import Settings from './Settings';
import Script from './Script';
import BotSelector from './BotSelector';

const initialState = {
  botId: null,
  collection: null,
  page: 'settings',
  currentCell: '',
  main: {},
  cells: {},
}

function reducer(state, action) {
  console.log(`editor - ${action.type}`)
  switch (action.type) {
    case 'selectBot': {
      return {
        ...state,
        page: 'botSelector',
      }
    }
    case 'loading': {
      console.log(action.botId,action.collection)
      return {
        botId: action.botId,
        collection: action.collection,
        page: 'settings',
        currentCell: '',
        main: {},
        cells: {}
      }
    }
    case 'changeBotId': {
      return {
        botId: action.botId,
        collection: action.collection,
        page: 'settings',
        currentCell: '',
        main: {},
        cells: {}
      }
    }

    case 'loaded': {
      return {
        ...state,
        page: 'settings',
        currentCell: 'main.json',
        main: { ...action.main },
        cells: { ...action.cells }
      }
    }

    default:
      throw new Error(`invalid action ${action.type}`)
  }
}

export default function Editor({ firestore }) {
  const user = useContext(UserContext);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (firestore) {
      let botId, collection;

      if (!state.botId) {
        console.log(user.administrator)
        if (user.administrator) {
          botId = null;
          collection = null;
        } else {
          botId = user.uid;
          collection = 'chatbot_active';
        }
      } else {
        botId = state.botId;
        collection = state.collection;
      }

      if (botId) {
        (async ()=>{
          dispatch({ type: 'loading', botId: botId, collection: collection });
          const [main, cells] = await loadChatbot(firestore, botId,collection);
          dispatch({ type: 'loaded', main: main, cells: cells });
        })();
      } else {
        dispatch({ type: 'selectBot' });
      }
    }
  }, [firestore, state.botId, state.collection, user.administrator, user.uid]);

  function handleChangeBot(botId, collection) {
    dispatch({ type: 'changeBotId', botId: botId, collection: collection });
  }

  const page = state.page;
  return (
    <Container
      maxWidth="xs"
      disableGutters
      sx={{
        height: "100vh",
        backgroundColor: "#eeeeee",
      }}
    >
      {page === 'selectBot' &&
        <BotSelector
          firestore={firestore}
          state={state}
          handleChangeBot={handleChangeBot}
        />
      }
      {page === 'settings' &&
        <Settings
          state={state}
        />
      }
      {
        page === 'script' &&
        <Script
          state={state}
        />
      }

    </Container>
  )
}