import React, { useState } from "react";
import {
  FaCog,
  FaBell,
  FaMoon,
  FaUser,
  FaSave
} from "react-icons/fa";

import "./Settings.css";

function Settings() {

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSave = () => {
    localStorage.setItem(
      "settings",
      JSON.stringify({
        notifications,
        darkMode
      })
    );

    alert("Settings Saved Successfully!");
  };

  return (
    <div className="settings-page">

      <div className="settings-header">

        <h1>
          <FaCog />
          Settings
        </h1>

        <p>
          Manage your account and application preferences
        </p>

      </div>


      <div className="settings-grid">

        {/* Profile */}

        <div className="settings-card">

          <div className="settings-card-icon">
            <FaUser />
          </div>

          <div className="settings-card-content">

            <h3>Profile</h3>

            <p>
              Manage your profile information
            </p>

            <input
              type="text"
              placeholder="Your Name"
            />

            <input
              type="email"
              placeholder="Email Address"
            />

          </div>

        </div>


        {/* Notifications */}

        <div className="settings-card">

          <div className="settings-card-icon">
            <FaBell />
          </div>

          <div className="settings-card-content">

            <h3>Notifications</h3>

            <p>
              Enable or disable notifications
            </p>

            <label className="switch">

              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) =>
                  setNotifications(e.target.checked)
                }
              />

              <span className="slider"></span>

            </label>

          </div>

        </div>


        {/* Appearance */}

        <div className="settings-card">

          <div className="settings-card-icon">
            <FaMoon />
          </div>

          <div className="settings-card-content">

            <h3>Appearance</h3>

            <p>
              Choose your application theme
            </p>

            <label className="switch">

              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) =>
                  setDarkMode(e.target.checked)
                }
              />

              <span className="slider"></span>

            </label>

          </div>

        </div>

      </div>


      <button
        className="save-settings"
        onClick={handleSave}
      >
        <FaSave />
        Save Settings
      </button>

    </div>
  );
}

export default Settings;