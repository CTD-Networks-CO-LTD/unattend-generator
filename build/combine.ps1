param (
    [string]$SectionsDir = "$PSScriptRoot/../docs/sections",
    [string]$OutputFile = "$PSScriptRoot/../docs/index_bundle.html"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SectionsDir)) {
    Write-Error "Sections directory not found: $SectionsDir"
    exit 1
}

$sectionFiles = @(
    "01_region_language.html",
    "02_windows_pe_stage.html",
    "03_activation.html",
    "04_processor_architectures.html",
    "05_setup_settings.html",
    "06_computer_name.html",
    "07_time_zone.html",
    "08_user_accounts.html",
    "09_password_expiration.html",
    "10_account_lockout.html",
    "11_explorer_tweaks.html",
    "12_start_taskbar.html",
    "13_system_tweaks.html",
    "14_visual_effects.html",
    "15_desktop_icons.html",
    "16_folders_start.html",
    "17_vm_hosts.html",
    "18_vm_guests.html",
    "19_wifi_setup.html",
    "20_express_settings.html",
    "21_lock_keys.html",
    "22_sticky_keys.html",
    "23_personalization.html",
    "24_remove_bloatware.html",
    "25_custom_scripts.html",
    "26_applocker.html",
    "27_xml_components.html",
    "28_download_settings.html",
    "29_submit_form.html"
)

$headerContent = (Get-Content (Join-Path $SectionsDir "header.html") -Raw -Encoding UTF8).Trim()
$presetsContent = (Get-Content (Join-Path $SectionsDir "presets.html") -Raw -Encoding UTF8).Trim()

$tableRows = @()
foreach ($file in $sectionFiles) {
    $filePath = Join-Path $SectionsDir $file
    if (Test-Path $filePath) {
        $tableRows += (Get-Content $filePath -Raw -Encoding UTF8).TrimEnd()
    } else {
        Write-Warning "Section file missing: $filePath"
    }
}

Write-Output "Loaded $($tableRows.Count) sections successfully."

