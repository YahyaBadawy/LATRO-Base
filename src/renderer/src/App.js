import React from 'react';
import './App.css';
import EdaTab from './components/EdaTab';

export default function App() {
  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="brand">
          <img src="/latro-logo.svg" alt="LATRO" className="brand-logo" />
          <span className="brand-divider" />
          <span className="brand-name">LATRO Base</span>
        </div>
        <div className="window-controls" aria-label="Window controls">
          <span className="window-button minimize">−</span>
          <span className="window-button maximize">□</span>
          <span className="window-button close">×</span>
        </div>
      </header>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-label">OPERATIONS</div>
          <div className="nav-item active"><span className="nav-icon">◈</span> EDA</div>
          <div className="nav-item"><span className="nav-icon">◎</span> CIS <span className="coming-soon">Soon</span></div>
          <div className="nav-item"><span className="nav-icon">◇</span> NGVS <span className="coming-soon">Soon</span></div>
          <div className="sidebar-footer">v0.1.0 · Benin</div>
        </aside>
        <main className="content">
          <div className="page-heading">
            <div><div className="eyebrow">LATRO BASE / EDA</div><h1>EDA Operations</h1><p>Monitor and manage Benin EDA resources.</p></div>
            <div className="status-pill"><span className="status-dot" /> SSH bastion mode</div>
          </div>
          <EdaTab />
        </main>
      </div>
    </div>
  );
}
