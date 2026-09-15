  function backupToTmp() {
    if (!properties) return;
    const safeName = selectedResource.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 120);
    const stamp = new Date().toISOString().replace(/[:.]/g, '');
    const filename = `/tmp/latro_${site}_${safeName}_${stamp}.json`;

    const content = JSON.stringify(properties, null, 2);
    appendLog('Writing backup to remote: ' + filename);
    // call main process to write remote file via SFTP
    (async () => {
      const res = await window.latroApi.writeRemoteBackup({ bastion: { host: siteBastion }, credentials: { username: bastionCreds.username, password: bastionCreds.password }, remotePath: filename, content, mode: 0o600 });
      if (res && res.success) appendLog('Remote backup created: ' + filename);
      else appendLog('Remote backup failed: ' + (res && res.error));
    })();
  }
