import React, { useEffect, useRef, useState } from "react";
import "./ChatPage.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:5001");

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);

  const [backendError, setBackendError] = useState("");

  const [aiAssistant, setAiAssistant] = useState(() => {
    return localStorage.getItem("novaAIAssistant") !== "false";
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // =====================================================
  // LOAD CHAT
  // =====================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem("novaMessages");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.error("Chat load error:", error);
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
      console.error("Chat save error:", error);
    }
  }, [messages]);

  // =====================================================
  // AI SETTING
  // =====================================================

  useEffect(() => {
    const handleAISetting = (event) => {
      const enabled = event.detail?.enabled;

      if (typeof enabled !== "boolean") return;

      setAiAssistant(enabled);

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
  // AI CHECK
  // =====================================================

  const isAIEnabled = () => {
    return localStorage.getItem("novaAIAssistant") !== "false";
  };

  // =====================================================
  // SEND
  // =====================================================

  const sendMessage = async () => {
    if (!isAIEnabled()) {
      setAiAssistant(false);

      window.alert(
        "AI Assistant is OFF.\n\nPlease enable it from Settings."
      );

      return;
    }

    if (loading) return;

    if (!input.trim() && !image && !file) {
      return;
    }

    setLoading(true);
    setBackendError("");

    const userText =
      input.trim() ||
      (image
        ? "Convert this uploaded image into a high-quality AI enhanced image."
        : file
        ? `Please analyze this file: ${file.name}`
        : "");

    const userId = Date.now();
    const aiId = userId + 1;

    // ---------------------------------------------
    // USER IMAGE PREVIEW
    // ---------------------------------------------

    let localImageUrl = null;

    if (image) {
      localImageUrl = URL.createObjectURL(image);
    }

    const userMessage = {
      id: userId,
      role: "user",
      content: userText,
      image: localImageUrl,
      file: file ? file.name : null,
    };

    // ---------------------------------------------
    // AI THINKING
    // ---------------------------------------------

    const thinkingMessage = {
      id: aiId,
      role: "assistant",
      content: "Nova AI is processing...",
      loading: true,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      thinkingMessage,
    ]);

    setInput("");

    try {
      // ---------------------------------------------
      // FORM DATA
      // ---------------------------------------------

      const formData = new FormData();

      formData.append("message", userText);

      formData.append(
        "history",
        JSON.stringify(
          messages.slice(-20).map((item) => ({
            role: item.role,
            content: item.content,
          }))
        )
      );

      if (image) {
        formData.append("image", image);
      }

      if (file) {
        formData.append("file", file);
      }

      // ---------------------------------------------
      // API
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
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Backend error: ${response.status}`
        );
      }

      if (!data.success) {
        throw new Error(
          data.error ||
            "Nova AI request failed."
        );
      }

      // ---------------------------------------------
      // AI RESULT
      // ---------------------------------------------

      setMessages((prev) =>
        prev.map((item) =>
          item.id === aiId
            ? {
                ...item,
                loading: false,
                content:
                  data.reply ||
                  "Nova AI completed the request.",
                generatedImage:
                  data.generatedImage?.url || null,
                generatedImageName:
                  data.generatedImage?.name || null,
              }
            : item
        )
      );
    } catch (error) {
      console.error("NOVA AI ERROR:", error);

      const errorText =
        error?.message ||
        "Failed to connect to Nova AI.";

      setBackendError(errorText);

      setMessages((prev) =>
        prev.map((item) =>
          item.id === aiId
            ? {
                ...item,
                loading: false,
                content: `⚠️ ${errorText}`,
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

    const selected = e.target.files?.[0];

    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      window.alert("Please select an image file.");
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      window.alert(
        "Image size must be less than 20 MB."
      );
      return;
    }

    setImage(selected);
    setBackendError("");
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

    const selected = e.target.files?.[0];

    if (!selected) return;

    if (selected.size > 20 * 1024 * 1024) {
      window.alert(
        "File size must be less than 20 MB."
      );
      return;
    }

    setFile(selected);
    setBackendError("");
  };

  // =====================================================
  // REMOVE
  // =====================================================

  const removeImage = () => {
    setImage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeFile = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // CLEAR
  // =====================================================

  const clearChat = () => {
    setMessages([]);
    setInput("");
    setImage(null);
    setFile(null);
    setBackendError("");

    localStorage.removeItem("novaMessages");

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

  const hasMessages = messages.length > 0;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="nova-page">
      <div className="nova-chat">

        {!aiAssistant && (
          <div className="ai-disabled-banner">
            ⚠️ AI Assistant is OFF — turn it ON from Settings.
          </div>
        )}

        <main className="nova-messages">

          {!hasMessages ? (
            <div className="welcome-screen">

              <div className="welcome-top">
                <div className="welcome-icon">
                  ✦
                </div>

                <div>
                  <h1>How can I help you?</h1>
                  <p>Ask Nova AI anything</p>
                </div>
              </div>

              <div className="welcome-center">

                <div className="big-stars">
                  ✨
                </div>

                <h2>
                  Welcome to Nova AI
                </h2>

                <p>
                  Your intelligent AI assistant is ready to help you.
                </p>

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

                {!aiAssistant && (
                  <div className="welcome-disabled">
                    ⚠️ AI Assistant is OFF.
                    <br />
                    Enable it from Settings.
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="conversation">

              <div className="conversation-header">
                <span>Nova AI</span>

                <button
                  type="button"
                  onClick={clearChat}
                >
                  🗑 Clear Chat
                </button>
              </div>

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-row ${message.role}`}
                >

                  {message.role === "assistant" && (
                    <div className="avatar ai-avatar">
                      ✦
                    </div>
                  )}

                  <div
                    className={`chat-message ${message.role}`}
                  >

                    <div className="message-author">
                      {message.role === "assistant"
                        ? "Nova AI"
                        : "You"}
                    </div>

                    <div className="message-content">
                      {message.content}
                    </div>

                    {/* USER IMAGE */}
                    {message.image && (
                      <div className="uploaded-result-card">

                        <img
                          src={message.image}
                          alt="Uploaded"
                          className="message-image"
                        />

                        <div className="image-label">
                          Uploaded image
                        </div>

                      </div>
                    )}

                    {/* AI GENERATED IMAGE */}
                    {message.generatedImage && (
                      <div className="ai-generated-card">

                        <div className="generated-title">
                          ✨ AI Generated Image
                        </div>

                        <img
                          src={message.generatedImage}
                          alt="AI generated"
                          className="generated-image"
                        />

                        <a
                          href={message.generatedImage}
                          download={
                            message.generatedImageName ||
                            "nova-ai-image.png"
                          }
                          className="download-image-button"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ⬇ Download Image
                        </a>

                      </div>
                    )}

                    {message.file && (
                      <div className="message-file">
                        📎 {message.file}
                      </div>
                    )}

                  </div>

                  {message.role === "user" && (
                    <div className="avatar user-avatar">
                      U
                    </div>
                  )}

                </div>
              ))}

              {loading && (
                <div className="chat-row assistant">

                  <div className="avatar ai-avatar">
                    ✦
                  </div>

                  <div className="chat-message assistant">

                    <div className="message-author">
                      Nova AI
                    </div>

                    <div className="typing-area">
                      <span />
                      <span />
                      <span />
                      <small>
                        Creating your AI image...
                      </small>
                    </div>

                  </div>

                </div>
              )}

              <div ref={messagesEndRef} />

            </div>
          )}

        </main>

        {/* INPUT */}
        <div className="input-area">

          {(image || file) && (
            <div className="attachment-preview">

              {image && (
                <div className="image-preview">

                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                  />

                  <div className="preview-info">
                    <strong>
                      Image selected
                    </strong>

                    <span>
                      {image.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                  >
                    ×
                  </button>

                </div>
              )}

              {file && (
                <div className="file-preview">

                  <span>
                    📎 {file.name}
                  </span>

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

          <div
            className={`nova-input ${
              !aiAssistant ? "input-disabled" : ""
            }`}
          >

            <button
              type="button"
              className="attach-button"
              onClick={() =>
                imageInputRef.current?.click()
              }
              disabled={
                loading || !aiAssistant
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

            <button
              type="button"
              className="attach-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                loading || !aiAssistant
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

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                aiAssistant
                  ? "Message Nova AI..."
                  : "AI Assistant is OFF..."
              }
              disabled={
                loading || !aiAssistant
              }
              rows="1"
            />

            <button
              type="button"
              className="send-button"
              onClick={sendMessage}
              disabled={
                loading ||
                !aiAssistant ||
                (!input.trim() &&
                  !image &&
                  !file)
              }
              title="Send"
            >
              {loading ? "•••" : "➤"}
            </button>

          </div>

          <div className="input-tools">
            <span>🖼️ Image</span>
            <span>📎 File</span>
            <b>•</b>
            <span>Enter to send</span>
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