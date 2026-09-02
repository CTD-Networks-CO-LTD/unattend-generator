# unattend-generator テストツール集

本ディレクトリには、ローカル環境でのブラウジング動作確認や、各ボタン・フォームの送信先検証、およびXML生成・ダウンロード・インポート機能のテストツール群が格納されています。

---

## 収録スクリプト一覧

| ファイル名 | 役割 |
| :--- | :--- |
| `interactive_test.ps1` | 対話式テストランナー（メニュー選択式CLI） |
| `verify_buttons.py` | 全ボタン・フォームの一括URL検証 & 個別ボタン動作シミュレーション |
| `test_e2e_engine.py` | クライアント側XML生成・ダウンロード・インポートエンジンの自動検証 |
| `xml_client_engine.js` | クライアントサイドXML生成・ISOバイナリ作成・インポートエンジン本体 |

---

## 使い方

### 1. 対話式テストツールの起動
PowerShellにて以下を実行します。

```powershell
powershell -ExecutionPolicy Bypass -File .\test_tools\interactive_test.ps1
```

起動後、以下のメニューが表示されます：
- `1`: ローカルテストサーバーを起動し、既定のブラウザで `http://localhost:8080/index.html` を開く
- `2`: 全ボタン・フォームの送信先URL（`action` / `formaction`）を一括自動検証
- `3`: 個別ボタン（Bookmark, Reset, Minimal, LocalUser, View, Download, ISO, Import）の動作確認
- `4`: XML生成・ダウンロードエンジンの検証テスト
- `5`: ローカルテストサーバーの停止
- `0`: ツール終了

---

### 2. Pythonスクリプト単体での実行

```bash
# 全ボタンの一括検証
python test_tools/verify_buttons.py verify

# XML生成・ダウンロードエンジンのテスト
python test_tools/test_e2e_engine.py
```


