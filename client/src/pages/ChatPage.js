import React, { useState, useRef, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setError("");
    setInput("");

    const userMessage = { sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error("Backend not connected");
      }

      const data = await response.json();

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.reply },
        ]);
      }
    } catch {
      setError("AI connection failed. Make sure backend is running on port 5001.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.banner}>
        AI connection failed. Make sure backend is running on port 5001.
      </div>

      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.botIcon}>✦</div>
          <div>
            <h2 style={styles.title}>How can I help you?</h2>
            <p style={styles.subtitle}>Ask Nova AI anything</p>
          </div>
        </div>

        <div style={styles.chatBox}>
          {messages.length === 0 && !error && (
            <div style={styles.emptyHint}>Start by typing a message</div>
          )}

          {messages.map((msg, index) => (
            <div
              key={`${msg.sender}-${index}`}
              style={{
                ...styles.messageRow,
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.sender === "bot" && <div style={styles.avatar}>✦</div>}

              <div
                style={{
                  ...styles.messageBubble,
                  ...(msg.sender === "user"
                    ? styles.userBubble
                    : styles.botBubble),
                }}
              >
                {msg.text}
              </div>

              {msg.sender === "user" && <div style={styles.avatarUser}>U</div>}
            </div>
          ))}

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.warning}>⚠</span> {error}
            </div>
          )}

          {isLoading && (
            <div style={styles.loadingRow}>
              <div style={styles.avatar}>✦</div>
              <div style={styles.botBubble}>Thinking...</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={styles.inputRow}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            style={styles.input}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              ...styles.sendButton,
              opacity: isLoading || !input.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020b14",
    color: "#fff",
    fontFamily: "Segoe UI, sans-serif",
    padding: "0",
    margin: "0",
  },
  banner: {
    background: "#7a0f1c",
    color: "#fff",
    fontWeight: 700,
    padding: "14px 20px",
    fontSize: "18px",
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 20px 40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "28px",
  },
  botIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#2c2f38",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#9aa4b2",
    fontSize: "18px",
  },
  chatBox: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    paddingTop: "10px",
  },
  messageRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#4a3ec8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
  },
  avatarUser: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#2b2f36",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "18px 20px",
    borderRadius: "18px",
    fontSize: "17px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  userBubble: {
    background: "#1f2733",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  botBubble: {
    background: "#1e3a5f",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  emptyHint: {
    color: "#7d8793",
    fontSize: "20px",
    padding: "10px 0",
  },
  errorBox: {
    background: "#1e3a5f",
    color: "#fff",
    borderRadius: "18px",
    padding: "18px 20px",
    fontSize: "17px",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  warning: {
    fontSize: "18px",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  inputRow: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
  input: {
    flex: 1,
    background: "#111827",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "16px 18px",
    fontSize: "18px",
    outline: "none",
  },
  sendButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "16px 20px",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default ChatPage;