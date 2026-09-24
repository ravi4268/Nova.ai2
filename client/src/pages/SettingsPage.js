import React, {
  useEffect,
  useState,
} from "react";

import "./SettingsPage.css";

function SettingsPage() {
  // =====================================================
  // DARK MODE
  // =====================================================

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem(
        "novaDarkMode"
      ) !== "false"
    );
  });

  // =====================================================
  // AI ASSISTANT
  // =====================================================

  const [aiAssistant, setAiAssistant] =
    useState(() => {
      return (
        localStorage.getItem(
          "novaAIAssistant"
        ) !== "false"
      );
    });

  // =====================================================
  // DARK MODE EFFECT
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "novaDarkMode",
      String(darkMode)
    );

    if (darkMode) {
      document.body.classList.add(
        "nova-dark"
      );

      document.body.classList.remove(
        "nova-light"
      );
    } else {
      document.body.classList.add(
        "nova-light"
      );

      document.body.classList.remove(
        "nova-dark"
      );
    }
  }, [darkMode]);

  // =====================================================
  // AI SETTING EFFECT
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "novaAIAssistant",
      String(aiAssistant)
    );

    window.dispatchEvent(
      new CustomEvent(
        "nova-ai-setting",
        {
          detail: {
            enabled: aiAssistant,
          },
        }
      )
    );
  }, [aiAssistant]);

  // =====================================================
  // AI TOGGLE
  // =====================================================

  const toggleAI = () => {
    const newValue =
      !aiAssistant;

    // Save immediately
    localStorage.setItem(
      "novaAIAssistant",
      String(newValue)
    );

    setAiAssistant(newValue);

    // ChatPage immediately update
    window.dispatchEvent(
      new CustomEvent(
        "nova-ai-setting",
        {
          detail: {
            enabled: newValue,
          },
        }
      )
    );

    // OFF alert
    if (!newValue) {
      window.alert(
        "AI Assistant is OFF.\n\nNew messages will not be sent until you turn it ON."
      );
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`settings-page ${
        darkMode
          ? "dark"
          : "light"
      }`}
    >

      {/* ==========================================
          HEADER
      =========================================== */}

      <div className="settings-header">

        <div className="settings-icon">
          ⚙️
        </div>

        <h1>
          Settings
        </h1>

        <p>
          Manage your Nova AI preferences.
        </p>

      </div>

      {/* ==========================================
          SETTINGS LIST
      =========================================== */}

      <div className="settings-list">

        {/* ========================================
            DARK MODE
        ========================================= */}

        <div className="settings-card">

          <div className="settings-content">

            <h3>
              Dark Mode
            </h3>

            <span>
              Nova AI dark interface
            </span>

          </div>

          <div className="settings-action">

            <span
              className={
                darkMode
                  ? "status-on"
                  : "status-off"
              }
            >
              {darkMode
                ? "ON"
                : "OFF"}
            </span>

            <button
              type="button"
              className={`toggle ${
                darkMode
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setDarkMode(
                  (prev) => !prev
                )
              }
              aria-label="Toggle Dark Mode"
            >
              <span className="toggle-circle" />
            </button>

          </div>

        </div>

        {/* ========================================
            AI ASSISTANT
        ========================================= */}

        <div className="settings-card">

          <div className="settings-content">

            <h3>
              AI Assistant
            </h3>

            <span>
              Enable AI responses
            </span>

          </div>

          <div className="settings-action">

            <span
              className={
                aiAssistant
                  ? "status-on"
                  : "status-off"
              }
            >
              {aiAssistant
                ? "ON"
                : "OFF"}
            </span>

            <button
              type="button"
              className={`toggle ${
                aiAssistant
                  ? "active"
                  : ""
              }`}
              onClick={toggleAI}
              aria-label="Toggle AI Assistant"
            >
              <span className="toggle-circle" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default SettingsPage;