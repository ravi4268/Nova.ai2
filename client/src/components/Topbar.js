import React from "react";
import "./Topbar.css";

function Topbar({ onMenuClick, onLogout }) {
  return (
    <div className="topbar">
      <button className="menu-btn" onClick={onMenuClick}>
        ⋮
      </button>

      <div className="topbar-title">
        <span>✦</span>
        Nova AI
      </div>

      <button className="top-logout" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Topbar;