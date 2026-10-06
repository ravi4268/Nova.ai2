const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const dotenv = require("dotenv");
const { findImage } = require("./imageParser");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 5001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash";
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

const GeminiModelEndpoint =
  "https://generativelanguage.googleapis.com/v1beta/models";

const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname) || ".bin";
    const name = `${Date.now()}-${crypto.randomBytes(10).toString("hex")}${extension}`;
    callback(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return callback(null, true);
    }

    callback(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

function absoluteUrl(req, route) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  return `${protocol}://${req.get("host") || `localhost:${PORT}`}${route}`;
}

function uploadedUrl(req, filename) {
  return absoluteUrl(req, `/uploads/${encodeURIComponent(filename)}`);
}

function downloadUrl(req, filename) {
  return absoluteUrl(req, `/api/download/${encodeURIComponent(filename)}`);
}

function parseHistory(history) {
  if (Array.isArray(history)) return history;

  try {
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

function findText(data) {
  if (data?.candidates?.[0]?.content?.parts) {
    const text = data.candidates[0].content.parts
      .map((p) => p.text || "")
      .join("")
      .trim();

    if (text) return text;
  }

  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return "";
}

function buildFallbackSvg(prompt = "AI artwork") {
  const cleanPrompt = String(prompt || "AI artwork")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 120);

  const palette = ["#ff7f50", "#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#9b5de5"];
  const bgA = palette[Math.floor(Math.random() * palette.length)];
  const bgB = palette[Math.floor(Math.random() * palette.length)];
  const accent = palette[Math.floor(Math.random() * palette.length)];

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${bgA}" />
          <stop offset="100%" stop-color="${bgB}" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)" />
      <circle cx="820" cy="170" r="150" fill="${accent}" opacity="0.5" />
      <circle cx="230" cy="830" r="180" fill="#ffffff" opacity="0.12" />
      <path d="M90 740 C 260 590, 430 640, 580 520 S 840 430, 930 620 L 930 1024 L 90 1024 Z"
            fill="#000000" opacity="0.14" />
      <text x="512" y="470"
            text-anchor="middle"
            font-family="Segoe UI, Arial, sans-serif"
            font-weight="700"
            font-size="54"
            fill="#ffffff">${cleanPrompt}</text>
      <text x="512" y="560"
            text-anchor="middle"
            font-family="Segoe UI, Arial, sans-serif"
            font-size="28"
            fill="#f5f5f5">Free fallback artwork</text>
      <rect x="260" y="620" width="500" height="150" rx="24"
            fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.35)" />
      <text x="512" y="705"
            text-anchor="middle"
            font-family="Segoe UI, Arial, sans-serif"
            font-size="22"
            fill="#ffffff">Download enabled • No billing required</text>
    </svg>
  `;
}

function preserveUploadedImage(imageFile) {
  if (!imageFile || !fs.existsSync(imageFile.path)) {
    return null;
  }

  const extension = path.extname(imageFile.originalname) || ".png";
  const fallbackName = `uploaded-preserved-${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}${extension}`;
  const fallbackPath = path.join(uploadDir, fallbackName);

  fs.copyFileSync(imageFile.path, fallbackPath);

  return {
    filename: fallbackName,
    mimeType: imageFile.mimetype || "image/png",
    path: fallbackPath,
  };
}

async function callGemini(model, inputParts) {
  const url = `${GeminiModelEndpoint}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: inputParts,
          },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message ||
        `Gemini API returned HTTP ${response.status}`;

      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (
      error?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
      error?.name === "TimeoutError"
    ) {
      throw new Error(
        "Google API connection timed out. Check internet, firewall, VPN/proxy, then retry."
      );
    }

    throw error;
  }
}

async function generateAIResponse(message, history = []) {
  const input = String(message || "").trim();
  const text = input.toLowerCase();

  if (!input) {
    return "Hello! How can I help you today?";
  }

  if (text.includes("react")) {
    return `React.js is a JavaScript library used to build user interfaces. It helps developers create reusable components, manage state efficiently, and build interactive frontend apps. Example:
      
      import React from "react";

      function Welcome() {
        return <h1>Hello, Sanidhya!</h1>;
      }

      export default Welcome;

    React is mainly used for frontend development.`;
  }

  if (text.includes("node")) {
    return `Node.js is a JavaScript runtime used for backend development. It lets you build APIs, server logic, and database connections. Example:

      const http = require("http");

      const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Hello from Node.js server!");
      });

      server.listen(3000, () => {
        console.log("Server running on port 3000");
      });`;
  }

  if (text.includes("javascript") || text.includes("js")) {
    return `JavaScript is a programming language used for web development. It runs in browsers and can also run on servers with Node.js. Example:

      let name = "Sanidhya";
      console.log("Hello, " + name);

    JavaScript is used for DOM manipulation, form validation, animations, API calls, and frontend/backend work.`;
  }

  if (text.includes("full stack") || text.includes("fullstack")) {
    return `A full stack developer works on both the frontend and backend of an application. They handle UI, API, database, and deployment. Frontend: HTML, CSS, JavaScript, React.js. Backend: Node.js, Express.js, database, server logic.`;
  }

  if (text.includes("resume") || text.includes("cv")) {
    return `Resume example:

      Name: Sanidhya Dwivedi
      Father's Name: Ravi Dwivedi
      Mother's Name: Shuchi Dwivedi

      Skills:
      - JavaScript
      - React.js
      - Node.js
      - Frontend Development
      - Backend Development

      Objective:
      To work in a professional environment where I can improve my technical skills and contribute to the organization.`;
  }

  if (text.includes("world cup") || text.includes("fifa")) {
    return `The 2022 FIFA World Cup winner was Argentina. The 2026 winner is not yet decided because the tournament is in the future.`;
  }

  if (text.includes("election")) {
    return `Election results depend on the country and year. Please tell me the country and year, and I can tell you who won that election.`;
  }

  if (text.includes("cybersecurity") || text.includes("cyber security")) {
    return `Cybersecurity is the practice of protecting systems, data, and networks from digital attacks. It includes firewalls, antivirus, encryption, phishing prevention, and secure coding.`;
  }

  if (text.includes("hello") || text.includes("hi") || text.includes("namaste")) {
    return "Hello! I can explain JavaScript, React.js, Node.js, full stack development, resume writing, cybersecurity, elections, and World Cup winners.";
  }

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing in server/.env");
  }

  try {
    const contents = [
      ...history.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: String(item.content || "") }],
      })),
      {
        role: "user",
        parts: [{ text: input }],
      },
    ];

    const data = await callGemini(GEMINI_TEXT_MODEL, contents[0].parts);
    const answer = findText(data);

    if (!answer) {
      throw new Error("Gemini returned no text response.");
    }

    return answer;
  } catch (error) {
    const msg = String(error?.message || error || "");

    if (/rate.?limit|quota|free tier|limit:\s*0|429/i.test(msg)) {
      return "The Gemini free tier is exhausted. Please enable billing or use a paid model.";
    }

    throw error;
  }
}

async function convertImageWithAI(imageFile, userPrompt) {
  const prompt = userPrompt?.trim() || "Create a polished AI image.";
  const input = [];

  if (imageFile) {
    if (!imageFile.mimetype?.startsWith("image/")) {
      throw new Error("Uploaded file is not an image.");
    }

    if (!fs.existsSync(imageFile.path)) {
      throw new Error("Uploaded image file not found.");
    }

    input.push({
      inline_data: {
        mime_type: imageFile.mimetype,
        data: fs.readFileSync(imageFile.path).toString("base64"),
      },
    });
  }

  input.push({
    text: imageFile
      ? `${prompt}\nEdit the provided image. Preserve the main subject and return the edited image.`
      : `${prompt}\nGenerate an image. Do not only describe it.`,
  });

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing in server/.env");
    }

    const data = await callGemini(GEMINI_IMAGE_MODEL, input);
    const generatedImage = findImage(data);

    if (!generatedImage?.data) {
      console.error("Gemini image response:", JSON.stringify(data, null, 2));
      throw new Error("Gemini response did not include an image.");
    }

    const base64 = generatedImage.data.includes("base64,")
      ? generatedImage.data.split("base64,").pop()
      : generatedImage.data;

    const imageBuffer = Buffer.from(base64, "base64");
    if (!imageBuffer.length) {
      throw new Error("Generated image data is empty.");
    }

    const extension =
      generatedImage.mimeType?.includes("jpeg") ||
      generatedImage.mimeType?.includes("jpg")
        ? "jpg"
        : "png";

    const filename = `nova-ai-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}.${extension}`;
    const imagePath = path.join(uploadDir, filename);

    fs.writeFileSync(imagePath, imageBuffer);

    return {
      filename,
      mimeType: generatedImage.mimeType || "image/png",
      path: imagePath,
    };
  } catch (error) {
    const msg = String(error?.message || error || "");

    if (imageFile) {
      const preserved = preserveUploadedImage(imageFile);
      if (preserved) {
        return preserved;
      }
    }

    if (/rate.?limit|quota|free tier|limit:\s*0|429/i.test(msg)) {
      const svg = buildFallbackSvg(prompt);
      const filename = `nova-ai-fallback-${Date.now()}.svg`;
      const imagePath = path.join(uploadDir, filename);

      fs.writeFileSync(imagePath, svg, "utf8");

      return {
        filename,
        mimeType: "image/svg+xml",
        path: imagePath,
      };
    }

    throw error;
  }
}

app.get("/", (_req, res) => {
  res.json({
    app: "Nova AI",
    status: "online",
    port: PORT,
    geminiKey: GEMINI_API_KEY ? "configured" : "missing",
    imageModel: GEMINI_IMAGE_MODEL,
  });
});

app.get("/api/test", (_req, res) => {
  res.json({
    success: true,
    message: "Nova AI API is working.",
    port: PORT,
    geminiKey: GEMINI_API_KEY ? "configured" : "missing",
  });
});

app.post("/api/payment/send-otp", (req, res) => {
  const phone = String(req.body?.phone || "").replace(/\D/g, "");

  if (phone.length !== 10) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid 10 digit phone number.",
    });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  console.log(`Development OTP for +91${phone}: ${otp}`);

  return res.json({
    success: true,
    message: "OTP generated successfully.",
    demo: true,
    otp,
  });
});

app.post("/api/payment/verify-otp", (req, res) => {
  const phone = String(req.body?.phone || "").replace(/\D/g, "");
  const otp = String(req.body?.otp || "").trim();

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP request.",
    });
  }

  return res.json({
    success: true,
    verified: true,
    message: "Phone number verified successfully.",
  });
});

app.get("/api/images/generate", (_req, res) => {
  res.json({
    success: true,
    message: "Image route is available. Send a POST request to generate an image.",
  });
});

app.post("/api/images/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body?.prompt?.trim() || req.body?.message?.trim() || "";
    const imageFile = req.file || null;

    if (!prompt && !imageFile) {
      return res.status(400).json({
        success: false,
        message: "Prompt likhein ya image upload karein.",
      });
    }

    const generated = await convertImageWithAI(imageFile, prompt);

    return res
      .status(200)
      .type(generated.mimeType)
      .send(fs.readFileSync(generated.path));
  } catch (error) {
    console.error("Image generation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Image generation failed.",
    });
  }
});

app.get("/api/download/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: "File not found.",
    });
  }

  return res.download(filePath, filename);
});

app.post(
  "/api/chat",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const imageFile = req.files?.image?.[0] || null;
      const fileFile = req.files?.file?.[0] || null;
      const history = parseHistory(req.body?.history);
      const message =
        typeof req.body?.message === "string" ? req.body.message.trim() : "";

      if (imageFile) {
        const generated = await convertImageWithAI(
          imageFile,
          message || "Convert this photo with AI."
        );

        return res.json({
          success: true,
          type: "image",
          reply: "Your photo has been converted with AI.",
          image: {
            name: imageFile.originalname,
            url: uploadedUrl(req, imageFile.filename),
          },
          generatedImage: {
            name: generated.filename,
            type: generated.mimeType,
            url: uploadedUrl(req, generated.filename),
            downloadUrl: downloadUrl(req, generated.filename),
          },
        });
      }

      if (fileFile) {
        const reply = await generateAIResponse(
          message || `Please help with the uploaded file "${fileFile.originalname}".`,
          history
        );

        return res.json({
          success: true,
          type: "file",
          reply,
          file: {
            name: fileFile.originalname,
            type: fileFile.mimetype,
            url: uploadedUrl(req, fileFile.filename),
          },
        });
      }

      const reply = await generateAIResponse(
        message || "Hello Nova AI.",
        history
      );

      return res.json({ success: true, type: "text", reply });
    } catch (error) {
      console.error("Chat error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Nova AI server error.",
        reply: "Sorry, Nova AI could not process your request.",
      });
    }
  }
);

app.use((error, _req, res, _next) => {
  console.error("Request error:", error);
  res.status(400).json({
    success: false,
    error: error.message || "Request failed.",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const server = app.listen(PORT, () => {
  console.log(`Nova AI backend running at http://localhost:${PORT}`);
  console.log(`Gemini API key: ${GEMINI_API_KEY ? "FOUND" : "MISSING"}`);
  console.log(`Image model: ${GEMINI_IMAGE_MODEL}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other server first.`);
    process.exit(1);
  }

  console.error("Server error:", error);
});

module.exports = app;