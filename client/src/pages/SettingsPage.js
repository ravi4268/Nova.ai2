import React from 'react';
import Topbar from '../components/Topbar';

function SettingsPage() {
  return (
    <div className="main-panel">
      <Topbar title="Settings" subtitle="Customize your workspace" />
      <div className="card-list">
        <div className="info-card">Theme: Dark</div>
        <div className="info-card">Language: English</div>
        <div className="info-card">Notifications: Enabled</div>
      </div>
    </div>
  );
}

export default SettingsPage;
