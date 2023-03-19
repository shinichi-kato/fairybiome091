import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useStaticQuery, graphql } from "gatsby"
import { navigate } from "gatsby";
import {
  collection, getDocs,
  getCountFromServer,
} from "firebase/firestore";

import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import DownloadIcon from '@mui/icons-material/Download';
import Typography from '@mui/material/Typography';

import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';

import { UserContext } from '../User/UserProvider';
import { AuthContext } from '../Auth/AuthProvider';
import { uploadOrigin } from '../../useFirebase';

const RE_FILENAME = new RegExp('/([^/]+)$')

export default function AdminPage({ firestore }) {
  const user = useContext(UserContext);
  const auth = useContext(AuthContext);
  const [botCount, setBotCount] = useState(0);
  const [userList, setUserList] = useState([]);

  const data = useStaticQuery(graphql`
  query {
    allFile(filter: {sourceInstanceName: {eq: "chatbots"}, name: {eq: "main"}}) {
      nodes {
        relativeDirectory
      }
    }
  }
  `);

  //---------------------------------------------------------
  //
  // ログのダウンロード
  // 
  // 全データを読んで.csv形式ファイル化する。
  // ログは最大1MBだが対処は先送り
  // 削除する単位はdocで大量削除はオペレーションのコストが大きい。
  // コレクションの削除はコンソールからはできるがsdkでは
  // サポートしていない。

  const downloadLog = useCallback(params => () => {
    const logRef = collection(firestore, "users", params.id, "log");
    getDocs(logRef).then(snap => {

      let logData = ['name,person,avatar,text,timestamp\n'];
      snap.forEach(doc => {
        const data = doc.data();
        const avatar = RE_FILENAME.exec(data.avatarURL);
        const timestamp = data.timestamp.toDate();
        logData.push(
          `${data.name},${data.person},${avatar[1]},${data.text},${timestamp}\n`
        )
      })

      const blob = new Blob(logData, { type: "text/csv" });
      //BlobからオブジェクトURLを作成する
      const url = (window.URL || window.webkitURL).createObjectURL(blob);
      //ダウンロード用にリンクを作成する
      const download = document.createElement("a");
      //リンク先に上記で生成したURLを指定する
      download.href = url;
      //download属性にファイル名を指定する
      download.download = `log-${params.row.displayName}`;
      //作成したリンクをクリックしてダウンロードを実行する
      download.click();
      //createObjectURLで作成したオブジェクトURLを開放する
      (window.URL || window.webkitURL).revokeObjectURL(url);


    })
  }, [firestore]);

  const columns = useMemo(() => [
    { field: 'displayName', headerName: 'ユーザ名' },
    { field: 'count', headerName: 'ログ行数' },
    {
      field: 'actions', type: 'actions',
      getActions: params => [
        <GridActionsCellItem
          icon={<DownloadIcon />}
          label="download"
          onClick={downloadLog(params)}
        />,
      ]
    }
  ], [downloadLog]);

  useEffect(() => {
    if (firestore) {
      const origins = collection(firestore, "chatbot_origin");
      getCountFromServer(origins).then(snap => {
        setBotCount(snap.data().count);
      });

      const usersRef = collection(firestore, "users");
      getDocs(usersRef).then(snap => {
        snap.forEach(doc => {
          (async () => {
            const data = doc.data();
            const logRef = collection(firestore, "users", doc.id, "log");
            const countSnap = await getCountFromServer(logRef);
            setUserList(prev => {
              return [...prev, {
                id: doc.id,
                displayName: data.displayName,
                count: countSnap.data().count,
              }]
            })
          })();
        })
      });
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

    const dirs = data.allFile.nodes.map(node => node.relativeDirectory);
    (async () => {

      for (let dir of dirs) {
        /* main.jsonをhostからダウンロード */
        let data = await fetch(`/chatbot/biomebot/${dir}/main.json`);
        let main = await data.json();
        let biome = {};

        for (let cellName of main.biome) {
          data = await fetch(`/chatbot/biomebot/${dir}/${cellName}`);
          biome[cellName] = await data.json();
        }
        /* firestoreにアップロード */
        await uploadOrigin(firestore, dir, main, biome);

      }
    })();

  }

  function toIndexPage() {
    navigate('/')
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
          <IconButton
            onClick={toIndexPage}
          >
            <ArrowBackIosIcon />
          </IconButton>
        </Grid>
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
            <Typography sx={{ color: "#ff0000" }} variant="caption">
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
        <Grid item xs={12}>
          ログの表示/ダウンロード
        </Grid>
        <Grid item xs={12}>
          <DataGrid
            rows={userList.length === 0 ? [{ id: 0, displayName: 'loading', count: '' }] : userList}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            autoHeight
            disableRowSelectionOnClick
          />
        </Grid>
      </Grid>
    </Container>
  )
}