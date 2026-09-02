/**
 * Configuration for unattend-generator processing engine
 *
 * モード設定:
 * - 'client' : ブラウザの JavaScript (Blob) による即時クライアントサイド生成（デフォルト）
 * - 'server' : Cloudflare Workers / Vercel / AWS Lambda などのサーバーレス関数経由
 */
window.UNATTEND_CONFIG = {
  // 動作モード: 'client' または 'server'
  mode: 'client',

  // server モード時のAPIエンドポイント基底URL (末尾スラッシュなし)
  // 例: 'https://unattend-api.example.workers.dev' または 'https://your-project.vercel.app/api'
  serverEndpoint: '',

  // URLパラメータ（?engine=server&api=...）による動的上書きを許可するか
  allowUrlOverride: true
};
