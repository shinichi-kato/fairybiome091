import { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, writeBatch, getDoc } from 'firebase/firestore';

export default function useFirebase() {
  const [firebase, setFirebase] = useState();
  const [firestore, setFirestore] = useState();

  useEffect(() => {
    let fb;
    if (getApps().length === 0) {
      fb = initializeApp({
        apiKey: process.env.GATSBY_FIREBASE_API_KEY,
        authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.GATSBY_FIREBASE_PROJECT_ID,
        storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.GATSBY_FIREBASE_APP_ID,
        measurementId: process.env.GATSBY_FIREBASE_MEASUREMENT_ID,
      });
    } else {
      fb = getApp();
    }

    setFirebase(fb);
    setFirestore(getFirestore(fb));

  }, []);

  return [firebase, firestore];
}

/* ---------------------------------------------------------------------

  チャットボットデータのインストールとコピー

  ----------------------------------------------------------------------

  firestore上では以下の構造でchatbotデータを保持する。
  collection chatbot_origin
  └doc {name}
    └collection biome
        └doc greeting.json
          doc w-311-05.json
  collection chatbot_live
  └doc {name} or {userId}
    └collection biome
      └doc greeting.json
        doc w-311-05.json
  
  host上のデータをまずchatbot_originにコピーする。
  ユーザが会話し学習するチャットボットはchatbot_originから
  更にchatbot_liveにコピーしたものを使用する。
  chatbot_originのデータは管理者のみ編集可能。
  チャットボットにはユーザが個人で所有し学習可能・編集可能なものと、
  特定のユーザに属せず学習は可能だが編集は管理者のみ可能なものがある。
  前者はnpc:false、校舎はnpc:trueで区別する。

  chatbot_activeにはnpc:false, npc:trueの両方が格納され、
  npcのidは{nmame}、そうでないチャットボットのidは{userId}とする。

*/
export async function uploadOrigin(firestore, name, main, biome) {
  /*
    name: チャットボットのディレクトリ名
    main: mainスクリプトの内容
    biome: biomeスクリプトの辞書
  */
  const batch = writeBatch(firestore);
  const mainRef = doc(firestore, "chatbot_origin", name);
  batch.set(mainRef, main);

  for (let cellName of main.biome) {
    let cellRef = doc(firestore, "chatbot_origin", name, "biome", cellName);
    batch.set(cellRef, biome[cellName]);
  }

  await batch.commit();


}

export async function clone(firestore, originName, uid) {
  /*
    originNameで指定されるチャットボットのデータをchatbot_activeにコピーする。
    コピー元のデータがnpc:trueだった場合、collection chatbot_activeに
    {originName}の名前でコピーを作る。すでに同名のデータがある場合は無視する。
    npc:falseだった場合{uid}の名前でコピーを作る。すでに同名のデータがある
    場合は上書きする。
  */

  const sourceRef = doc(firestore, "chatbot_origin", originName);
  const sourceSnap = await getDoc(sourceRef);
  let sourceCells = [];

  if (sourceSnap.exists()) {
    // sourceを読み込む
    let source = sourceSnap.data();
    for (let cellName of source.biome) {
      let cellRef = doc(firestore, "chatbot_active", originName, "biome", cellName);
      let cellSnap = await getDoc(cellRef);
      sourceCells[cellName] = { ...cellSnap.data() };
    }

    // destに書き込む
    const batch = writeBatch(firestore);
    const botId = source.npc ? originName : uid;
    console.log(botId)

    const destRef = doc(firestore, "chatbot_active", botId);
    batch.set(destRef, source);

    for (let cellName of source.biome) {
      let cellRef = doc(firestore, "chatbot_active", botId, "biome", cellName);
      batch.set(cellRef, sourceCells[cellName]);
    }

    await batch.commit();
  }
  else {
    // 見つからなかった
    throw new Error(`${originName}が見つかりません`)

  }
}




