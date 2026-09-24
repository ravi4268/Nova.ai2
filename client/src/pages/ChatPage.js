import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./ChatPage.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:5001");

function ChatPage() {
  // =====================================================
  // STATES
  // =====================================================

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [image, setImage] = useState(null);

  const [file, setFile] = useState(null);

  const [backendError, setBackendError] = useState("");

  // AI Assistant ON / OFF
  const [aiAssistant, setAiAssistant] = useState(() => {
    return (
      localStorage.getItem("novaAIAssistant") !== "false"
    );
  });

  // =====================================================
  // REFS
  // =====================================================

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);

  const imageInputRef = useRef(null);

  const fileInputRef = useRef(null);

  // =====================================================
  // LOAD CHAT
  // =====================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "novaMessages"
      );

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setMessages(parsed);
      }
    } catch (error) {
      console.error(
        "Nova chat load error:",
        error
      );
    }
  }, []);

  // =====================================================
  // SAVE CHAT
  // =====================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "novaMessages",
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error(
        "Nova chat save error:",
        error
      );
    }
  }, [messages]);

  // =====================================================
  // LISTEN TO SETTINGS
  // =====================================================

  useEffect(() => {
    const handleAISetting = (event) => {
      const enabled =
        event.detail?.enabled;

      if (typeof enabled !== "boolean") {
        return;
      }

      setAiAssistant(enabled);

      // AI OFF
      if (!enabled) {
        setInput("");
        setImage(null);
        setFile(null);
        setBackendError("");

        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    window.addEventListener(
      "nova-ai-setting",
      handleAISetting
    );

    return () => {
      window.removeEventListener(
        "nova-ai-setting",
        handleAISetting
      );
    };
  }, []);

  // =====================================================
  // SCROLL
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // =====================================================
  // FRESH AI STATUS
  // =====================================================

  const isAIEnabled = () => {
    return (
      localStorage.getItem(
        "novaAIAssistant"
      ) !== "false"
    );
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async () => {
    // -----------------------------------------------
    // HARD CHECK
    // -----------------------------------------------

    const aiEnabled = isAIEnabled();

    if (!aiEnabled) {
      setAiAssistant(false);

      window.alert(
        "AI Assistant is OFF.\n\nPlease go to Settings and turn AI Assistant ON."
      );

      return;
    }

    // -----------------------------------------------
    // EMPTY CHECK
    // -----------------------------------------------

    if (
      !input.trim() &&
      !image &&
      !file
    ) {
      return;
    }

    // -----------------------------------------------
    // LOADING CHECK
    // -----------------------------------------------

    if (loading) {
      return;
    }

    setLoading(true);
    setBackendError("");

    // -----------------------------------------------
    // USER TEXT
    // -----------------------------------------------

    const userText =
      input.trim() ||
      (image
        ? "Please analyze this image."
        : file
        ? `Please analyze this file: ${file.name}`
        : "");

    const userId = Date.now();

    const aiId = userId + 1;

    // -----------------------------------------------
    // USER MESSAGE
    // -----------------------------------------------

    const userMessage = {
      id: userId,

      role: "user",

      content: userText,

      image: image
        ? URL.createObjectURL(image)
        : null,

      file: file
        ? file.name
        : null,
    };

    // -----------------------------------------------
    // THINKING MESSAGE
    // -----------------------------------------------

    const thinkingMessage = {
      id: aiId,

      role: "assistant",

      content: "Thinking...",
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      thinkingMessage,
    ]);

    setInput("");

    try {
      // ---------------------------------------------
      // SECOND HARD CHECK
      // ---------------------------------------------

      if (
        localStorage.getItem(
          "novaAIAssistant"
        ) === "false"
      ) {
        setMessages((prev) =>
          prev.filter(
            (item) =>
              item.id !== userId &&
              item.id !== aiId
          )
        );

        setLoading(false);

        return;
      }

      // ---------------------------------------------
      // FORM DATA
      // ---------------------------------------------

      const formData = new FormData();

      formData.append(
        "message",
        userText
      );

      // History
      formData.append(
        "history",
        JSON.stringify(
          messages.map((item) => ({
            role: item.role,
            content: item.content,
          }))
        )
      );

      // Image
      if (image) {
        formData.append(
          "image",
          image
        );
      }

      // File
      if (file) {
        formData.append(
          "file",
          file
        );
      }

      // ---------------------------------------------
      // FINAL CHECK BEFORE API
      // ---------------------------------------------

      if (
        localStorage.getItem(
          "novaAIAssistant"
        ) === "false"
      ) {
        setLoading(false);
        return;
      }

      // ---------------------------------------------
      // BACKEND API
      // ---------------------------------------------

      const response = await fetch(
        `${API_URL}/api/chat`,
        {
          method: "POST",
          body: formData,
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      // ---------------------------------------------
      // HTTP ERROR
      // ---------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.error ||
          `Backend error: ${response.status}`
        );
      }

      // ---------------------------------------------
      // API ERROR
      // ---------------------------------------------

      if (!data.success) {
        throw new Error(
          data.error ||
          "AI response failed."
        );
      }

      // ---------------------------------------------
      // AI RESPONSE
      // ---------------------------------------------

      setMessages((prev) =>
        prev.map((item) =>
          item.id === aiId
            ? {
                ...item,
                content:
                  data.reply ||
                  "Nova AI did not return a response.",
              }
            : item
        )
      );

    } catch (error) {
      console.error(
        "NOVA AI CHAT ERROR:",
        error
      );

      const errorText =
        error?.message ||
        "Failed to connect to Nova AI.";

      setBackendError(errorText);

      setMessages((prev) =>
        prev.map((item) =>
          item.id === aiId
            ? {
                ...item,
                content:
                  "⚠️ " +
                  errorText,
              }
            : item
        )
      );

    } finally {
      setLoading(false);

      setImage(null);
      setFile(null);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // =====================================================
  // ENTER
  // =====================================================

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      // Fresh setting check
      if (!isAIEnabled()) {
        window.alert(
          "AI Assistant is OFF.\n\nPlease enable it from Settings."
        );

        return;
      }

      sendMessage();
    }
  };

  // =====================================================
  // SUGGESTION
  // =====================================================

  const useSuggestion = (text) => {
    if (!isAIEnabled()) {
      window.alert(
        "AI Assistant is OFF.\n\nPlease enable it from Settings."
      );

      return;
    }

    setInput(text);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // =====================================================
  // IMAGE
  // =====================================================

  const handleImage = (e) => {
    if (!isAIEnabled()) {
      e.target.value = "";

      window.alert(
        "AI Assistant is OFF.\n\nPlease enable it from Settings."
      );

      return;
    }

    const selected =
      e.target.files?.[0];

    if (!selected) {
      return;
    }

    setImage(selected);
  };

  // =====================================================
  // FILE
  // =====================================================

  const handleFile = (e) => {
    if (!isAIEnabled()) {
      e.target.value = "";

      window.alert(
        "AI Assistant is OFF.\n\nPlease enable it from Settings."
      );

      return;
    }

    const selected =
      e.target.files?.[0];

    if (!selected) {
      return;
    }

    setFile(selected);
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeImage = () => {
    setImage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // =====================================================
  // REMOVE FILE
  // =====================================================

  const removeFile = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // CLEAR CHAT
  // =====================================================

  const clearChat = () => {
    setMessages([]);

    setInput("");

    setImage(null);

    setFile(null);

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

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const hasMessages =
    messages.length > 0;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="nova-page">

      <div className="nova-chat">

        {/* ==========================================
            AI OFF BANNER
        =========================================== */}

        {!aiAssistant && (
          <div className="ai-disabled-banner">
            ⚠️ AI Assistant is OFF — turn it ON
            from Settings to send messages.
          </div>
        )}

        {/* ==========================================
            MESSAGES
        =========================================== */}

        <main className="nova-messages">

          {!hasMessages ? (

            <div className="welcome-screen">

              <div className="welcome-icon">
                <span>✦</span>

                <span className="small-star">
                  ✦
                </span>
              </div>

              <h1>
                How can I help you?
              </h1>

              <p>
                Ask Nova AI anything
              </p>

              {!aiAssistant && (
                <div className="welcome-disabled">
                  ⚠️ AI Assistant is OFF.
                  <br />
                  Enable it from Settings
                  to start chatting.
                </div>
              )}

              {aiAssistant && (
                <div className="suggestions">

                  <button
                    onClick={() =>
                      useSuggestion(
                        "Explain JavaScript in simple words"
                      )
                    }
                  >
                    💡 Explain JavaScript
                  </button>

                  <button
                    onClick={() =>
                      useSuggestion(
                        "Create a React website for me"
                      )
                    }
                  >
                    ⚛️ Create React Website
                  </button>

                  <button
                    onClick={() =>
                      useSuggestion(
                        "Give me some project ideas"
                      )
                    }
                  >
                    🚀 Project Ideas
                  </button>

                </div>
              )}

            </div>

          ) : (

            <div className="conversation">

              {/* Conversation Header */}

              <div className="conversation-header">

                <span>
                  Nova AI
                </span>

                <button
                  type="button"
                  onClick={clearChat}
                >
                  🗑 Clear Chat
                </button>

              </div>

              {/* Messages */}

              {messages.map(
                (message) => (

                  <div
                    key={message.id}
                    className={
                      `chat-row ${
                        message.role
                      }`
                    }
                  >

                    {/* AI Avatar */}

                    {message.role ===
                      "assistant" && (

                      <div className="avatar ai-avatar">
                        ✦
                      </div>

                    )}

                    {/* Message */}

                    <div
                      className={
                        `chat-message ${
                          message.role
                        }`
                      }
                    >

                      <div className="message-author">
                        {message.role ===
                        "assistant"
                          ? "Nova AI"
                          : "You"}
                      </div>

                      <div className="message-content">
                        {message.content}
                      </div>

                      {/* Uploaded Image */}

                      {message.image && (
                        <img
                          src={message.image}
                          alt="uploaded"
                          className="message-image"
                        />
                      )}

                      {/* Uploaded File */}

                      {message.file && (
                        <div className="message-file">
                          📎{" "}
                          {message.file}
                        </div>
                      )}

                    </div>

                    {/* User Avatar */}

                    {message.role ===
                      "user" && (

                      <div className="avatar user-avatar">
                        U
                      </div>

                    )}

                  </div>
                )
              )}

              {/* Loading */}

              {loading && (
                <div className="chat-row assistant">

                  <div className="avatar ai-avatar">
                    ✦
                  </div>

                  <div className="chat-message assistant">

                    <div className="message-author">
                      Nova AI
                    </div>

                    <div className="typing">
                      <span />
                      <span />
                      <span />
                    </div>

                  </div>

                </div>
              )}

              <div
                ref={messagesEndRef}
              />

            </div>
          )}

        </main>

        {/* ==========================================
            INPUT AREA
        =========================================== */}

        <div className="input-area">

          {/* Attachment Preview */}

          {(image || file) && (
            <div className="attachment-preview">

              {/* Image */}

              {image && (
                <div className="image-preview">

                  <img
                    src={URL.createObjectURL(
                      image
                    )}
                    alt="preview"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                  >
                    ×
                  </button>

                </div>
              )}

              {/* File */}

              {file && (
                <div className="file-preview">

                  📎{" "}
                  {file.name}

                  <button
                    type="button"
                    onClick={removeFile}
                  >
                    ×
                  </button>

                </div>
              )}

            </div>
          )}

          {/* Main Input */}

          <div
            className={`nova-input ${
              !aiAssistant
                ? "input-disabled"
                : ""
            }`}
          >

            {/* Image */}

            <button
              type="button"
              className="attach-button"
              onClick={() =>
                imageInputRef.current?.click()
              }
              disabled={
                loading ||
                !aiAssistant
              }
              title="Upload image"
            >
              🖼️
            </button>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImage}
            />

            {/* File */}

            <button
              type="button"
              className="attach-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                loading ||
                !aiAssistant
              }
              title="Upload file"
            >
              📎
            </button>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleFile}
            />

            {/* Text */}

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder={
                aiAssistant
                  ? "Message Nova AI..."
                  : "AI Assistant is OFF..."
              }
              disabled={
                loading ||
                !aiAssistant
              }
              rows="1"
            />

            {/* Send */}

            <button
              type="button"
              className="send-button"
              onClick={sendMessage}
              disabled={
                loading ||
                !aiAssistant ||
                (
                  !input.trim() &&
                  !image &&
                  !file
                )
              }
              title={
                aiAssistant
                  ? "Send message"
                  : "AI Assistant is OFF"
              }
            >
              {loading
                ? "•••"
                : "➤"}
            </button>

          </div>

          {/* Tools */}

          <div className="input-tools">

            <span>
              🖼️ Image
            </span>

            <span>
              📎 File
            </span>

            <b>•</b>

            <span>
              Enter to send
            </span>

            <b>•</b>

            <span
              className={
                aiAssistant
                  ? "ai-online"
                  : "ai-offline"
              }
            >
              {aiAssistant
                ? "● AI ON"
                : "● AI OFF"}
            </span>

          </div>

          {/* Backend Error */}

          {backendError && (
            <div className="backend-error">
              ⚠️ {backendError}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default ChatPage;