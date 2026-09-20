import React, { useState } from 'react';
import './EdaTab.css';

export default function EdaTab() {
  const [site, setSite] = useState('HO');
  const [resource, setResource] = useState('');
  const resources = ['Select an EDA resource', 'PCRFSUB Resource Provisioning', 'LTESUB Benin Provisioning', 'HSS Provisioning EPS'];
  const host = site === 'HO' ? '10.77.85.74' : '10.77.85.72';

  return (
    <section className="eda-card">
      <div className="card-toolbar">
        <div className="field-group"><label>EDA SITE</label><select value={site} onChange={(e) => setSite(e.target.value)}><option>HO</option><option>DC</option></select></div>
        <div className="endpoint"><span className="online-dot" /> {site}-EDA <span className="muted">{host}:8383</span></div>
        <button className="secondary-button">Refresh resources</button>
      </div>
      <div className="resource-section">
        <div className="section-title"><div><h2>Resource backup & update</h2><p>Choose a resource to retrieve, back up, or update its properties.</p></div><span className="connection-badge">● Disconnected</span></div>
        <div className="resource-grid">
          <div className="field-group"><label>RESOURCE</label><select value={resource} onChange={(e) => setResource(e.target.value)}>{resources.map((item) => <option key={item} value={item === resources[0] ? '' : item}>{item}</option>)}</select></div>
          <button className="primary-button" disabled={!resource}>View properties</button>
          <button className="secondary-button" disabled={!resource}>Backup to remote /tmp</button>
        </div>
      </div>
      <div className="empty-state"><div className="empty-icon">⌁</div><h3>No resource selected</h3><p>Select an EDA resource above to view its properties.</p></div>
    </section>
  );
}
