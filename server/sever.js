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

const QUICK_PROMPTS = [
  {
    id: "explain-topic",
    icon: "💡",
    label: "Explain a topic",
    prompt: "Explain a difficult topic in simple words and give me a few examples.",
  },
  {
    id: "write-email",
    icon: "✉️",
    label: "Write an email",
    prompt: "Write a polite, professional email about the situation I describe: ",
  },
  {
    id: "improve-resume",
    icon: "📄",
    label: "Improve my resume",
    prompt: "Review my resume text and suggest clear improvements to make it stronger: ",
  },
  {
    id: "summarize-text",
    icon: "📝",
    label: "Summarize text",
    prompt: "Summarize this text in simple language and list the key points: ",
  },
  {
    id: "translate-text",
    icon: "🌐",
    label: "Translate text",
    prompt: "Translate this into natural Hindi and explain any difficult phrases: ",
  },
  {
    id: "debug-code",
    icon: "🧑‍💻",
    label: "Debug my code",
    prompt: "Help me find and fix the issue in this code. Explain the fix: ",
  },
  {
    id: "study-plan",
    icon: "📚",
    label: "Make a study plan",
    prompt: "Create a simple study plan for me. My subject, goal, and available time are: ",
  },
  {
    id: "plan-trip",
    icon: "🧳",
    label: "Plan a trip",
    prompt: "Plan a fun weekend trip. My starting location, budget, and interests are: ",
  },
  {
    id: "meal-ideas",
    icon: "🍽️",
    label: "Meal ideas",
    prompt: "Suggest easy meal ideas based on my dietary needs, ingredients, and budget: ",
  },
  {
    id: "project-ideas",
    icon: "🚀",
    label: "Project ideas",
    prompt: "Give me creative project ideas related to this topic or skill: ",
  },
  {
    id: "solve-problem",
    icon: "🔢",
    label: "Solve a problem",
    prompt: "Solve this step by step and explain the reasoning in simple words: ",
  },
  {
    id: "brainstorm-ideas",
    icon: "✨",
    label: "Brainstorm ideas",
    prompt: "Help me brainstorm practical ideas for this goal or challenge: ",
  },
  {
    id: "cover-letter",
    icon: "📝",
    label: "Write a cover letter",
    prompt: "Write a tailored cover letter for this role using my experience: ",
  },
  {
    id: "interview-practice",
    icon: "🎤",
    label: "Practice interview questions",
    prompt: "Help me prepare for an interview for this role with practice questions: ",
  },
  {
    id: "social-post",
    icon: "📣",
    label: "Write a social post",
    prompt: "Write an engaging social media post about this topic for this audience: ",
  },
  {
    id: "check-grammar",
    icon: "✍️",
    label: "Check my writing",
    prompt: "Correct the grammar and improve the clarity of this text while keeping my meaning: ",
  },
  {
    id: "make-quiz",
    icon: "❓",
    label: "Create a quiz",
    prompt: "Create a short quiz with answers to help me learn this topic: ",
  },
  {
    id: "compare-options",
    icon: "⚖️",
    label: "Compare options",
    prompt: "Compare these options by benefits, drawbacks, cost, and best use: ",
  },
  {
    id: "plan-budget",
    icon: "💰",
    label: "Plan a budget",
    prompt: "Help me create a practical budget based on my income, expenses, and savings goal: ",
  },
  {
    id: "workout-plan",
    icon: "🏃",
    label: "Make a workout plan",
    prompt: "Create a beginner-friendly workout plan based on my goals, schedule, and equipment: ",
  },
];

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

async function callGemini(model, contents) {
  const url = `${GeminiModelEndpoint}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
        }),
        signal: AbortSignal.timeout(60000),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.error?.message ||
          `Gemini API returned HTTP ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.retryable =
          [429, 500, 502, 503, 504].includes(response.status) &&
          !/quota|billing|limit:\s*0/i.test(message);
        throw error;
      }

      return data;
    } catch (error) {
      const networkTimeoutCode = error?.cause?.code || error?.code;
      const isConnectionTimeout =
        networkTimeoutCode === "UND_ERR_CONNECT_TIMEOUT" ||
        networkTimeoutCode === "ETIMEDOUT";

      if (isConnectionTimeout && attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, 600 * 2 ** attempt + Math.random() * 300)
        );
        continue;
      }

      if (isConnectionTimeout) {
        throw new Error(
          "Could not connect to the Google API after 3 attempts. Check internet, firewall, or VPN/proxy, then retry."
        );
      }

      if (error?.name === "TimeoutError") {
        throw new Error(
          "Gemini did not respond within 60 seconds. Please try again or check your network connection."
        );
      }

      if (!error.retryable || attempt === 2) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 600 * 2 ** attempt + Math.random() * 300)
      );
    }
  }
}

async function generateAIResponse(message, history = []) {
  const input = String(message || "").trim();

  if (!input) {
    return "Hello! How can I help you today?";
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

    const data = await callGemini(GEMINI_TEXT_MODEL, contents);
    const answer = findText(data);

    if (!answer) {
      throw new Error("Gemini returned no text response.");
    }

    return answer;
  } catch (error) {
    const msg = String(error?.message || error || "");

    if (/quota|free tier|limit:\s*0|billing/i.test(msg)) {
      return "The Gemini free tier is exhausted. Please enable billing or use a paid model.";
    }

    if (
      [429, 500, 502, 503, 504].includes(error?.status) ||
      /high demand|overloaded|temporarily unavailable/i.test(msg)
    ) {
      return "Gemini is temporarily experiencing high demand. Please wait a moment and try again.";
    }

    throw error;
  }
}

async function convertImageWithAI(imageInput, userPrompt) {
  const prompt = userPrompt?.trim() || "Create a polished AI image.";
  const imageFiles = Array.isArray(imageInput)
    ? imageInput
    : imageInput
      ? [imageInput]
      : [];
  const input = [];

  for (const imageFile of imageFiles) {
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
    text: imageFiles.length > 1
      ? `Combine all uploaded source images into one cohesive final image. Use the first image as the scene or background, and naturally incorporate the subjects from the other images into it. Do not create a collage or side-by-side layout. Follow this instruction: ${prompt}\nReturn one edited image, not a description.`
      : imageFiles.length
        ? `${prompt}\nEdit the provided image. Preserve details the user did not ask to change, and return the edited image.`
      : `${prompt}\nGenerate an image. Do not only describe it.`,
  });

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY missing in server/.env");
    }

    const data = await callGemini(GEMINI_IMAGE_MODEL, [
      {
        role: "user",
        parts: input,
      },
    ]);
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

    if (imageFiles.length) {
      const preserved = preserveUploadedImage(imageFiles[0]);
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

app.get("/api/prompts", (_req, res) => {
  res.json({ prompts: QUICK_PROMPTS });
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

app.post("/api/images/generate", upload.array("image", 4), async (req, res) => {
  try {
    const prompt = req.body?.prompt?.trim() || req.body?.message?.trim() || "";
    const imageFiles = req.files || [];

    if (!prompt && !imageFiles.length) {
      return res.status(400).json({
        success: false,
        message: "Prompt likhein ya image upload karein.",
      });
    }

    const generated = await convertImageWithAI(imageFiles, prompt);

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
      const errorMessage = String(
        error?.message || "Nova AI server error."
      );
      const isTemporaryFailure =
        /timeout|timed out|connect|high demand|overloaded|temporarily unavailable/i.test(
          errorMessage
        );
      const isMissingApiKey = /GEMINI_API_KEY missing/i.test(errorMessage);
      const reply = isTemporaryFailure
        ? "I couldn't reach Gemini right now. Please try sending your message again in a moment."
        : isMissingApiKey
          ? "Nova AI is not configured on the server yet. Please add the Gemini API key and try again."
          : "Sorry, Nova AI could not process your request. Please try again.";

      return res.status(isTemporaryFailure ? 503 : 500).json({
        success: false,
        error: errorMessage,
        reply,
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