# FairyBiome-0.9.1

チャットボットのいるチャットルーム

## チャットボットの特徴



## インストール

firebaseにアカウントを用意します。
githubの場合リポジトリ本体にはセキュリティのためクレデンシャル情報を置かず、変わりに
Settings - Secrets and variables - Repository secretsに以下の変数を作り、
firebaseから取得したクレデンシャルを転記します。Gatsbyではプログラム内で使える環境変数は先頭がGATSBY_から始まっている必要があるため、以下のような名前にします。

```
GATSBY_FIREBASE_API_KEY
GATSBY_FIREBASE_AUTH_DOMAIN
GATSBY_FIREBASE_PROJECT_ID
GATSBY_FIREBASE_STORAGE_BUCKET
GATSBY_FIREBASE_MESSAGING_SENDER_ID
GATSBY_FIREBASE_APP_ID
GATSBY_FIREBASE_MEASUREMENT_ID
```

またローカルで動かす場合は.env.localというファイルを作成し以下のようにクレデンシャル情報を記載します。
```
GATSBY_FIREBASE_API_KEY={...}
GATSBY_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
GATSBY_FIREBASE_PROJECT_ID={...}
GATSBY_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
GATSBY_FIREBASE_MESSAGING_SENDER_ID={...}
GATSBY_FIREBASE_APP_ID={...}
GATSBY_FIREBASE_MEASUREMENT_ID={...}
```
