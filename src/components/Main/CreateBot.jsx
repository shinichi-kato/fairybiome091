/*
  チャットボットの新規作成
  ユーザが利用できるチャットボットの中から一つを選ぶ。
  以前のユーザ用チャットボットのデータは上書きされる。

  
*/

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Box from '@mui/material/Box';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';

export default function CreateBot({ firestore, botId, handleToMainMenu }) {
  const [chatbots, setChatbots] = useState([]);

  useEffect(() => {
    /*
      チャットボットのデータをfirestoreのchatbot_activeから読み込む。
      chatbotsには以下のデータを抽出して格納する。
      {
        'docName': string,
        'displayName': string,
        'description': string,
        'avatarDir': string
      }
    */
    (async () => {
      if (botId) {
        const botsRef = collection(firestore, "chatbot_active");
        const q = query(botsRef, where('npc', '==', false));
        const snap = await getDocs(q);
        let data = [];
        snap.forEach(doc => {
          let d = doc.data();
          data.push({
            'docName': d.id,
            'displayName': d.memory["{BOT_NAME}"][0],
            'description': d.description,
            'avatarDir': d.avatarDir,
          })
        });
        setChatbots(data);

      }

    })();

  }, [botId, setChatbots, firestore]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',

      }}
    >
      <Box>
        チャットボットの新規作成
      </Box>
      <Box>
        <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
          {chatbots.map((chatbot) => (
            <ImageListItem key={chatbot.docName}>
              <img
                src={`${chatbot.avatarPath}/peace.svg`}
                alt={chatbot.displayName}
              />
              <ImageListItemBar
                title={chatbot.displayName}
                subtitle={chatbot.description}
              />
            </ImageListItem>
          ))}
        </ImageList>

      </Box>
    </Box>
  )
}