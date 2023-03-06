import React, { useState, useContext, useEffect } from 'react';
import { useStaticQuery, graphql } from "gatsby"

import {
  collection, query, where,
  getCountFromServer,
} from "firebase/firestore";

import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { UserContext } from '../User/UserProvider';
import { AuthContext } from '../Auth/AuthProvider';
import { uploadOrigin } from '../../useFirebase';

export default function AdminPage({ firestore }) {
  const user = useContext(UserContext);
  const auth = useContext(AuthContext);
  const [botCount, setBotCount] = useState(0);

  const data = useStaticQuery(graphql`
  query {
    allFile(filter: {sourceInstanceName: {eq: "chatbots"}, name: {eq: "main"}}) {
      nodes {
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
    /*
      host上には以下のようにスクリプトが格納されている。

      "fairy/greeting.json"
      "fairy/w-311-05.json"
      "fairy/main.json"

      これをfirestore上にコピーする。firestoreでは以下の構造で
      データを保存する。chatbotコレクションはhostからのコピーで
      ユーザがチャットボットを新規作成するときはuser_chatbotsに
      コピーを作る。

      collection chatbot
      └doc fairy.json
        └collection biome
           └doc greeting.json
             doc w-311-05.json
      collection user_chatbot
      └doc {uid}
        └collection biome
          └doc ...

      という構造で格納する。最初にmain.jsonをアップロードし、
      その後main.jsonのbiomeに記述されたスクリプト名に従って
      アップロードする。
    */

    const dirs = data.allFile.nodes.map(node=>node.relativeDirectory);
    (async () => {

      for (let dir of dirs) {
        /* main.jsonをhostからダウンロード */
        let data = await fetch(`/chatbot/Biomebot/${dir}/main.json`);
        let main = await data.json();
        let biome = {};

        for (let cellName of main.biome) {
          data = await fetch(`/chatbot/Biomebot/${dir}/${cellName}`);
          biome[cellName] = await data.json();
        }
        /* firestoreにアップロード */
        await uploadOrigin(firestore, dir, main, biome);

      }
    })();

  }

  return (
    <Container
      maxWidth="xs"
      disableGutters
      sx={{
        height: "100vh",
        backgroundColor: "#eeeeee",
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {auth.email}
          <Button
            onClick={auth.handleSignOut}
          >
            signout
          </Button>
        </Grid>
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