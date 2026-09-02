/**
 * unattend-generator Client Engine & Serverless Connector
 */
(function () {
  'use strict';

  function getConfig() {
    var config = Object.assign({
      mode: 'client',
      serverEndpoint: '',
      allowUrlOverride: true
    }, window.UNATTEND_CONFIG || {});

    if (config.allowUrlOverride && typeof window !== 'undefined' && window.location) {
      var params = new URLSearchParams(window.location.search);
      var engineParam = params.get('engine');
      var apiParam = params.get('api');
      if (engineParam === 'client' || engineParam === 'server') {
        config.mode = engineParam;
      }
      if (apiParam) {
        config.serverEndpoint = apiParam.replace(/\/+$/, '');
      }
    }
    return config;
  }

  function createIsoBlob(filename, fileContentStr) {
    var SECTOR_SIZE = 2048;
    var encoder = new TextEncoder();
    var fileBytes = encoder.encode(fileContentStr);
    var fileSectors = Math.ceil(fileBytes.length / SECTOR_SIZE) || 1;
    var totalSectors = 16 + 1 + 1 + fileSectors + 1;
    var buffer = new Uint8Array(totalSectors * SECTOR_SIZE);

    var pvdOffset = 16 * SECTOR_SIZE;
    buffer[pvdOffset + 0] = 1;
    buffer.set(encoder.encode('CD001'), pvdOffset + 1);
    buffer[pvdOffset + 6] = 1;
    buffer.set(encoder.encode('WINDOWS                         '.substring(0, 32)), pvdOffset + 8);
    buffer.set(encoder.encode('UNATTEND                        '.substring(0, 32)), pvdOffset + 40);

    var rootDirOffset = pvdOffset + 156;
    buffer[rootDirOffset + 0] = 34;
    buffer[rootDirOffset + 2] = 18;
    buffer[rootDirOffset + 6] = 18;
    buffer[rootDirOffset + 10] = 2048 & 0xff;
    buffer[rootDirOffset + 11] = (2048 >> 8) & 0xff;
    buffer[rootDirOffset + 25] = 2;

    var termOffset = 17 * SECTOR_SIZE;
    buffer[termOffset + 0] = 255;
    buffer.set(encoder.encode('CD001'), termOffset + 1);
    buffer[termOffset + 6] = 1;

    var fileSector = 19;
    buffer.set(fileBytes, fileSector * SECTOR_SIZE);

    var ptr = 18 * SECTOR_SIZE;
    buffer[ptr + 0] = 34; buffer[ptr + 2] = 18; buffer[ptr + 10] = 2048 & 0xff; buffer[ptr + 25] = 2; buffer[ptr + 32] = 1; buffer[ptr + 33] = 0;
    ptr += 34;
    buffer[ptr + 0] = 34; buffer[ptr + 2] = 18; buffer[ptr + 10] = 2048 & 0xff; buffer[ptr + 25] = 2; buffer[ptr + 32] = 1; buffer[ptr + 33] = 1;
    ptr += 34;

    var isoName = (filename + ';1').toUpperCase();
    var recLen = 33 + isoName.length + (isoName.length % 2 === 0 ? 1 : 0);
    buffer[ptr + 0] = recLen;
    buffer[ptr + 2] = fileSector & 0xff;
    buffer[ptr + 3] = (fileSector >> 8) & 0xff;
    buffer[ptr + 10] = fileBytes.length & 0xff;
    buffer[ptr + 11] = (fileBytes.length >> 8) & 0xff;
    buffer[ptr + 25] = 0;
    buffer[ptr + 32] = isoName.length;
    buffer.set(encoder.encode(isoName), ptr + 33);

    return new Blob([buffer], { type: 'application/x-iso9660-image' });
  }

  function escapeXml(str) {
    if (!str) return '';
    return String(str).replace(/[<>&'"]/g, function (c) {
      if (c === '<') return '&lt;';
      if (c === '>') return '&gt;';
      if (c === '&') return '&amp;';
      if (c === "'") return '&apos;';
      if (c === '"') return '&quot;';
      return c;
    });
  }

  function generateAutounattendXml(formData) {
    var locale = formData.get('Locale') || 'ja-JP';
    var keyboard = formData.get('Keyboard') || '00000411';
    var geoLoc = formData.get('GeoLocation') || '122';
    var compName = formData.get('ComputerName') || 'Windows';
    var compNameMode = formData.get('ComputerNameMode') || 'Random';
    var compNameScript = formData.get('ComputerNameScript') || '';
    var timeZone = formData.get('TimeZone') || 'Tokyo Standard Time';

    var accounts = [];
    for (var i = 0; i < 10; i++) {
      var accName = formData.get('AccountName' + i);
      if (accName) {
        accounts.push({
          name: accName,
          displayName: formData.get('AccountDisplayName' + i) || accName,
          group: formData.get('AccountGroup' + i) || 'Administrators',
          password: formData.get('AccountPassword' + i) || ''
        });
      }
    }
    if (accounts.length === 0 && formData.get('LocalUser') === 'true') {
      accounts.push({ name: 'Admin', displayName: 'Administrator', group: 'Administrators', password: '' });
    }

    var xmlLines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<unattend xmlns="urn:schemas-microsoft-com:unattend" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State">',
      '  <settings pass="windowsPE">',
      '    <component name="Microsoft-Windows-International-Core-WinPE" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">',
      '      <SetupUILanguage><UILanguage>' + escapeXml(locale) + '</UILanguage></SetupUILanguage>',
      '      <InputLocale>' + escapeXml(keyboard) + '</InputLocale>',
      '      <SystemLocale>' + escapeXml(locale) + '</SystemLocale>',
      '      <UILanguage>' + escapeXml(locale) + '</UILanguage>',
      '      <UserLocale>' + escapeXml(locale) + '</UserLocale>',
      '    </component>',
      '    <component name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">',
      '      <UserData>',
      '        <AcceptEula>true</AcceptEula>',
      '      </UserData>',
      '    </component>',
      '  </settings>',
      '  <settings pass="specialize">',
      '    <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">'
    ];

    if (compNameMode === 'Custom') {
      xmlLines.push('      <ComputerName>' + escapeXml(compName) + '</ComputerName>');
    } else if (compNameMode === 'Script') {
      xmlLines.push('      <ComputerName>TEMPNAME</ComputerName>');
    } else {
      xmlLines.push('      <ComputerName>*</ComputerName>');
    }

    xmlLines.push(
      '      <TimeZone>' + escapeXml(timeZone) + '</TimeZone>',
      '    </component>',
      '  </settings>',
      '  <settings pass="oobeSystem">',
      '    <component name="Microsoft-Windows-International-Core" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">',
      '      <InputLocale>' + escapeXml(keyboard) + '</InputLocale>',
      '      <SystemLocale>' + escapeXml(locale) + '</SystemLocale>',
      '      <UILanguage>' + escapeXml(locale) + '</UILanguage>',
      '      <UserLocale>' + escapeXml(locale) + '</UserLocale>',
      '      <GeoLocation>' + escapeXml(geoLoc) + '</GeoLocation>',
      '    </component>',
      '    <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">',
      '      <UserAccounts>'
    );

    if (accounts.length > 0) {
      xmlLines.push('        <LocalAccounts>');
      accounts.forEach(function (acc) {
        xmlLines.push('          <LocalAccount wcm:action="add">');
        xmlLines.push('            <Name>' + escapeXml(acc.name) + '</Name>');
        xmlLines.push('            <DisplayName>' + escapeXml(acc.displayName) + '</DisplayName>');
        xmlLines.push('            <Group>' + escapeXml(acc.group) + '</Group>');
        xmlLines.push('            <Password>');
        xmlLines.push('              <Value>' + escapeXml(acc.password) + '</Value>');
        xmlLines.push('              <PlainText>true</PlainText>');
        xmlLines.push('            </Password>');
        xmlLines.push('          </LocalAccount>');
      });
      xmlLines.push('        </LocalAccounts>');
    }

    xmlLines.push(
      '      </UserAccounts>',
      '      <OOBE>',
      '        <HideEULAPage>true</HideEULAPage>',
      '        <HideOnlineAccountScreens>true</HideOnlineAccountScreens>',
      '        <HideWirelessSetupInOOBE>true</HideWirelessSetupInOOBE>',
      '      </OOBE>',
      '    </component>',
      '  </settings>',
      '</unattend>'
    );

    return xmlLines.join('\n');
  }

  function applyXmlToForm(xmlText) {
    try {
      var parser = new DOMParser();
      var dom = parser.parseFromString(xmlText, 'application/xml');
      if (dom.querySelector('parsererror')) {
        alert('無効なXML形式です。');
        return false;
      }
      var uiLang = dom.querySelector('UILanguage');
      if (uiLang) {
        var sel = document.querySelector('select[name="Locale"]');
        if (sel) {
          sel.value = uiLang.textContent.trim();
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      alert('XMLファイルのインポートが完了しました。');
      return true;
    } catch (err) {
      alert('インポートエラー: ' + err.message);
      return false;
    }
  }

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function handleAction(actionType, formOrData) {
    var config = getConfig();
    var formData = (formOrData instanceof FormData) ? formOrData : new FormData(formOrData || document.querySelector('form'));

    if (config.mode === 'server' && config.serverEndpoint) {
      var endpoint = config.serverEndpoint + '/' + actionType + '/';
      fetch(endpoint, { method: 'POST', body: formData })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return (actionType === 'view') ? res.text() : res.blob();
        })
        .then(function (data) {
          if (actionType === 'view') {
            var blob = new Blob([data], { type: 'text/xml;charset=utf-8' });
            window.open(URL.createObjectURL(blob), '_blank');
          } else if (actionType === 'iso') {
            triggerDownload(data, 'unattend.iso');
          } else {
            triggerDownload(data, 'autounattend.xml');
          }
        })
        .catch(function (err) {
          console.warn('Serverless endpoint failed, falling back to client generation:', err);
          fallbackClient(actionType, formData);
        });
    } else {
      fallbackClient(actionType, formData);
    }
  }

  function fallbackClient(actionType, formData) {
    var xml = generateAutounattendXml(formData);
    var filename = formData.get('CustomUnattendXml') ? 'notautounattend.xml' : 'autounattend.xml';

    if (actionType === 'download') {
      var blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      triggerDownload(blob, filename);
    } else if (actionType === 'view') {
      var viewBlob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
      window.open(URL.createObjectURL(viewBlob), '_blank');
    } else if (actionType === 'iso') {
      var isoBlob = createIsoBlob(filename, xml);
      triggerDownload(isoBlob, 'unattend.iso');
    }
  }

  function initEngine() {
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form) return;
      var submitter = e.submitter;
      var formaction = submitter ? (submitter.getAttribute('formaction') || '') : (form.getAttribute('action') || '');
      var text = submitter ? submitter.textContent.trim() : '';

      if (formaction.includes('download') || text.includes('Download') || text.includes('ダウンロード')) {
        e.preventDefault();
        handleAction('download', form);
      } else if (formaction.includes('view') || text.includes('View') || text.includes('表示')) {
        e.preventDefault();
        handleAction('view', form);
      } else if (formaction.includes('iso') || text.includes('iso')) {
        e.preventDefault();
        handleAction('iso', form);
      }
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('button, input[type="submit"]');
      if (!btn) return;

      var formaction = btn.getAttribute('formaction') || '';
      var text = btn.textContent.trim();
      var form = btn.form || document.querySelector('form[action="./"]') || document.querySelector('form');

      if (formaction.includes('download') || text.includes('Download .xml file') || text.includes('.xmlファイルをダウンロード')) {
        e.preventDefault();
        if (form) handleAction('download', form);
      } else if (formaction.includes('view') || text.includes('View .xml file') || text.includes('.xmlファイルを表示する')) {
        e.preventDefault();
        if (form) handleAction('view', form);
      } else if (formaction.includes('iso') || text.includes('.iso')) {
        e.preventDefault();
        if (form) handleAction('iso', form);
      } else if (text.includes('Import file') || text.includes('インポート')) {
        var fileInput = document.getElementById('Upload');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          e.preventDefault();
          var reader = new FileReader();
          reader.onload = function (evt) {
            applyXmlToForm(evt.target.result);
          };
          reader.readAsText(fileInput.files[0]);
        }
      }
    });

    document.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'Upload') {
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function (evt) {
            applyXmlToForm(evt.target.result);
          };
          reader.readAsText(file);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }

  window.UnattendXmlEngine = {
    getConfig: getConfig,
    generateAutounattendXml: generateAutounattendXml,
    applyXmlToForm: applyXmlToForm,
    createIsoBlob: createIsoBlob,
    handleAction: handleAction
  };
})();


