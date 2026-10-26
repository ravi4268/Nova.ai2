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
const PORT = Number(process.env.PORT) || 5000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash";
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || "";
const POLLINATIONS_IMAGE_MODEL =
  process.env.POLLINATIONS_IMAGE_MODEL || "black-forest-labs/flux.1-schnell";

const GeminiModelEndpoint =
  "https://generativelanguage.googleapis.com/v1beta/models";
let pollinationsQueue = Promise.resolve();
let pollinationsNextAllowedAt = 0;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function requestPollinationsImage(imageUrl, headers = {}) {
  let attempt = 0;

  while (attempt < 2) {
    const response = await fetch(imageUrl, {
      headers,
      signal: AbortSignal.timeout(120000),
    });

    if (response.ok) {
      const mimeType = (response.headers.get("content-type") || "")
        .split(";")[0]
        .trim()
        .toLowerCase();

      if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
        throw new Error("Pollinations did not return a supported image.");
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      if (!imageBuffer.length) {
        throw new Error("Pollinations returned an empty image.");
      }

      return {
        data: imageBuffer.toString("base64"),
        mimeType,
      };
    }

    const responseText = await response.text();
    let reason = "";

    try {
      const responseData = JSON.parse(responseText);
      reason =
        responseData?.error?.message ||
        responseData?.message ||
        responseData?.error ||
        "";
    } catch {
      reason = responseText;
    }

    reason = String(reason).replace(/\s+/g, " ").trim().slice(0, 220);
    const rateLimited =
      response.status === 429 ||
      /free limit reached|retry after/i.test(reason);

    if (rateLimited && attempt === 0) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = Number(retryAfterHeader);
      const retryAfterDate = Date.parse(retryAfterHeader);
      const retryAfterMessage = reason.match(
        /retry after\s+(\d+)\s*(?:s|seconds?)/i
      );
      let retryDelay = 30_000;

      if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        retryDelay = retryAfterSeconds * 1_000;
      } else if (
        Number.isFinite(retryAfterDate) &&
        retryAfterDate > Date.now()
      ) {
        retryDelay = retryAfterDate - Date.now();
      } else if (retryAfterMessage) {
        retryDelay = Number(retryAfterMessage[1]) * 1_000;
      }

      retryDelay = Math.min(60_000, Math.max(1_000, retryDelay));
      await wait(retryDelay);
      attempt += 1;
      continue;
    }

    throw new Error(
      `Pollinations returned ${reason || `HTTP ${response.status}`}.`
    );
  }

  throw new Error("Pollinations could not generate an image.");
}

async function generatePollinationsImage(prompt) {
  let authenticatedError;

  if (POLLINATIONS_API_KEY) {
    const authenticatedUrl = new URL(
      `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`
    );
    authenticatedUrl.searchParams.set("model", POLLINATIONS_IMAGE_MODEL);
    authenticatedUrl.searchParams.set("width", "768");
    authenticatedUrl.searchParams.set("height", "768");
    authenticatedUrl.searchParams.set("nologo", "true");

    try {
      return await requestPollinationsImage(authenticatedUrl, {
        Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
      });
    } catch (error) {
      authenticatedError = error;
      console.warn(
        "Authenticated Pollinations image generation failed:",
        error.message
      );
    }
  }

  const generation = pollinationsQueue.then(async () => {
    const waitTime = Math.max(0, pollinationsNextAllowedAt - Date.now());
    if (waitTime) {
      await wait(waitTime);
    }

    pollinationsNextAllowedAt = Date.now() + 45_000;
    const publicUrl = new URL(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    );
    publicUrl.searchParams.set("width", "768");
    publicUrl.searchParams.set("height", "768");
    publicUrl.searchParams.set("nologo", "true");

    return requestPollinationsImage(publicUrl);
  });

  pollinationsQueue = generation.then(
    () => undefined,
    () => undefined
  );

  return generation.catch((error) => {
    if (authenticatedError) {
      throw new Error(
        `Authenticated Pollinations failed: ${authenticatedError.message}. Public fallback failed: ${error.message}`
      );
    }

    throw error;
  });
}

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

async function callGemini(
  model,
  contents,
  generationConfig = null,
  tools = null,
  systemInstruction = null
) {
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
          ...(generationConfig ? { generationConfig } : {}),
          ...(tools ? { tools } : {}),
          ...(systemInstruction ? { systemInstruction } : {}),
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

async function generateAIResponse(message, history = [], imageFile = null) {
  const input = String(message || "").trim();

  if (!input && !imageFile) {
    return "Hello! How can I help you today?";
  }

  if (!imageFile && /^(hi+|hello+|hey+|good morning|good afternoon|good evening|namaste|नमस्ते)[.!? ]*$/i.test(input)) {
    return "Hi! How can I help you today?";
  }

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing in server/.env");
  }

  try {
    const userParts = [];

    if (imageFile) {
      userParts.push({
        inline_data: {
          mime_type: imageFile.mimetype,
          data: fs.readFileSync(imageFile.path).toString("base64"),
        },
      });
    }

    userParts.push({
      text: input || "Please describe the uploaded image and tell me what you notice.",
    });

    const contents = [
      ...history.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: String(item.content || "") }],
      })),
      {
        role: "user",
        parts: userParts,
      },
    ];

    const needsCurrentInformation =
      /\b(today|current|latest|right now|weather|rain|score|match|election|who won|results)\b|\b(aaj|mausam|baarish|barish|kaun jeeta|chunav|natije)\b/i.test(input);
    const data = await callGemini(
      GEMINI_TEXT_MODEL,
      contents,
      null,
      needsCurrentInformation ? [{ google_search: {} }] : null,
      {
        parts: [{
          text: "You are Nova AI, a helpful conversational assistant. Reply in the language the user used and keep the answer clear and natural. For current events, weather, scores, or election results, use Google Search grounding when available. If a weather question has no location, ask which city. Never invent live information.",
        }],
      }
    );
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

  let generatedImage;
  const providerErrors = [];

  if (!generatedImage && GEMINI_API_KEY) {
    try {
      const data = await callGemini(
        GEMINI_IMAGE_MODEL,
        [
          {
            role: "user",
            parts: input,
          },
        ],
        { responseModalities: ["TEXT", "IMAGE"] }
      );
      generatedImage = findImage(data);

      if (!generatedImage?.data) {
        console.error("Gemini image response:", JSON.stringify(data, null, 2));
        throw new Error("Gemini response did not include an image.");
      }
    } catch (error) {
      const message = error.message || "Unknown Gemini image error.";
      providerErrors.push(
        /quota|billing|limit:\s*0|resource[_ ]exhausted/i.test(message)
          ? "Gemini image quota is exhausted. Check Google AI billing/limits or wait for the quota reset."
          : `Gemini image generation failed: ${message}`
      );
      console.warn("Gemini image generation failed:", message);
    }
  }

  if (!generatedImage && OPENAI_API_KEY) {
    const endpoint = imageFiles.length ? "edits" : "generations";
    const body = {
      model: OPENAI_IMAGE_MODEL,
      prompt: imageFiles.length
        ? `${prompt}\nEdit the provided image${imageFiles.length > 1 ? "s" : ""} as requested.`
        : `${prompt}\nGenerate an image.`,
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
    };

    if (imageFiles.length) {
      body.images = imageFiles.map((imageFile) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.mimetype)) {
          throw new Error(
            "OpenAI image editing supports JPEG, PNG, and WebP uploads."
          );
        }

        const imageData = fs.readFileSync(imageFile.path).toString("base64");
        return {
          image_url: `data:${imageFile.mimetype};base64,${imageData}`,
        };
      });
    }

    try {
    const response = await fetch(
      `https://api.openai.com/v1/images/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message ||
        `OpenAI image API returned HTTP ${response.status}`;
      const errorMessage =
        /invalidated|revoked|invalid api key|incorrect api key/i.test(message)
          ? "API key is invalidated. Replace OPENAI_API_KEY in server/.env with an active key."
          : message;
      providerErrors.push(`OpenAI image generation failed: ${errorMessage}`);
      console.warn("OpenAI image generation failed:", errorMessage);
    } else {
      generatedImage = data?.data?.[0]?.b64_json
        ? {
            data: data.data[0].b64_json,
            mimeType: `image/${data.output_format || "png"}`,
          }
        : null;

      if (!generatedImage?.data) {
        throw new Error("OpenAI image response did not include an image.");
      }
    }
    } catch (error) {
      const message = error.message || "Unknown OpenAI image error.";
      providerErrors.push(`OpenAI image generation failed: ${message}`);
      console.warn("OpenAI image generation failed:", message);
    }
  }

  if (!generatedImage && !imageFiles.length) {
    try {
      generatedImage = await generatePollinationsImage(prompt);
    } catch (error) {
      const message = error.message || "Unknown fallback image error.";
      providerErrors.push(`Backup image generation failed: ${message}`);
      if (
        !POLLINATIONS_API_KEY &&
        /429|limit|retry after/i.test(message)
      ) {
        providerErrors.push(
          "The public image limit has been reached. Add a Pollinations secret key as POLLINATIONS_API_KEY in server/.env to use authenticated image generation."
        );
      }
      console.warn("Backup image generation failed:", message);
    }
  }

  if (!generatedImage) {
    const generationError = new Error(
      providerErrors.length
        ? `Image generation is temporarily unavailable. ${providerErrors.join(" ")}`
        : "AI image generation is unavailable. Configure an image provider and try again."
    );
    generationError.status = 503;
    throw generationError;
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
      : generatedImage.mimeType?.includes("webp")
        ? "webp"
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
    const status =
      Number.isInteger(error.status) && error.status >= 400 && error.status < 600
        ? error.status
        : /GEMINI_API_KEY missing/i.test(error.message)
          ? 503
          : 500;

    return res.status(status).json({
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

app.post("/api/project-ai", async (req, res) => {
  const projectName = String(req.body?.projectName || "").trim();
  const prompt = String(req.body?.prompt || "").trim();
  const files = req.body?.files;

  if (!projectName || !prompt || !files || typeof files !== "object" || Array.isArray(files)) {
    return res.status(400).json({
      success: false,
      error: "Project name, prompt, and project files are required.",
    });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      error: "GEMINI_API_KEY missing in server/.env",
    });
  }

  try {
    const projectFiles = Object.fromEntries(
      Object.entries(files)
        .filter(([name, content]) =>
          typeof name === "string" &&
          typeof content === "string" &&
          !name.startsWith("/") &&
          !name.split(/[\\/]/).includes("..")
        )
        .map(([name, content]) => [name, content.slice(0, 120000)])
    );

    const contents = [{
      role: "user",
      parts: [{
        text: `You are Nova AI, a senior frontend engineer. Update the user's project to satisfy their request. Build polished, accessible, responsive HTML/CSS/JS that works on mobile and desktop. Preserve existing functionality unless asked to change it. Return one complete HTML document in the html field, not a diff.\n\nProject name: ${projectName.slice(0, 100)}\nUser request: ${prompt.slice(0, 8000)}\nCurrent files: ${JSON.stringify(projectFiles)}`,
      }],
    }];

    const data = await callGemini(GEMINI_TEXT_MODEL, contents, {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          reply: { type: "STRING" },
          html: { type: "STRING" },
        },
        required: ["reply", "html"],
      },
      maxOutputTokens: 16384,
    });
    if (data?.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      throw new Error(
        "Nova AI's project response was cut off. Please try again with a shorter request."
      );
    }
    const modelText = findText(data);
    const jsonText = modelText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const result = JSON.parse(jsonText);

    if (typeof result.html !== "string" || !result.html.trim()) {
      throw new Error("Nova AI did not return an updated project page.");
    }

    return res.json({
      success: true,
      reply: String(result.reply || "Project updated successfully."),
      files: { "index.html": result.html },
    });
  } catch (error) {
    console.error("Project AI error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Nova AI could not update this project.",
    });
  }
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
        const reply = await generateAIResponse(
          message || "Please describe the uploaded image and tell me what you notice.",
          history,
          imageFile
        );

        return res.json({
          success: true,
          type: "image",
          reply,
          uploadedImage: {
            name: imageFile.originalname,
            url: uploadedUrl(req, imageFile.filename),
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

function startServer() {
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

  return server;
}

app.startServer = startServer;

if (require.main === module) {
  startServer();
}

module.exports = app;