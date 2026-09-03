import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./styles.css";

import Library from "./pages/Library";
import Images from "./pages/Images";
import Subscription from "./pages/Subscription";

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:5001");

function App() {
  // =========================================
  // LOGIN
  // =========================================

  const [isLoggedIn, setIsLoggedIn] =
    useState(
      localStorage.getItem("isLoggedIn") ===
        "true"
    );

  // =========================================
  // NAVIGATION
  // =========================================

  const [page, setPage] =
    useState("chat");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [currentPlan, setCurrentPlan] =
    useState(() => localStorage.getItem("novaPlan") || "Free");

  const activatePlan = (planName) => {
    setCurrentPlan(planName);
    localStorage.setItem("novaPlan", planName);
  };

  // =========================================
  // CHAT
  // =========================================

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            "novaMessages"
          );

        return saved
          ? JSON.parse(saved)
          : [];
      } catch {
        return [];
      }
    });

  const [sending, setSending] =
    useState(false);

  const [backendError, setBackendError] =
    useState("");

  // =========================================
  // FILE / IMAGE
  // =========================================

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [preview, setPreview] =
    useState(null);

  const imageInputRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const textareaRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  // =========================================
  // SAVE CHAT
  // =========================================

  useEffect(() => {
    localStorage.setItem(
      "novaMessages",
      JSON.stringify(messages)
    );
  }, [messages]);

  // =========================================
  // AUTO SCROLL
  // =========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  // =========================================
  // NAVIGATION
  // =========================================

  const navigateTo = (targetPage) => {
    setPage(targetPage);
    setSidebarOpen(false);
  };

  // =========================================
  // LOGIN
  // =========================================

  const login = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "isLoggedIn",
      "true"
    );

    setIsLoggedIn(true);
    setPage("chat");
  };

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {
    localStorage.removeItem(
      "isLoggedIn"
    );

    setIsLoggedIn(false);
    setSidebarOpen(false);
    setPage("chat");
  };

  // =========================================
  // NEW CHAT
  // =========================================

  const newChat = () => {
    setMessages([]);
    setMessage("");

    setSelectedImage(null);
    setSelectedFile(null);
    setPreview(null);

    setBackendError("");

    localStorage.removeItem(
      "novaMessages"
    );

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setPage("chat");
    setSidebarOpen(false);
  };

  // =========================================
  // IMAGE SELECT
  // =========================================

  const handleImageSelect = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      alert(
        "Please select an image file."
      );
      return;
    }

    setSelectedImage(file);
    setSelectedFile(null);

    const imageUrl =
      URL.createObjectURL(file);

    setPreview(imageUrl);
  };

  // =========================================
  // FILE SELECT
  // =========================================

  const handleFileSelect = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setSelectedImage(null);
    setPreview(null);
  };

  // =========================================
  // REMOVE ATTACHMENT
  // =========================================

  const removeAttachment = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setPreview(null);

    if (imageInputRef.current) {
      imageInputRef.current.value =
        "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };

  // =========================================
  // SEND MESSAGE
  // =========================================

  const sendMessage = async () => {
    const cleanMessage =
      message.trim();

    if (
      !cleanMessage &&
      !selectedImage &&
      !selectedFile
    ) {
      return;
    }

    if (sending) {
      return;
    }

    const imageToSend =
      selectedImage;

    const fileToSend =
      selectedFile;

    // =======================================
    // KEEP OLD HISTORY BEFORE ADDING MESSAGE
    // =======================================

    const oldMessages =
      [...messages];

    // =======================================
    // TEMP USER MESSAGE
    // =======================================

    const tempMessage = {
      id: Date.now(),

      user: cleanMessage,

      ai: "Thinking...",

      imagePreview:
        imageToSend
          ? URL.createObjectURL(
              imageToSend
            )
          : null,

      imageName:
        imageToSend
          ? imageToSend.name
          : null,

      fileName:
        fileToSend
          ? fileToSend.name
          : null,

      imageUrl: null,

      uploadedFileUrl: null,

      uploadedFileName: null,
    };

    setMessages((prev) => [
      ...prev,
      tempMessage,
    ]);

    // =======================================
    // CLEAR INPUT
    // =======================================

    setMessage("");

    setSelectedImage(null);
    setSelectedFile(null);
    setPreview(null);

    if (imageInputRef.current) {
      imageInputRef.current.value =
        "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }

    setSending(true);
    setBackendError("");

    // =======================================
    // BUILD HISTORY FOR AI
    // =======================================

    const history =
      oldMessages.map((item) => ({
        role:
          item.user
            ? "user"
            : "assistant",

        content:
          item.user ||
          item.ai ||
          "",
      }));

    try {
      // =====================================
      // FORM DATA
      // =====================================

      const formData =
        new FormData();

      formData.append(
        "message",
        cleanMessage
      );

      // IMPORTANT:
      // Previous conversation
      // is sent to backend.

      formData.append(
        "history",
        JSON.stringify(history)
      );

      // =====================================
      // IMAGE
      // =====================================

      if (imageToSend) {
        formData.append(
          "image",
          imageToSend
        );
      }

      // =====================================
      // FILE
      // =====================================

      if (fileToSend) {
        formData.append(
          "file",
          fileToSend
        );
      }

      // =====================================
      // API REQUEST
      // =====================================

      const response =
        await fetch(
          `${API_URL}/api/chat`,
          {
            method: "POST",

            body: formData,
          }
        );

      // =====================================
      // READ RESPONSE
      // =====================================

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.reply ||
            `Server error: ${response.status}`
        );
      }

      // =====================================
      // UPDATE LAST MESSAGE
      // =====================================

      setMessages((prev) => {
        const updated =
          [...prev];

        const lastIndex =
          updated.length - 1;

        if (lastIndex < 0) {
          return prev;
        }

        updated[lastIndex] = {
          ...updated[lastIndex],

          ai:
            data.reply ||
            "Nova AI could not generate a response.",

          imageUrl:
            data.image?.url ||
            null,

          uploadedFileUrl:
            data.file?.url ||
            null,

          uploadedFileName:
            data.file?.name ||
            null,
        };

        return updated;
      });
    } catch (error) {
      console.error(
        "Nova AI Error:",
        error
      );

      setBackendError(
        "AI connection failed. Make sure backend is running on port 5001."
      );

      // =====================================
      // SHOW ERROR IN CHAT
      // =====================================

      setMessages((prev) => {
        const updated =
          [...prev];

        const lastIndex =
          updated.length - 1;

        if (lastIndex < 0) {
          return prev;
        }

        updated[lastIndex] = {
          ...updated[lastIndex],

          ai:
            "⚠️ Nova AI backend is not connected. Please start your backend with `node server.js` and check your OPENAI_API_KEY.",
        };

        return updated;
      });
    } finally {
      setSending(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // =========================================
  // ENTER TO SEND
  // =========================================

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      sendMessage();
    }
  };

  // =========================================
  // QUICK PROMPT
  // =========================================

  const useSuggestion = (text) => {
    setMessage(text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // =========================================
  // LOGIN SCREEN
  // =========================================

  if (!isLoggedIn) {
    return (
      <div className="login-screen">

        <div className="login-card">

          <div className="login-logo">

            <div className="logo-box">
              N
            </div>

            <div>
              <h1>
                Nova<span>.AI</span>
              </h1>

              <p>
                Intelligent Assistant
              </p>
            </div>

          </div>

          <h2>
            Welcome Back 👋
          </h2>

          <p className="login-subtitle">
            Login to continue to
            Nova AI
          </p>

          <form onSubmit={login}>

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              required
            />

            <button
              type="submit"
              className="login-button"
            >
              Login to Nova AI →
            </button>

          </form>

          <p className="powered">
            ⚡ Powered by Nova.AI
          </p>

        </div>

      </div>
    );
  }

  // =========================================
  // MAIN APP
  // =========================================

  return (
    <div className="website">

      {/* =====================================
          MOBILE OVERLAY
      ===================================== */}

      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "open"
            : ""
        }`}
      >

        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            N
          </div>

          <h2>
            Nova<span>.AI</span>
          </h2>

        </div>

        {/* NEW CHAT */}

        <button
          type="button"
          className="new-chat"
          onClick={newChat}
        >
          ＋ New Chat
        </button>

        {/* NAVIGATION */}

        <div className="navigation">

          <button
            type="button"
            className={
              page === "chat"
                ? "selected"
                : ""
            }
            onClick={() =>
              navigateTo("chat")
            }
          >
            💬
            <span>
              Chat
            </span>
          </button>

          <button
            type="button"
            className={
              page === "history"
                ? "selected"
                : ""
            }
            onClick={() =>
              navigateTo("history")
            }
          >
            🕘
            <span>
              History
            </span>
          </button>

          <button
            type="button"
            className={
              page === "images"
                ? "selected"
                : ""
            }
            onClick={() =>
              navigateTo("images")
            }
          >
            🖼️
            <span>
              Images
            </span>
          </button>

          <button
            type="button"
            className={
              page === "library"
                ? "selected"
                : ""
            }
            onClick={() =>
              navigateTo("library")
            }
          >
            📚
            <span>
              Library
            </span>
          </button>

          <button
            type="button"
            className={
              page ===
              "subscription"
                ? "selected"
                : ""
            }
            onClick={() =>
              navigateTo(
                "subscription"
              )
            }
          >
            💳
            <span>
              Subscription
            </span>
          </button>

          <button
            type="button"
            className={
              page === "settings"
                ? "selected"
                : ""
            }
            onClick={() =>
              navigateTo("settings")
            }
          >
            ⚙️
            <span>
              Settings
            </span>
          </button>

        </div>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <div className="profile">

            <div className="avatar">
              U
            </div>

            <div>
              <strong>
                User
              </strong>

              <small>
                {currentPlan} Plan
              </small>
            </div>

          </div>

          <button
            type="button"
            className="logout"
            onClick={logout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* =====================================
          MAIN
      ===================================== */}

      <div className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <button
            type="button"
            className="hamburger"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >
            ☰
          </button>

          <div className="top-title">

            <strong>
              Nova AI
            </strong>

            <small>
              Intelligent Assistant
            </small>

          </div>

          <button
            type="button"
            className="top-logout"
            onClick={logout}
          >
            Logout
          </button>

        </header>

        {/* BACKEND ERROR */}

        {backendError && (
          <div className="backend-error">
            ❌ {backendError}
          </div>
        )}

        {/* ===================================
            CONTENT
        =================================== */}

        <main className="content">

          {/* =================================
              CHAT
          ================================= */}

          {page === "chat" && (
            <div className="chat">

              {/* CHAT HEADER */}

              <div className="chat-title">

                <div className="ai-icon">
                  ✨
                </div>

                <div>

                  <h2>
                    How can I help you?
                  </h2>

                  <p>
                    Ask Nova AI anything
                  </p>

                </div>

              </div>

              {/* =================================
                  WELCOME
              ================================= */}

              {messages.length === 0 ? (
                <div className="welcome">

                  <div className="big-icon">
                    ✨
                  </div>

                  <h1>
                    Welcome to Nova AI
                  </h1>

                  <p>
                    Your intelligent AI
                    assistant is ready
                    to help you.
                  </p>

                  <div className="suggestions">

                    <button
                      type="button"
                      onClick={() =>
                        useSuggestion(
                          "Explain JavaScript in simple words with examples."
                        )
                      }
                    >
                      💡 Explain JavaScript
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        useSuggestion(
                          "Create a complete responsive React website."
                        )
                      }
                    >
                      ⚛️ Create React Website
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        useSuggestion(
                          "Give me some interesting software project ideas."
                        )
                      }
                    >
                      🚀 Project Ideas
                    </button>

                  </div>

                </div>

              ) : (

                /* =================================
                   MESSAGES
                ================================= */

                <div className="messages">

                  {messages.map(
                    (item) => (
                      <div
                        className="message-group"
                        key={item.id}
                      >

                        {/* USER */}

                        <div className="user-message">

                          <div className="message-avatar">
                            U
                          </div>

                          <div className="message-content">

                            {item.user && (
                              <div className="message-text">
                                {item.user}
                              </div>
                            )}

                            {item.imagePreview && (
                              <div className="uploaded-image-box">

                                <img
                                  src={
                                    item.imageUrl ||
                                    item.imagePreview
                                  }
                                  alt="Uploaded"
                                />

                                {item.imageName && (
                                  <small>
                                    🖼️{" "}
                                    {
                                      item.imageName
                                    }
                                  </small>
                                )}

                              </div>
                            )}

                            {item.fileName && (
                              <div className="file-preview">
                                📎{" "}
                                {item.fileName}
                              </div>
                            )}

                          </div>

                        </div>

                        {/* AI */}

                        <div className="ai-message">

                          <div className="message-avatar nova">
                            ✨
                          </div>

                          <div className="message-content">

                            <div
                              className={`message-text ${
                                item.ai ===
                                "Thinking..."
                                  ? "thinking"
                                  : ""
                              }`}
                            >

                              {item.ai ===
                              "Thinking..." ? (
                                <div className="typing">

                                  <span />
                                  <span />
                                  <span />

                                </div>
                              ) : (
                                item.ai
                              )}

                            </div>

                            {item.imageUrl && (
                              <div className="backend-image">

                                <img
                                  src={
                                    item.imageUrl
                                  }
                                  alt="AI"
                                />

                              </div>
                            )}

                            {item.uploadedFileUrl && (
                              <a
                                href={
                                  item.uploadedFileUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="file-link"
                              >
                                📎 Open uploaded file
                              </a>
                            )}

                          </div>

                        </div>

                      </div>
                    )
                  )}

                  <div
                    ref={messagesEndRef}
                  />

                </div>
              )}

              {/* =================================
                  INPUT AREA
              ================================= */}

              <div className="input-area">

                {/* ATTACHMENT PREVIEW */}

                {(selectedImage ||
                  selectedFile) && (
                  <div className="attachment-preview">

                    {selectedImage && (
                      <div className="preview-card">

                        <img
                          src={preview}
                          alt="Preview"
                        />

                        <div>

                          <strong>
                            {
                              selectedImage.name
                            }
                          </strong>

                          <small>
                            Image ready
                          </small>

                        </div>

                        <button
                          type="button"
                          onClick={
                            removeAttachment
                          }
                        >
                          ×
                        </button>

                      </div>
                    )}

                    {selectedFile && (
                      <div className="file-selected">

                        <span>
                          📎
                        </span>

                        <div>

                          <strong>
                            {
                              selectedFile.name
                            }
                          </strong>

                          <small>
                            File ready
                          </small>

                        </div>

                        <button
                          type="button"
                          onClick={
                            removeAttachment
                          }
                        >
                          ×
                        </button>

                      </div>
                    )}

                  </div>
                )}

                {/* INPUT BOX */}

                <div className="input-box">

                  {/* IMAGE */}

                  <button
                    type="button"
                    className="attach-button"
                    onClick={() =>
                      imageInputRef.current?.click()
                    }
                  >
                    🖼️
                  </button>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={
                      handleImageSelect
                    }
                  />

                  {/* FILE */}

                  <button
                    type="button"
                    className="attach-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    📎
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={
                      handleFileSelect
                    }
                  />

                  {/* TEXTAREA */}

                  <textarea
                    ref={textareaRef}
                    value={message}
                    placeholder="Message Nova AI..."
                    onChange={(e) =>
                      setMessage(
                        e.target.value
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                    rows="1"
                  />

                  {/* SEND */}

                  <button
                    type="button"
                    className="send-button"
                    onClick={
                      sendMessage
                    }
                    disabled={
                      sending ||
                      (
                        !message.trim() &&
                        !selectedImage &&
                        !selectedFile
                      )
                    }
                  >
                    {sending
                      ? "..."
                      : "➤"}
                  </button>

                </div>

                <small className="input-note">
                  🖼️ Image
                  &nbsp;&nbsp;
                  📎 File
                  &nbsp; • &nbsp;
                  Enter to send
                </small>

              </div>

            </div>
          )}

          {/* =================================
              HISTORY
          ================================= */}

          {page === "history" && (
            <div className="page">

              <div className="page-icon">
                🕘
              </div>

              <h1>
                Chat History
              </h1>

              <p>
                Your previous conversations.
              </p>

              {messages.length ===
              0 ? (
                <div className="empty">
                  No chat history yet.
                </div>
              ) : (
                <div className="history-list">

                  {messages.map(
                    (item) => (
                      <div
                        className="history-card"
                        key={item.id}
                      >

                        <strong>
                          {item.user ||
                            "Image/File message"}
                        </strong>

                        <p>
                          {item.ai}
                        </p>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>
          )}

          {/* =================================
              IMAGES
          ================================= */}

          {page === "images" && (
            <Images />
          )}

          {/* =================================
              LIBRARY
          ================================= */}

          {page === "library" && (
            <Library />
          )}

          {/* =================================
              SUBSCRIPTION
          ================================= */}

          {page ===
            "subscription" && (
            <Subscription onPlanActivated={activatePlan} />
          )}

          {/* =================================
              SETTINGS
          ================================= */}

          {page === "settings" && (
            <div className="page">

              <div className="page-icon">
                ⚙️
              </div>

              <h1>
                Settings
              </h1>

              <p>
                Manage your Nova.AI
                preferences.
              </p>

              <div className="setting">

                <div>

                  <strong>
                    Dark Mode
                  </strong>

                  <small>
                    Nova AI dark interface
                  </small>

                </div>

                <span>
                  ON
                </span>

              </div>

              <div className="setting">

                <div>

                  <strong>
                    AI Assistant
                  </strong>

                  <small>
                    Enable AI responses
                  </small>

                </div>

                <span>
                  ON
                </span>

              </div>

            </div>
          )}

        </main>

      </div>

    </div>
  );
}

export default App;