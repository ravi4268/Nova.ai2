import React, { useState } from "react";
import "./Settings.css";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [aiAssistant, setAiAssistant] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [chatHistory, setChatHistory] = useState(true);

  const SettingItem = ({
    icon,
    title,
    description,
    value,
    setValue,
  }) => {
    return (
      <div className="setting-card">
        <div className="setting-left">
          <div className="setting-icon">{icon}</div>

          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>

        <button
          className={`toggle ${value ? "active" : ""}`}
          onClick={() => setValue(!value)}
          aria-label={`Toggle ${title}`}
        >
          <span></span>
        </button>
      </div>
    );
  };

  return (
    <div className="settings-page">

      {/* Header */}
      <div className="settings-header">
        <div className="settings-logo">⚙️</div>

        <div>
          <h1>Settings</h1>
          <p>Manage your Nova.AI preferences and experience.</p>
        </div>
      </div>

      {/* Appearance */}
      <section className="settings-section">
        <div className="section-title">
          <span>🎨</span>
          <div>
            <h2>Appearance</h2>
            <p>Customize how Nova.AI looks.</p>
          </div>
        </div>

        <SettingItem
          icon="🌙"
          title="Dark Mode"
          description="Use Nova.AI dark interface"
          value={darkMode}
          setValue={setDarkMode}
        />
      </section>

      {/* AI */}
      <section className="settings-section">
        <div className="section-title">
          <span>🤖</span>
          <div>
            <h2>AI Preferences</h2>
            <p>Control your AI assistant experience.</p>
          </div>
        </div>

        <SettingItem
          icon="✨"
          title="AI Assistant"
          description="Enable intelligent AI responses"
          value={aiAssistant}
          setValue={setAiAssistant}
        />

        <SettingItem
          icon="🔔"
          title="Notifications"
          description="Receive notifications from Nova.AI"
          value={notifications}
          setValue={setNotifications}
        />

        <SettingItem
          icon="💬"
          title="Chat History"
          description="Save your conversations automatically"
          value={chatHistory}
          setValue={setChatHistory}
        />
      </section>

      {/* AI Response */}
      <section className="settings-section">
        <div className="section-title">
          <span>⚡</span>
          <div>
            <h2>AI Response</h2>
            <p>Configure your assistant behavior.</p>
          </div>
        </div>

        <div className="response-box">
          <div>
            <h3>Response Style</h3>
            <p>Choose how Nova.AI communicates with you.</p>
          </div>

          <select defaultValue="balanced">
            <option value="balanced">Balanced</option>
            <option value="creative">Creative</option>
            <option value="precise">Precise</option>
            <option value="short">Short & Simple</option>
          </select>
        </div>
      </section>

      {/* Account */}
      <section className="settings-section">
        <div className="section-title">
          <span>👤</span>
          <div>
            <h2>Account</h2>
            <p>Your Nova.AI account information.</p>
          </div>
        </div>

        <div className="account-card">
          <div className="avatar">N</div>

          <div className="account-info">
            <h3>User</h3>
            <p>Free Plan</p>
          </div>

          <button className="manage-btn">
            Manage Account
          </button>
        </div>
      </section>

      <div className="settings-footer">
        <span>Nova.AI</span>
        <span>•</span>
        <span>Your preferences are saved automatically</span>
      </div>

    </div>
  );
}