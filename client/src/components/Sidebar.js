import React from "react";
import {
  FaHome,
  FaHistory,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";

import "./Sidebar.css";

function Sidebar({ open, setPage, handleLogout }) {

  return (
    <aside className={`sidebar ${open ? "active" : ""}`}>

      <div className="sidebar-menu">

        {/* Home */}
        <div
          className="sidebar-item"
          onClick={() => setPage("dashboard")}
        >
          <FaHome />
          <span>Home</span>
        </div>

        {/* History */}
        <div
          className="sidebar-item"
          onClick={() => setPage("history")}
        >
          <FaHistory />
          <span>History</span>
        </div>

        {/* Settings */}
        <div
          className="sidebar-item"
          onClick={() => setPage("settings")}
        >
          <FaCog />
          <span>Settings</span>
        </div>

        {/* Logout */}
        <div
          className="sidebar-item logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;