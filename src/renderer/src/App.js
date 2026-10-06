import React, { useState } from 'react';
import './App.css';
import EdaTab from './components/EdaTab';
import CisTab from './components/CisTab';
import latroLogo from './assets/latro-logo.svg';

function LatroMark() {
  return (
    <img src={latroLogo} alt="LATRO" className="brand-logo" />
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('eda');
  const win = (typeof window !== 'undefined' && window.latroApi && window.latroApi.windowControl) ? window.latroApi.windowControl : null;

  const tabs = [
    { id: 'eda', label: 'EDA', icon: '◈', component: <EdaTab />, heading: 'EDA Operations', subtitle: 'Monitor and manage Benin EDA resources.' },
    { id: 'cis', label: 'CIS', icon: '◎', component: <CisTab />, heading: 'CIS Operations', subtitle: 'MSISDN investigation and server operations.' },
    { id: 'ngvs', label: 'NGVS', icon: '◇', component: null, comingSoon: true, heading: 'NGVS', subtitle: 'Coming soon.' }
  ];

  const current = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="brand">
          <LatroMark />
          <span className="brand-divider" />
          <span className="brand-name">LATRO Base</span>
        </div>
        <div className="window-controls" aria-label="Window controls">
          <span className="window-button minimize" onClick={() => win?.minimize()}>−</span>
          <span className="window-button maximize" onClick={() => win?.maximize()}>□</span>
          <span className="window-button close" onClick={() => win?.close()}>×</span>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-label">OPERATIONS</div>

          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''} ${tab.comingSoon ? 'coming-soon-item' : ''}`}
              onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
              role="button"
              tabIndex={tab.comingSoon ? -1 : 0}
              onKeyDown={(e) => {
                if (!tab.comingSoon && (e.key === 'Enter' || e.key === ' ')) setActiveTab(tab.id);
              }}
            >
              <span className="nav-icon">{tab.icon}</span>
              {tab.label}
              {tab.comingSoon && <span className="coming-soon">Soon</span>}
            </div>
          ))}

          <div className="sidebar-footer">v0.1.0 · Benin</div>
        </aside>

        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">LATRO BASE / {current.label}</div>
              <h1>{current.heading}</h1>
              <p>{current.subtitle}</p>
            </div>
            {current.id === 'eda' && (
              <div className="status-pill"><span className="status-dot" /> SSH bastion mode</div>
            )}
          </div>

          {current.id === 'eda' && <EdaTab />}
          {current.id === 'cis' && <CisTab />}
          {current.id === 'ngvs' && <div className="coming-soon-panel">Coming soon.</div>}
        </main>
      </div>
    </div>
  );
}
