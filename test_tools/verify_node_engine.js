const fs = require('fs');
const path = require('path');
const engine = require('../docs/unattend_engine.js');

class MockFormData {
  constructor(obj) {
    this.data = new Map(Object.entries(obj));
  }
  entries() {
    return this.data.entries();
  }
  get(key) {
    return this.data.get(key) || null;
  }
}

function runTest() {
  console.log('=== Node.js unattend_engine.js 日本語キーボード生成テスト ===');

  const formData = new MockFormData({
    LanguageMode: 'Unattended',
    UILanguage: 'ja-JP',
    Locale: 'ja-JP',
    Keyboard: '00000411',
    GeoLocation: '122',
    ProcessorArchitecture: 'amd64',
    PEMode: 'Default',
    WindowsEditionMode: 'Interactive',
    ComputerNameMode: 'Random',
    TimeZoneMode: 'Implicit',
    UserAccountMode: 'Unattended',
    AccountName0: 'Admin',
    AccountPassword0: 'Passwo@d',
    AccountGroup0: 'Administrators'
  });

  const xml = engine.generateAutounattendXml(formData);

  // 1. windowsPE に LayeredDriver 1 があること
  if (!xml.includes('<LayeredDriver>1</LayeredDriver>')) {
    throw new Error('FAIL: windowsPE に <LayeredDriver>1</LayeredDriver> が存在しません');
  }
  console.log(' [OK] windowsPE: <LayeredDriver>1</LayeredDriver> が正しく出力されています');

  // 2. oobeSystem に LayeredDriver がないこと
  const oobeIndex = xml.indexOf('<settings pass="oobeSystem">');
  if (oobeIndex === -1) {
    throw new Error('FAIL: oobeSystem セクションが見つかりません');
  }
  const oobePart = xml.substring(oobeIndex);
  if (oobePart.includes('<LayeredDriver>')) {
    throw new Error('FAIL: oobeSystem に不正な <LayeredDriver> が含まれています');
  }
  console.log(' [OK] oobeSystem: <LayeredDriver> が含まれていないことを確認（スキーマ準拠）');

  // 3. Specialize.ps1 のレジストリ設定
  if (!xml.includes('kbd106.dll') || !xml.includes('PCAT_106KEY')) {
    throw new Error('FAIL: Specialize.ps1 に kbd106.dll / PCAT_106KEY 設定が含まれていません');
  }
  console.log(' [OK] Specialize.ps1: 日本語106/109キーボード用レジストリ設定が含まれています');

  console.log('=== 全テストケースに合格しました ===\n');
}

runTest();
