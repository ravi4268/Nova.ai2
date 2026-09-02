const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");

dotenv.config({
  path: path.join(__dirname, ".env"),
  override: true,
});

const app = express();

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const PORT = DEFAULT_PORT;
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

// ======================================================
// OPENAI
// ======================================================

if (!hasOpenAIKey) {
  console.warn("⚠️ OPENAI_API_KEY missing in .env - demo mode enabled");
}

const openai = hasOpenAIKey
  ? new OpenAIApi(
      new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      })
    )
  : null;

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ======================================================
// BODY
// ======================================================

app.use(express.json({ limit: "20mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

// ======================================================
// UPLOAD FOLDER
// ======================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ======================================================
// MULTER
// ======================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);

    const filename =
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 10) +
      extension;

    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

app.use(
  "/uploads",
  express.static(uploadDir)
);

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Nova AI Backend is Running 🚀",
  });
});

// ======================================================
// HEALTH
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    backend: true,
    openai: !!process.env.OPENAI_API_KEY,
  });
});

// ======================================================
// GET CHAT TEST
// ======================================================

app.get("/api/chat", (req, res) => {
  res.json({
    success: true,
    message:
      "Nova AI Chat API is working. Use POST /api/chat to send a message.",
  });
});

// ======================================================
// CHAT
// ======================================================

app.post(
  "/api/chat",

  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "file",
      maxCount: 1,
    },
  ]),

  async (req, res) => {
    try {
      console.log("");
      console.log("==============================================");
      console.log("📩 NOVA AI MESSAGE");
      console.log("==============================================");

      const message = req.body.message || "";

      console.log("Message:", message);

      // --------------------------------------------------
      // EMPTY MESSAGE
      // --------------------------------------------------

      if (!message.trim()) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      // --------------------------------------------------
      // HISTORY
      // --------------------------------------------------

      let history = [];

      if (req.body.history) {
        try {
          history = JSON.parse(
            req.body.history
          );
        } catch (error) {
          console.log(
            "⚠️ History could not be parsed"
          );

          history = [];
        }
      }

      // --------------------------------------------------
      // OPENAI MESSAGES
      // --------------------------------------------------

      const messages = [
        {
          role: "system",
          content:
            "You are Nova AI, a helpful, friendly and intelligent AI assistant. Answer clearly, naturally and accurately.",
        },
      ];

      // --------------------------------------------------
      // ADD HISTORY
      // --------------------------------------------------

      if (Array.isArray(history)) {
        history
          .slice(-20)
          .forEach((item) => {
            if (!item) return;

            let role = item.role;
            let content = item.content;

            // Support our frontend format
            if (!role) {
              if (item.user) {
                role = "user";
                content = item.user;
              }

              if (item.ai) {
                role = "assistant";
                content = item.ai;
              }
            }

            if (
              (role === "user" ||
                role === "assistant") &&
              typeof content === "string" &&
              content.trim()
            ) {
              messages.push({
                role,
                content: content.trim(),
              });
            }
          });
      }

      // --------------------------------------------------
      // CURRENT MESSAGE
      // --------------------------------------------------

      messages.push({
        role: "user",
        content: message.trim(),
      });

      console.log(
        "🤖 Sending request to OpenAI..."
      );

      if (!hasOpenAIKey || !openai) {
        const reply = `Demo mode is active. Your message was: "${message.trim()}"\n\nAdd OPENAI_API_KEY to server/.env to enable real AI responses.`;
        return res.json({ success: true, reply, uploadedFile: null });
      }

      // --------------------------------------------------
      // OPENAI
      // --------------------------------------------------

      const completion =
        await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        });

      const reply =
        completion.data.choices?.[0]?.message?.content ||
        "Sorry, I could not generate a response.";

      console.log(
        "✅ AI RESPONSE RECEIVED"
      );

      // --------------------------------------------------
      // FILE
      // --------------------------------------------------

      let uploadedFile = null;

      if (req.files) {
        const image =
          req.files.image?.[0];

        const file =
          req.files.file?.[0];

        const selectedFile =
          image || file;

        if (selectedFile) {
          uploadedFile = {
            name:
              selectedFile.originalname,

            filename:
              selectedFile.filename,

            url:
              `http://localhost:${PORT}/uploads/${selectedFile.filename}`,
          };
        }
      }

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      res.json({
        success: true,
        reply: reply,
        uploadedFile: uploadedFile,
      });
    } catch (error) {
      console.error("");
      console.error(
        "=============================================="
      );
      console.error(
        "❌ NOVA AI ERROR"
      );
      console.error(
        "=============================================="
      );

      console.error(
        error.message
      );

      console.error(
        "=============================================="
      );

      // 401
      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid OpenAI API key. Please create a new API key and update server/.env",
        });
      }

      res.status(500).json({
        success: false,
        error:
          error.message ||
          "Nova AI server error",
      });
    }
  }
);

// ======================================================
// MULTER / SERVER ERROR
// ======================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ SERVER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Server error",
    });
  }
);

// ======================================================
// START SERVER
// ======================================================

function startServer(port) {
  const server = app.listen(port, () => {
    console.log("");
    console.log(
      "=============================================="
    );
    console.log(
      "🚀 NOVA AI BACKEND STARTED"
    );
    console.log(
      "=============================================="
    );

    console.log(
      `📡 Server: http://localhost:${port}`
    );

    console.log(
      `❤️ Health: http://localhost:${port}/api/health`
    );

    console.log(
      `🔑 OpenAI API Key: ${hasOpenAIKey ? "FOUND" : "NOT FOUND (demo mode)"}`
    );

    console.log(
      "=============================================="
    );

    console.log("");
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${port} is busy. Retrying on ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    console.error("Server error:", error);
    process.exit(1);
  });
}

startServer(PORT);
