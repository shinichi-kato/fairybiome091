import React, { useContext, useRef, useEffect, useState, useCallback } from 'react';
import {
  doc, query, orderBy, limit, onSnapshot,
  setDoc, serverTimestamp
} from 'firebase/firestore'
import Box from '@mui/material/Box';

import Studio from './Studio';
import { BiomebotContext } from '../Biomebot-0.10/BiomebotProvider';
import { EcosystemContext } from '../Ecosystem/EcosystemProvider';
import { UserContext } from '../User/UserProvider';
import { Message } from '../message'

import LogViewer from './LogViewer';

const panelWidth = 180; // 120,160,192

export default function ChatRoom({ firestore, handleToMainPage }) {
  const user = useContext(UserContext);
  const ecosystem = useContext(EcosystemContext);
  const ecosystemRef = useRef(ecosystem);
  const bot = useContext(BiomebotContext);
  const botRef = useRef(bot);
  const change = ecosystemRef.current.change;
  const [log, setLog] = useState([]);

  const writeLog = useCallback(message => {
    /*ログの書き込み */
    (async () => {
      const logRef = doc(firestore, "users", user.uid, "log");
      setDoc(logRef, {
        text: message.text,
        name: message.name,
        timestamp: serverTimestamp(),
        avatarURL: message.avatarURL,
        backgroundColor: message.backgroundColor,
        person: message.person,
        mood: message.mood
      })
    })()
  }, [firestore, user.uid]);

  useEffect(() => {
    let unsubscribe = null;

    if (user.uid) {
      const logRef = doc(firestore, "users", user.uid, "log");
      const q = query(
        logRef,
        orderBy("timestame", "desc"),
        limit(20));

      unsubscribe = onSnapshot(q, snap => {
        let l = [];
        snap.forEach(doc => {
          const d = doc.data();
          l.push({
            ...d,
            timestamp: d.timestamp.toDate()
          });
        });
        setLog(l);

      });
    }

    return () => {
      if (unsubscribe) {
        console.log("unsubscribed");
        unsubscribe();
      }
    }
  }, [user.uid, firestore,]);

  useEffect(() => {
    if (bot.isReady) {
      let code = {
        intent: 'enter',
        text: '',
        owner: 'system'
      };
      botRef.current.execute(code, writeLog)
    }
  }, [bot.isReady, writeLog]);

  useEffect(() => {
    if (change !== null) {
      botRef.current.execute(
        new Message('trigger', {
          name: null,
          text: `{enter_${change}}`
        }),
        writeLog
      );
      ecosystem.dispatch({ type: 'dispatched' });
    }
  }, [change, ecosystem, ecosystem.dispatch, writeLog]);



  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        position: 'relative',
        width: "100%",
        height: "100vh", // 子がflexGrowを使うコンポーネントは高さを指定
        padding: "0px",
      }}
    >
      <Studio
        sx={{
          height: "448px"
        }}
        closeness={bot.closeness}
        log={log}
        writeLog={writeLog} />
      <Box
        sx={{
          height: "calc (100vh - 448px)",
          overflowY: "scroll",
        }}
        flexGrow={1}
      >
        <LogViewer log={log} />
      </Box>
    </Box>
  )
}