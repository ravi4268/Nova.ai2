import React from 'react';
import Topbar from '../components/Topbar';

function HistoryPage() {
  return (
    <div className="main-panel">
      <Topbar title="History" subtitle="Recent conversations" />
      <div className="card-list">
        <div className="info-card">Project planning summary</div>
        <div className="info-card">React bug fix discussion  </div>
        <div className="info-card">Travel itinerary ideas</div>
      </div>
    </div>
  );
}

export default HistoryPage;
