import React, { useMemo, useState } from 'react';
import './EdaTab.css';

const SITES = { HO: '10.77.85.74', DC: '10.77.85.72' };
const CLIENT_ID = 'EDA_M2M_PASSWORD_GRANT_CLIENT_b47b731a-62e0-4f12-9421-033758c2c0f7';
const SCOPE = 'scopes.ericsson.com/activation/activation_logic_properties.read scopes.ericsson.com/activation/activation_logic_properties.write';

function shellQuote(value) { return `'${String(value ?? '').replace(/'/g, "'\\''")}'`; }
function parseJson(stdout) { return JSON.parse(String(stdout || '').replace(/^\*.*$/gm, '').trim()); }

export default function EdaTab() {
  const [site, setSite] = useState('HO');
  const [ssh, setSsh] = useState({ username: '', password: '' });
  const [eda, setEda] = useState({ username: '', password: '', clientId: CLIENT_ID, clientSecret: '' });
  const [token, setToken] = useState('');
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [propertiesText, setPropertiesText] = useState('');
  const [status, setStatus] = useState({ kind: 'disconnected', text: 'Disconnected' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Enter credentials to connect to the selected EDA.');
  const host = useMemo(() => SITES[site], [site]);
  const bastion = useMemo(() => ({ host, port: 22 }), [host]);
  const credentials = useMemo(() => ({ username: ssh.username, password: ssh.password }), [ssh]);

  async function remoteCurl(command) {
    if (!window.latroApi?.execCurl) throw new Error('Electron bridge is unavailable.');
    const result = await window.latroApi.execCurl({ bastion, credentials, curlCommand: command });
    if (!result.success) throw new Error(result.error || result.stderr || 'Remote command failed');
    return result.stdout;
  }

  async function connect() {
    if (!ssh.username || !ssh.password || !eda.username || !eda.password || !eda.clientId || !eda.clientSecret) {
      setMessage('Complete all SSH and EDA credential fields before connecting.');
      setStatus({ kind: 'error', text: 'Credentials required' });
      return;
    }
    setBusy(true); setStatus({ kind: 'working', text: 'Connecting…' });
    try {
      // OAuth password grant requires POST. The subsequent resources/properties calls are GET.
      const form = [['client_id', eda.clientId], ['client_secret', eda.clientSecret], ['grant_type', 'password'], ['username', eda.username], ['password', eda.password], ['scope', SCOPE]].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
      const tokenJson = parseJson(await remoteCurl(`curl -ksS --fail-with-body -X POST -H ${shellQuote('Content-Type: application/x-www-form-urlencoded')} --data ${shellQuote(form)} ${shellQuote('https://127.0.0.1:8383/oauth/v1/token')}`));
      if (!tokenJson.access_token) throw new Error('Token response did not contain access_token');
      setToken(tokenJson.access_token);
      const list = parseJson(await remoteCurl(`curl -ksS --fail-with-body -H ${shellQuote(`Authorization: Bearer ${tokenJson.access_token}`)} ${shellQuote('https://127.0.0.1:8383/cm-rest/v1/activation-logic/resources/')}`));
      if (!Array.isArray(list)) throw new Error('Resource response was not a JSON array');
      setResources(list); setSelectedResource(''); setPropertiesText(''); setStatus({ kind: 'connected', text: 'Connected' }); setMessage(`Connected. Loaded ${list.length} resources.`);
    } catch (error) { setToken(''); setResources([]); setStatus({ kind: 'error', text: 'Connection failed' }); setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function loadProperties() {
    if (!token || !selectedResource) return; setBusy(true);
    try { const url = `https://127.0.0.1:8383/cm-rest/v1/activation-logic/resources/${encodeURIComponent(selectedResource)}/properties`; setPropertiesText(JSON.stringify(parseJson(await remoteCurl(`curl -ksS --fail-with-body -H ${shellQuote(`Authorization: Bearer ${token}`)} ${shellQuote(url)}`)), null, 2)); setMessage('Properties loaded. Edit the JSON and save when ready.'); }
    catch (error) { setMessage(`Properties failed: ${error.message}`); } finally { setBusy(false); }
  }

  function update(setter, key, value) { setter((current) => ({ ...current, [key]: value })); }
  return (
    <section className="eda-card">
      <div className="card-toolbar"><div className="field-group"><label>EDA SITE</label><select value={site} onChange={(e) => { setSite(e.target.value); setStatus({ kind: 'disconnected', text: 'Disconnected' }); setToken(''); setResources([]); }}><option value="HO">HO</option><option value="DC">DC</option></select></div><div className="endpoint"><span className={`online-dot ${status.kind}`} /> {site}-EDA <span className="muted">{host}:8383</span></div><button className="primary-button" onClick={connect} disabled={busy}>{busy ? 'Working…' : 'Connect & load resources'}</button></div>
      <div className="credentials-section"><div className="section-title"><div><h2>Secure connection</h2><p>OAuth token: POST form grant; resource and property retrieval: GET with Bearer token.</p></div><span className={`connection-badge ${status.kind}`}><span className="status-dot" />{status.text}</span></div><div className="credentials-grid"><div className="credential-card"><h3>SSH bastion credentials</h3><input placeholder="SSH username" value={ssh.username} onChange={(e) => update(setSsh, 'username', e.target.value)} /><input placeholder="SSH password" type="password" value={ssh.password} onChange={(e) => update(setSsh, 'password', e.target.value)} /></div><div className="credential-card"><h3>EDA API credentials</h3><input placeholder="EDA username" value={eda.username} onChange={(e) => update(setEda, 'username', e.target.value)} /><input placeholder="EDA password" type="password" value={eda.password} onChange={(e) => update(setEda, 'password', e.target.value)} /><input placeholder="OAuth client ID" value={eda.clientId} onChange={(e) => update(setEda, 'clientId', e.target.value)} /><input placeholder="OAuth client secret" type="password" value={eda.clientSecret} onChange={(e) => update(setEda, 'clientSecret', e.target.value)} /></div></div><div className="message" role="status">{message}</div></div>
      <div className="resource-section"><div className="section-title"><div><h2>Resource backup & update</h2><p>Select a resource, retrieve its properties, edit the JSON, and PATCH it back.</p></div></div><div className="resource-grid"><div className="field-group"><label>RESOURCE</label><select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)} disabled={!resources.length}><option value="">{resources.length ? 'Select an EDA resource' : 'Connect to load resources'}</option>{resources.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><button className="primary-button" onClick={loadProperties} disabled={!token || !selectedResource || busy}>View properties</button></div></div>
      {propertiesText ? <div className="properties-editor"><div className="editor-heading"><div><h2>Properties editor</h2><p>Edit JSON and use the PATCH workflow after adding remote-backup support.</p></div></div><textarea aria-label="Resource properties JSON" value={propertiesText} onChange={(e) => setPropertiesText(e.target.value)} spellCheck="false" /></div> : <div className="empty-state"><div className="empty-icon">⌁</div><h3>No properties loaded</h3><p>Connect, select a resource, then click View properties.</p></div>}
    </section>
  );
}
