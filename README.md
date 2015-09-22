![splashscreen](app/image/splash.png)

Live Dwango Reader（旧 Live Door Reader）を Electron でデスクトップアプリ化するプロジェクト。

![capture1](capture1.png)

![capture2](capture2.png)


## できること

* 認証（ログイン＆ログアウト）
* 登録されているフィードの一覧を読み込む
* 選択されたフィードを読み込む
* 選択されたウェブページを読み込む
* フィードの既読化
* ソートとフィルタ
* ピンのクリア

### キーボードショートカット

* s：次のフィードへ
* a：前のフィードへ
* j：次のアイテムへ
* k：前のアイテムへ
* v：元記事の開閉
* z：フィード一覧の開閉
* p：ピンの付け外し

## まだできていないこと

* すべてのキーボードショートカット

その他いっぱい。

## うごかしかた

GitHub からクローンします。

```sh
$ git clone git@github.com:k0sukey/Electron-LDR.git
$ cd Electron-LDR
```

必要な npm パッケージをインストールします。

```sh
$ npm install
```

コマンドラインで起動します。

```sh
$ npm start
```

## LDR API のつなぎ込み状況

**参考** [http://zuzu.hateblo.jp/entry/20091011/1255337739](http://zuzu.hateblo.jp/entry/20091011/1255337739)

- [ ] **/api/feed/discover** POST ```{ feedlink: String }``` たぶんやらない
- [ ] **/api/feed/subscribe** POST ```{ feedlink: String }``` たぶんやらない
- [ ] **/api/feed/unsubscribe** POST ```{ subscribe_id: String }``` たぶんやらない
- [x] **/api/subs** GET/POST ```{ unread: 0/1 }```
- [x] **/api/all** GET/POST ```{ subscribe_id: String, offset:Number, limit: Number}```
- [x] **/api/unread** GET/POST ```{ subscribe_id: String }```
- [x] **/api/touch_all** GET/POST ```{ subscribe_id: String }``` クッキーに ```reader_sid``` も必要
- [ ] **/api/feed/set_rate** POST ```{ subscribe_id: String, rate: [0-5] }``` たぶんやらない
- [ ] **/api/folders** GET/POST たぶんやらない
- [ ] **/api/folder/create** POST ```{ name: String }``` たぶんやらない
- [ ] **/api/folder/delete** ??? たぶんやらない
- [ ] **/api/feed/move** POST ```{ subscribe_id: String, to: String }``` たぶんやらない
- [x] **/api/pin/all** POST ピンの付け外しに。たぶん一覧表示はやらないと思う
- [x] **/api/pin/add** POST ```{ link: String, title: String }``` クッキーに ```reader_sid``` も必要
- [x] **/api/pin/remove** POST ```{ link: String }``` クッキーに ```reader_sid``` も必要
- [x] **/api/pin/clear** POST 一覧表示をやらないならこれもやらないと思う → メニュー内で実装した