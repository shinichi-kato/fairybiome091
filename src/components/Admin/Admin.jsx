import React, { useState, useContext, useEffect } from 'react';
import { useStaticQuery, graphql } from "gatsby"

import { 
  collection, query, where,
  getCountFromServer,
  doc, setDoc, 
} from "firebase/firestore";

import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { UserContext } from '../User/UserProvider';

export default function AdminPage({ firestore }) {
  const user = useContext(UserContext);
  const [botCount, setBotCount] = useState(0);

  const data = useStaticQuery(graphql`
    query {
      allFile(filter: {sourceInstanceName: {eq: "chatbots"}, name: {eq: "main"}}) {
        nodes {
          absolutePath
          relativeDirectory
        }
      }
    }
  `);

  useEffect(() => {
    if (firestore) {
      const q = query(
        collection(firestore, "chatbots"),
        where("uid", "==", ""));

      getCountFromServer(q).then(snap => {
        setBotCount(snap.data().count);
      })
    }
  }, [firestore]);

  function handleUpload() {
    const paths = data.allfile.nodes.relativeDirectory

  }

  return (
    <Container
      maxWidth="xs"
      disableGutters
      sx={{
        height: "100vh"
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography variant="body2">
            チャットボットの初期データをサーバにアップロードします。
            アプリのセットアップ時に実行してください。
          </Typography>
          {botCount &&
            <Typography sx={{ color: "#ff0000" }}>
              サーバー上にチャットボットの初期データが{botCount}件存在します。
              アップロードを実行するとこれらのデータは上書きされます。
            </Typography>
          }
        </Grid>
        <Grid item xs={4}>
          <Button
            disabled={!user.administrator}
            onClick={handleUpload}>
            アップロード
          </Button>
        </Grid>
        <Grid item xs={8}>

        </Grid>

      </Grid>
    </Container>
  )
}