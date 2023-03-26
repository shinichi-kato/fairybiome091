/*
 チャットボット選択
 administratorの場合のみ表示され、chatbot_activeや
 chatbot_originにある
 すべてのチャットボットから一つを選ぶ。
*/
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import Box from '@mui/material/Box';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';

async function getBotCollection(firestore, collName, bots) {

  const ref = collection(firestore, collName);
  const snap = await getDocs(ref);

  snap.forEach(doc => {
    const data = doc.data();
    bots.push({
      id: doc.id,
      collection: collName,
      avatarDir: data.avatarDir,
      backgroundColor: data.backgroundColor,
      name: data.memory['{BOT_NAME}'],
      description: data.description,
      userDisplayName: data.userDisplayName
    });
  })
}

export default function BotSelector({ firestore, state, handleChangeBot }) {
  const [bots, setBots] = useState([]);

  useEffect(() => {
    (async () => {
      if (firestore) {
        let b = [];
        await getBotCollection(firestore, 'chatbot_active', b);
        await getBotCollection(firestore, 'chatbot_origin', b);
        if (b.length !== bots.length) {
          setBots(b);
        }
      }

    })();
  }, [firestore, bots]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box>
        <Typography variant="h5">
          編集するチャットボットの選択
        </Typography>
      </Box>
      <Box>
        <ImageList sx={{
          witdth: '100%',
          height: 170
        }}
          cols={3}
          rowHeight={164}>
          {bots.map(bot => (
            <ImageListItem key={bot.id}
              onClick={() => { handleChangeBot(bot.id, bot.collection) }}
              sx={{
                border: bot.id === state.botId ? "4px solid" : "none",
                borderColor: 'primary.main'
              }}
            >
              <img
                src={`../..${bot.avatarDir}peace.svg`}
                alt={bot.avatarDir}
                style={{
                  width: 120,
                  height: 180
                }}
                loading="lazy"
              />
              <ImageListItemBar
                title={bot.name}
                subtitle={bot.userDisplayName ? `@${bot.userDisplayName}` : 'オリジナル'}
                actionIcon={
                  <IconButton
                  sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                  aria-label={`info about ${bot.id}`}
                  onClick={() => { handleChangeBot(bot.id, bot.collection) }}
                  >
                    <EditIcon/>
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}

        </ImageList>
      </Box>

    </Box>
  )
}