"""
autounattend.xml および生成エンジンの修正検証スクリプト
"""
import os
import sys
import xml.etree.ElementTree as ET

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def verify_autounattend_xml(file_path):
    print(f"=== {file_path} の検証 ===")
    assert os.path.exists(file_path), f"ファイルが存在しません: {file_path}"
    
    tree = ET.parse(file_path)
    root = tree.getroot()
    ns = {"u": "urn:schemas-microsoft-com:unattend"}
    
    # 1. windowsPE の LayeredDriver チェック
    pe_intl = root.find(".//u:settings[@pass='windowsPE']/u:component[@name='Microsoft-Windows-International-Core-WinPE']", ns)
    assert pe_intl is not None, "Microsoft-Windows-International-Core-WinPE が windowsPE に見つかりません"
    pe_driver = pe_intl.find("u:LayeredDriver", ns)
    assert pe_driver is not None, "windowsPE に LayeredDriver が見つかりません"
    assert pe_driver.text == "1", f"windowsPE の LayeredDriver は '1' である必要があります（実際: {pe_driver.text}）"
    print(" [OK] windowsPE: LayeredDriver = 1 (106/109キー 日本語配列)")
    
    # 2. oobeSystem の LayeredDriver 不存在チェック
    oobe_intl = root.find(".//u:settings[@pass='oobeSystem']/u:component[@name='Microsoft-Windows-International-Core']", ns)
    assert oobe_intl is not None, "Microsoft-Windows-International-Core が oobeSystem に見つかりません"
    oobe_driver = oobe_intl.find("u:LayeredDriver", ns)
    assert oobe_driver is None, "oobeSystem の Microsoft-Windows-International-Core に LayeredDriver が含まれていてはいけません"
    print(" [OK] oobeSystem: LayeredDriver が存在しないことを確認 (スキーマ準拠)")
    
    # 3. Specialize.ps1 のレジストリ設定チェック
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "PCAT_106KEY" in content, "PCAT_106KEY の設定が見つかりません"
    assert "kbd106.dll" in content, "kbd106.dll の設定が見つかりません"
    assert "New-Item -Path $regPath -Force" in content, "レジストリキー自動作成処理が見つかりません"
    assert "Keyboard Layouts\\00000411" in content or "Keyboard Layouts\\\\00000411" in content, "USB/HID用 Keyboard Layouts 設定が見つかりません"
    assert "Set-WinUserLanguageList" in content, "FirstLogon での Set-WinUserLanguageList が見つかりません"
    assert "Set-WinDefaultInputMethodOverride" in content, "Set-WinDefaultInputMethodOverride が見つかりません"
    print(" [OK] Specialize.ps1 & FirstLogon.ps1: PS/2 & USB/HID 日本語キーボード設定（多重適用）を確認")
    print(f"=== {file_path} の検証完了: 全項目パス ===\n")
    return True

if __name__ == "__main__":
    # test_tools -> unattend-generator -> 1_repocopy -> workspace root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_dir = os.path.dirname(script_dir)
    repocopy_dir = os.path.dirname(repo_dir)
    workspace_root = os.path.dirname(repocopy_dir)
    xml_path = os.path.join(workspace_root, "autounattend.xml")
    verify_autounattend_xml(xml_path)
