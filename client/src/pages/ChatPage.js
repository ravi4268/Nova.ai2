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
  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [image, setImage] =
    useState(null);

  const [file, setFile] =
    useState(null);

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  const imageInputRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "novaMessages"
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Load error:",
        error
      );
    }
  }, []);

  // ==================================================
  // SAVE
  // ==================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        "novaMessages",
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error(
        "Save error:",
        error
      );
    }
  }, [messages]);

  // ==================================================
  // SCROLL
  // ==================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ==================================================
  // SEND
  // ==================================================

 const sendMessage = async () => {
  if (!message.trim() || sending) return;

  const userMessage = message.trim();

  setSending(true);
  setBackendError("");

  const newMessage = {
    id: Date.now(),
    user: userMessage,
    ai: "Thinking...",
  };

  setMessages((prev) => [...prev, newMessage]);
  setMessage("");

  try {
    const formData = new FormData();

    formData.append("message", userMessage);

    formData.append(
      "history",
      JSON.stringify(
        messages.map((item) => ({
          user: item.user || "",
          ai: item.ai || "",
        }))
      )
    );

    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Backend error");
    }

    if (!data.success) {
      throw new Error(data.error || "AI response failed");
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === newMessage.id
          ? {
              ...item,
              ai: data.reply,
            }
          : item
      )
    );
  } catch (error) {
    console.error("CHAT ERROR:", error);

    setBackendError(error.message);

    setMessages((prev) =>
      prev.map((item) =>
        item.id === newMessage.id
          ? {
              ...item,
              ai: "⚠️ " + error.message,
            }
          : item
      )
    );
  } finally {
    setSending(false);
  }
};

  // ==================================================
  // ENTER
  // ==================================================

  const handleKeyDown =
    (e) => {

      if (
        e.key === "Enter" &&
        !e.shiftKey
      ) {

        e.preventDefault();

        sendMessage();
      }
    };

  // ==================================================
  // SUGGESTIONS
  // ==================================================

  const useSuggestion =
    (text) => {

      setInput(text);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

  // ==================================================
  // IMAGE
  // ==================================================

  const handleImage =
    (e) => {

      const selected =
        e.target.files?.[0];

      if (!selected) {
        return;
      }

      setImage(selected);
    };

  // ==================================================
  // FILE
  // ==================================================

  const handleFile =
    (e) => {

      const selected =
        e.target.files?.[0];

      if (!selected) {
        return;
      }

      setFile(selected);
    };

  // ==================================================
  // CLEAR
  // ==================================================

  const clearChat =
    () => {

      setMessages([]);
      setInput("");
      setImage(null);
      setFile(null);

      localStorage.removeItem(
        "novaMessages"
      );

      if (
        imageInputRef.current
      ) {
        imageInputRef.current.value =
          "";
      }

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

  const hasMessages =
    messages.length > 0;

  return (
    <div className="nova-page">

      <div className="nova-chat">

        {/* ==================================
            MESSAGES
        ================================== */}

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
                Welcome to Nova AI
              </h1>

              <p>
                Your intelligent AI
                assistant is ready
                to help you.
              </p>

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

            </div>

          ) : (

            <div className="conversation">

              <div className="conversation-header">

                <span>
                  Nova AI
                </span>

                <button
                  onClick={
                    clearChat
                  }
                >
                  🗑 Clear Chat
                </button>

              </div>

              {messages.map(
                (message) => (

                  <div
                    key={
                      message.id
                    }
                    className={
                      `chat-row ${message.role}`
                    }
                  >

                    {message.role ===
                      "assistant" && (

                      <div className="avatar ai-avatar">
                        ✦
                      </div>

                    )}

                    <div
                      className={
                        `chat-message ${message.role}`
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

                      {message.image && (
                        <img
                          src={
                            message.image
                          }
                          alt="uploaded"
                          className="message-image"
                        />
                      )}

                      {message.file && (
                        <div className="message-file">
                          📎{" "}
                          {
                            message.file
                          }
                        </div>
                      )}

                    </div>

                    {message.role ===
                      "user" && (

                      <div className="avatar user-avatar">
                        U
                      </div>

                    )}

                  </div>
                )
              )}

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
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                  </div>

                </div>

              )}

              <div
                ref={
                  messagesEndRef
                }
              />

            </div>
          )}

        </main>

        {/* ==================================
            INPUT
        ================================== */}

        <div className="input-area">

          {(image || file) && (

            <div className="attachment-preview">

              {image && (

                <div className="image-preview">

                  <img
                    src={
                      URL.createObjectURL(
                        image
                      )
                    }
                    alt="preview"
                  />

                  <button
                    onClick={() => {

                      setImage(
                        null
                      );

                      if (
                        imageInputRef.current
                      ) {
                        imageInputRef.current.value =
                          "";
                      }
                    }}
                  >
                    ×
                  </button>

                </div>
              )}

              {file && (

                <div className="file-preview">

                  📎{" "}
                  {file.name}

                  <button
                    onClick={() => {

                      setFile(
                        null
                      );

                      if (
                        fileInputRef.current
                      ) {
                        fileInputRef.current.value =
                          "";
                      }
                    }}
                  >
                    ×
                  </button>

                </div>
              )}

            </div>
          )}

          <div className="nova-input">

            {/* IMAGE */}

            <button
              className="attach-button"
              onClick={() =>
                imageInputRef.current?.click()
              }
              disabled={
                loading
              }
            >
              🖼️
            </button>

            <input
              ref={
                imageInputRef
              }
              type="file"
              accept="image/*"
              hidden
              onChange={
                handleImage
              }
            />

            {/* FILE */}

            <button
              className="attach-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                loading
              }
            >
              📎
            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              hidden
              onChange={
                handleFile
              }
            />

            {/* TEXT */}

            <textarea
              ref={
                inputRef
              }
              value={
                input
              }
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Message Nova AI..."
              disabled={
                loading
              }
              rows="1"
            />

            {/* SEND */}

            <button
              className="send-button"
              onClick={
                sendMessage
              }
              disabled={
                loading ||
                (
                  !input.trim() &&
                  !image &&
                  !file
                )
              }
            >
              {loading
                ? "•••"
                : "➤"}
            </button>

          </div>

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

          </div>

        </div>

      </div>
    </div>
  );
}

export default ChatPage;
