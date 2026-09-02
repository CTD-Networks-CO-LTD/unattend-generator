# unattend-generator テストツール集

本ディレクトリには、ローカル環境でのブラウジング動作確認や、各ボタン・フォームの送信先（`action` / `formaction`）の検証を対話式に行うためのテストツール群が格納されています。

---

## 収録スクリプト一覧

| ファイル名 | 役割 |
| :--- | :--- |
| `interactive_test.ps1` | 対話式テストランナー（メニュー選択式CLI） |
| `verify_buttons.py` | 全ボタン・フォームの一括URL検証 & 個別ボタン動作シミュレーション |

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
- `4`: ローカルテストサーバーの停止
- `0`: ツール終了

---

### 2. Pythonスクリプト単体での実行

```bash
# 全ボタンの一括検証
python test_tools/verify_buttons.py verify

# 個別ボタンのシミュレーション例 (Bookmark)
python test_tools/verify_buttons.py sim:bookmark

# 個別ボタンのシミュレーション例 (Download)
python test_tools/verify_buttons.py sim:download
```

