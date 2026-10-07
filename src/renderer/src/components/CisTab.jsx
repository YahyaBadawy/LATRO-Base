import React, { useState, useRef } from 'react';
import './CisTab.css';

function HourSelector({ value, onChange }) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="now">Now</option>
      <option value="allday">All Day</option>
      {hours.map((h) => (
        <option key={h} value={h}>{h}:00</option>
      ))}
    </select>
  );
}

export default function CisTab() {
  const [msisdn, setMsisdn] = useState('');
  const [hourArg, setHourArg] = useState('allday');
  const [mode, setMode] = useState('USSD');
  const [workers, setWorkers] = useState(8);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const toastTimer = useRef(null);

  function showToast(text, kind = 'error') {
    setError(kind === 'error' ? text : '');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (kind !== 'error') {
      toastTimer.current = setTimeout(() => setError(''), 4000);
    }
  }

  async function runInvestigator() {
    if (!msisdn.trim()) {
      showToast('Please enter an MSISDN');
      return;
    }
    setBusy(true);
    setError('');
    setResults(null);
    try {
      // Try to get stored SSH credentials. If not available, fall back to the defaults you provided.
      const creds = await window.latroApi.getCredentials({ service: 'latro-base', account: 'default' });
      let credentials = { username: 'csptmuser', password: 'Latro@123!@MTNB' };
      if (creds?.success && creds.payload?.ssh) {
        credentials = creds.payload.ssh;
      }

      const payload = {
        msisdn: msisdn.trim(),
        hourArg,
        mode,
        credentials,
        workers: Number(workers) || 8,
        timeoutMs: 5 * 60 * 1000,
      };

      const res = await window.latroApi.runMsisdnInvestigator(payload);

      if (!res || !res.success) {
        let msg = res?.error || 'Investigator failed';
        if (res?.stderr) msg += `\n\nSTDERR:\n${res.stderr}`;
        if (res?.stdout) msg += `\n\nSTDOUT:\n${res.stdout}`;
        throw new Error(msg);
      }

      setResults(res.payload);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cis-card">
      <div className="cis-header">
        <div>
          <div className="cis-kicker">CIS</div>
          <h2>Investigator & Operations</h2>
        </div>
      </div>

      <div className="cis-panels">
        <div className="cis-panel cis-panel-main">
          <h3>MSISDN Investigator</h3>

          <div className="field-row">
            <label>MSISDN</label>
            <input
              type="text"
              value={msisdn}
              onChange={(e) => setMsisdn(e.target.value)}
              placeholder="e.g. 2292290154308443"
            />
          </div>

          <div className="field-row">
            <label>Hour</label>
            <HourSelector value={hourArg} onChange={setHourArg} />
          </div>

          <div className="field-row">
            <label>Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="USSD">USSD</option>
              <option value="WEB">WEB</option>
            </select>
          </div>

          <div className="field-row">
            <label>Workers</label>
            <input
              type="number"
              min="1"
              max="20"
              value={workers}
              onChange={(e) => setWorkers(e.target.value)}
              style={{ width: 90 }}
            />
          </div>

          <div className="field-row">
            <button className="primary-button" onClick={runInvestigator} disabled={busy}>
              {busy ? 'Running…' : 'Run investigator'}
            </button>
          </div>

          {error && (
            <div className="alert error">
              <pre>{error}</pre>
            </div>
          )}

          {results && (
            <div className="results-block">
              <h4>Investigation Results</h4>

              <div className="summary-grid">
                <div><strong>MSISDN</strong><br />{results.msisdn}</div>
                <div><strong>Hour</strong><br />{results.hour}</div>
                <div><strong>Mode</strong><br />{results.mode}</div>
                <div><strong>Timestamp</strong><br />{results.timestamp}</div>
              </div>

              <div className="result-section">
                <h5>Per-business results</h5>
                {results.per_business && results.per_business.map((item) => (
                  <div key={item.business} className="business-result">
                    <div className="business-title">{item.business}</div>
                    <div className="business-meta">
                      <span>RC: {item.rc}</span>
                      <span>Request total: {item.parsed && item.parsed.request_analysis ? item.parsed.request_analysis.total : 0}</span>
                    </div>
                    {item.stdout && (
                      <details>
                        <summary>Output</summary>
                        <pre>{String(item.stdout).slice(0, 5000)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              {results.transactions_summary && results.transactions_summary.length > 0 && (
                <div className="result-section">
                  <h5>Transaction summary</h5>
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Status</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.transactions_summary.map((row, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{row.date}</td>
                          <td>{row.product}</td>
                          <td>{row.status}</td>
                          <td>{row.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cis-panel cis-panel-secondary">
          <h3>Servers Operations</h3>
          <p>This pane is inactive for now.</p>
          <div className="server-list">
            {['Business1', 'Business2', 'Business3', 'Business4', 'Business5'].map((server) => (
              <div key={server} className="server-row">
                <span>{server}</span>
                <button disabled>Reboot</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
