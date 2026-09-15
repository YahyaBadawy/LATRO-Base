const { Client } = require('ssh2');
const { Readable } = require('stream');

function sshExecOnBastion(bastion, credentials, command, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const onError = (err) => {
      try { conn.end(); } catch (e) {}
      if (timedOut) return;
      const error = new Error('SSH exec failed: ' + (err.message || err));
      error.stderr = stderr;
      reject(error);
    };

    conn.on('ready', () => {
      conn.exec(command, { pty: false }, (err, stream) => {
        if (err) return onError(err);
        stream.on('close', (code, signal) => {
          conn.end();
          if (timedOut) return;
          if (code === 0) resolve({ stdout, stderr });
          else {
            const error = new Error(`Remote command exited ${code}`);
            error.stderr = stderr;
            error.stdout = stdout;
            error.code = code;
            reject(error);
          }
        }).on('data', (data) => {
          stdout += data.toString();
        }).stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    }).on('error', onError);

    const connParams = {
      host: bastion.host,
      port: bastion.port || 22,
      username: credentials.username
    };
    if (credentials.password) connParams.password = credentials.password;
    if (credentials.privateKey) connParams.privateKey = credentials.privateKey;

    conn.connect(connParams);

    setTimeout(() => {
      timedOut = true;
      try { conn.end(); } catch (e) {}
      const error = new Error('SSH exec timed out');
      error.stderr = stderr;
      reject(error);
    }, timeoutMs);
  });
}

// Write a file to the bastion using SFTP. content is a string. mode is the file mode (e.g., 0o600)
function sftpWriteFileOnBastion(bastion, credentials, remotePath, content, mode = 0o600, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let timedOut = false;
    const onError = (err) => {
      try { conn.end(); } catch (e) {}
      if (timedOut) return;
      reject(new Error('SFTP failed: ' + (err.message || err)));
    };

    conn.on('ready', () => {
      conn.sftp((err, sftp) => {
        if (err) return onError(err);
        // create a readable stream from content
        const readStream = new Readable();
        readStream.push(content);
        readStream.push(null);

        const writeStream = sftp.createWriteStream(remotePath, { mode });
        writeStream.on('close', () => {
          // ensure permissions set (chmod may be needed)
          sftp.chmod(remotePath, mode, (chErr) => {
            conn.end();
            if (chErr) return reject(new Error('SFTP chmod failed: ' + chErr.message));
            resolve();
          });
        });
        writeStream.on('error', (werr) => {
          conn.end();
          reject(new Error('SFTP write error: ' + werr.message));
        });

        readStream.pipe(writeStream);
      });
    }).on('error', onError);

    const connParams = {
      host: bastion.host,
      port: bastion.port || 22,
      username: credentials.username
    };
    if (credentials.password) connParams.password = credentials.password;
    if (credentials.privateKey) connParams.privateKey = credentials.privateKey;

    conn.connect(connParams);

    setTimeout(() => {
      timedOut = true;
      try { conn.end(); } catch (e) {}
      reject(new Error('SFTP timed out'));
    }, timeoutMs);
  });
}

module.exports = { sshExecOnBastion, sftpWriteFileOnBastion };
