ipcMain.handle('run-msisdn-investigator', async (_event, payload = {}) => {
  try {
    const bastion = payload.bastion || { host: '10.77.85.72', port: 22 };
    const credentials = payload.credentials || { username: '', password: '' };
    const rhevmHost = payload.rhevmHost || '10.10.46.143';
    const rhevmUser = payload.rhevmUser || 'csptmuser';
    const scriptPath = payload.scriptPath || '/home/csptmuser/scripts/msisdn_investigator.py';
    const msisdn = payload.msisdn;
    const hourArg = payload.hourArg || 'allday';
    const mode = (payload.mode || 'USSD').toUpperCase();
    const workers = Number(payload.workers || 8);
    const timeoutMs = Number(payload.timeoutMs || 5 * 60 * 1000);

    if (!msisdn) {
      return { success: false, error: 'MSISDN is required' };
    }

    const shellQuote = (value) => `'${String(value ?? '').replace(/'/g, "'\\''")}'`;
    const remoteCmd = `/usr/bin/env python2 ${scriptPath} ${msisdn} ${hourArg} ${mode} --json --workers ${workers}`;
    const command = ['ssh', '-q', `${rhevmUser}@${rhevmHost}`, shellQuote(remoteCmd)].join(' ');

    const result = await sshExecOnBastion(bastion, credentials, command, timeoutMs);

    if (!result || typeof result.stdout === 'undefined') {
      return {
        success: false,
        error: 'No output from investigator script',
        stderr: result?.stderr || ''
      };
    }

    try {
      const parsed = JSON.parse(result.stdout);
      return { success: true, payload: parsed };
    } catch (e) {
      return {
        success: false,
        error: 'Script output was not valid JSON',
        stdout: result.stdout,
        stderr: result.stderr || '',
        parseError: e.message
      };
    }
  } catch (e) {
    return {
      success: false,
      error: e.message || String(e)
    };
  }
});
