import React, { useEffect, useState } from "react";
import "./SettingsPage.css";

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("novaDarkMode") !== "false";
  });

  const [aiAssistant, setAiAssistant] = useState(() => {
    return localStorage.getItem("novaAIAssistant") !== "false";
  });

  // Dark Mode
  useEffect(() => {
    localStorage.setItem("novaDarkMode", darkMode);

    if (darkMode) {
      document.body.classList.add("nova-dark");
      document.body.classList.remove("nova-light");
    } else {
      document.body.classList.add("nova-light");
      document.body.classList.remove("nova-dark");
    }
  }, [darkMode]);

  // AI Assistant
  useEffect(() => {
    localStorage.setItem("novaAIAssistant", aiAssistant);

    // App ke dusre components ko setting batane ke liye
    window.dispatchEvent(
      new CustomEvent("nova-ai-setting", {
        detail: {
          enabled: aiAssistant,
        },
      })
    );
  }, [aiAssistant]);

  return (
    <div className="settings-page">

      {/* Header */}
      <div className="settings-header">
        <div className="settings-icon">⚙️</div>

        <h1>Settings</h1>

        <p>Manage your Nova.AI preferences.</p>
      </div>

      {/* Settings Cards */}
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
              aria-label="Toggle Dark Mode"
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
              aria-label="Toggle AI Assistant"
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