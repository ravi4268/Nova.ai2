import React, { useState } from "react";
import "./SettingsPage.css";

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [aiAssistant, setAiAssistant] = useState(true);

  return (
    <div className="settings-page">

      <div className="settings-header">
        <div className="settings-icon">⚙️</div>

        <h1>Settings</h1>

        <p>Manage your Nova.AI preferences.</p>
      </div>

      <div className="settings-list">

        {/* Dark Mode */}
        <div className="settings-card">

          <div className="settings-content">
            <h3>Dark Mode</h3>
            <span>Nova AI dark interface</span>
          </div>

          <div className="settings-action">

            <span className={darkMode ? "status-on" : "status-off"}>
              {darkMode ? "ON" : "OFF"}
            </span>

            <button
              className={`toggle ${darkMode ? "active" : ""}`}
              onClick={() => setDarkMode(!darkMode)}
            >
              <span className="toggle-circle"></span>
            </button>

          </div>
        </div>

        {/* AI Assistant */}
        <div className="settings-card">

          <div className="settings-content">
            <h3>AI Assistant</h3>
            <span>Enable AI responses</span>
          </div>

          <div className="settings-action">

            <span className={aiAssistant ? "status-on" : "status-off"}>
              {aiAssistant ? "ON" : "OFF"}
            </span>

            <button
              className={`toggle ${aiAssistant ? "active" : ""}`}
              onClick={() => setAiAssistant(!aiAssistant)}
            >
              <span className="toggle-circle"></span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsPage;