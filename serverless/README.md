# サーバーレス関数（API）切り替えガイド

本プロジェクト（unattend-generator）は、デフォルトで **ブラウザ内の JavaScript（クライアントサイド生成）** により、バックエンドサーバーなしで XML / ISO のダウンロード・表示・インポートが完結します。

将来的に **Cloudflare Workers** や **Vercel Functions**、**AWS Lambda** などのサーバーレスバックエンド経由に切り替えたい場合は、以下の手順で簡単に切り替えが可能です。

---

## 1. モード切り替え設定 (`docs/unattend_config.js`)

`docs/unattend_config.js` を編集し、`mode` を `'server'` に変更して、デプロイ先エンドポイントのURLを指定します。

```javascript
window.UNATTEND_CONFIG = {
  // 'client': ブラウザ内生成 (デフォルト)
  // 'server': サーバーレスAPI経由
  mode: 'server',

  // サーバーレス関数のURL（末尾スラッシュなし）
  serverEndpoint: 'https://unattend-api.yourname.workers.dev',

  // URLパラメータ（?engine=server&api=...）による動的上書き許可
  allowUrlOverride: true
};
```

---

## 2. URLパラメータによる一時的な切り替え

設定ファイルを変更しなくても、URLパラメータで動作モードを上書きしてテストできます。

- **サーバーレスAPIをテストする場合**:
  `https://ctd-networks-co-ltd.github.io/unattend-generator/?engine=server&api=https://unattend-api.yourname.workers.dev`

- **クライアント生成モードを強制する場合**:
  `https://ctd-networks-co-ltd.github.io/unattend-generator/?engine=client`

---

## 3. 各サーバーレスプラットフォームのデプロイ例

### A. Cloudflare Workers
1. `serverless/cloudflare-worker.js` を使用します。
2. Wrangler CLI でデプロイ:
   ```bash
   npx wrangler deploy serverless/cloudflare-worker.js --name unattend-api
   ```
3. 発行された Worker URL を `docs/unattend_config.js` の `serverEndpoint` に設定します。

### B. Vercel Functions
1. Vercel の API Routes（`/api/download`, `/api/view` など）として配置します。
2. Vercel のプロジェクト URL を `serverEndpoint` に設定します。

---

## 4. 自動フォールバック機構
もしサーバーレス関数への通信がエラー（ネットワーク障害やHTTPエラー）となった場合、自動的にブラウザ内のクライアント生成エンジンへフォールバックしてダウンロードが継続される安全設計になっています。
