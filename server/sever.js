const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config({
  path: path.join(__dirname, ".env"),
  override: true,
});

const app = express();

// ======================================================
// CONFIG
// ======================================================

const PORT = Number(process.env.PORT) || 5001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

const paymentOtps = new Map();

// ======================================================
// GEMINI KEY CHECK
// ======================================================

if (hasGeminiKey) {
  console.log("✅ GEMINI_API_KEY found");
} else {
  console.warn("⚠️ GEMINI_API_KEY missing");
  console.warn("⚠️ Nova AI will run in demo/fallback mode");
}

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// ======================================================
// UPLOAD DIRECTORY
// ======================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

console.log("📁 Upload directory:", uploadDir);

// ======================================================
// MULTER
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const filename =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1000000) +
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

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use(
  "/uploads",
  express.static(uploadDir)
);

// ======================================================
// HOME ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: "Nova AI",
    message: "Nova AI Backend is running 🚀",
    port: PORT,
    status: "online",
  });
});

// ======================================================
// TEST ROUTE
// ======================================================

app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Nova AI API is working ✅",
    port: PORT,
  });
});

// ======================================================
// CHAT GET TEST
// ======================================================

app.get("/api/chat", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Nova AI Chat API is working. Use POST /api/chat to send a message.",
  });
});

// ======================================================
// PHONE
// ======================================================

function normalizeIndianPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  return null;
}

// ======================================================
// SMS
// ======================================================

async function sendSms(phone, otp) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM_NUMBER
  ) {
    return false;
  }

  const credentials = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString("base64");

  const body = new URLSearchParams({
    To: phone,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `Your Nova AI payment OTP is ${otp}. It expires in 10 minutes.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",

      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body,
    }
  );

  if (!response.ok) {
    throw new Error("SMS provider rejected the OTP request");
  }

  return true;
}

// ======================================================
// SEND OTP
// ======================================================

app.post("/api/payment/send-otp", async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Enter a valid 10-digit Indian mobile number",
      });
    }

    const otp = String(
      crypto.randomInt(100000, 1000000)
    );

    paymentOtps.set(phone, {
      hash: crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex"),

      expiresAt:
        Date.now() + 10 * 60 * 1000,

      attempts: 0,
    });

    const smsSent = await sendSms(phone, otp);

    return res.json({
      success: true,
      smsSent,
      demoOtp: smsSent ? undefined : otp,
    });
  } catch (error) {
    console.error("OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Could not send OTP",
    });
  }
});

// ======================================================
// VERIFY OTP
// ======================================================

app.post("/api/payment/verify-otp", (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);

    const record = paymentOtps.get(phone);

    const submittedHash = crypto
      .createHash("sha256")
      .update(String(req.body.otp || ""))
      .digest("hex");

    if (
      !record ||
      Date.now() > record.expiresAt ||
      record.attempts >= 5
    ) {
      paymentOtps.delete(phone);

      return res.status(400).json({
        success: false,
        error: "OTP expired. Please request a new OTP",
      });
    }

    record.attempts++;

    if (submittedHash !== record.hash) {
      return res.status(400).json({
        success: false,
        error: "Incorrect OTP",
      });
    }

    paymentOtps.delete(phone);

    return res.json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "OTP verification failed",
    });
  }
});

// ======================================================
// WEATHER
// ======================================================

function isWeatherRequest(message) {
  return /\b(weather|temperature|forecast|rain|raining|barish|baarish|mausam|mosam|मौसम|तापमान|बारिश)\b/i.test(
    message
  );
}

async function getJaipurWeather() {
  const response = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,rain,showers,precipitation&hourly=precipitation_probability&forecast_days=1&timezone=Asia%2FKolkata"
  );

  if (!response.ok) {
    throw new Error("Weather service unavailable");
  }

  const data = await response.json();

  const current = data.current;

  const rainProbability = Math.max(
    ...(data.hourly?.precipitation_probability || [0])
  );

  const rainExpected =
    rainProbability >= 40 ||
    current.rain > 0 ||
    current.showers > 0 ||
    current.precipitation > 0;

  return `
Live weather in Jaipur:

Temperature: ${current.temperature_2m}°C
Feels like: ${current.apparent_temperature}°C
Humidity: ${current.relative_humidity_2m}%
Wind: ${current.wind_speed_10m} km/h
Rain probability: ${rainProbability}%
Rain expected: ${rainExpected ? "Yes" : "No"}
`;
}

// ======================================================
// CONVERT HISTORY
// ======================================================

function convertMessagesToGemini(messages, currentMessage) {
  const result = [];

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (msg.role && msg.content) {
        result.push({
          role:
            msg.role === "assistant"
              ? "model"
              : "user",

          parts: [
            {
              text: String(msg.content),
            },
          ],
        });
      }
    }
  }

  if (currentMessage) {
    result.push({
      role: "user",

      parts: [
        {
          text: String(currentMessage),
        },
      ],
    });
  }

  return result.slice(-40);
}

// ======================================================
// IMAGE / FILE -> GEMINI
// ======================================================

function addAttachmentToGeminiMessage(
  messages,
  attachment
) {
  if (!attachment) {
    return;
  }

  if (!messages.length) {
    return;
  }

  const lastMessage =
    messages[messages.length - 1];

  if (!lastMessage.parts) {
    lastMessage.parts = [];
  }

  if (!fs.existsSync(attachment.path)) {
    console.warn(
      "Attachment not found:",
      attachment.path
    );

    return;
  }

  const base64 = fs
    .readFileSync(attachment.path)
    .toString("base64");

  lastMessage.parts.push({
    inlineData: {
      mimeType:
        attachment.mimetype ||
        "application/octet-stream",

      data: base64,
    },
  });
}

// ======================================================
// LOCAL FALLBACK
// ======================================================

function createLocalReply(
  message,
  file,
  image
) {
  const text =
    String(message || "").trim();

  const lowerText =
    text.toLowerCase();

  // IMAGE
  if (image) {
    return `
🖼️ Image received successfully.

File: ${image.originalname}
Type: ${image.mimetype}
Size: ${Math.round(image.size / 1024)} KB

Nova AI can analyze:
• Objects
• People
• Colors
• Text
• Design
• Visual details

Ask me what you want to know about this image.
`;
  }

  // FILE
  if (file) {
    return `
📄 File received successfully.

File: ${file.originalname}
Type: ${file.mimetype || "unknown"}
Size: ${Math.round(file.size / 1024)} KB

Nova AI received your file successfully.
You can ask me to summarize or analyze it.
`;
  }

  // EMPTY
  if (!text) {
    return "Please write something for Nova AI.";
  }

  // HELLO
  if (/^(hi|hello|hey|salam)\b/.test(lowerText)) {
    return "Hello! 👋 I am Nova AI. How can I help you?";
  }

  // THANKS
  if (
    /\b(thanks|thank you|shukriya)\b/.test(
      lowerText
    )
  ) {
    return "You're welcome! 😊";
  }

  // CODE
  if (
    /\b(code|coding|program|javascript|react|html|css|python|node)\b/.test(
      lowerText
    )
  ) {
    return `
I can help you with coding.

You can ask me for:
• React
• JavaScript
• Node.js
• Express
• HTML
• CSS
• Python
• SQL
• APIs
• Responsive websites

Send me your exact requirement.
`;
  }

  // WEBSITE
  if (
    /\b(website|web app|landing page|portfolio)\b/.test(
      lowerText
    )
  ) {
    return `
I can create a responsive website for you.

Tell me:
1. Website name
2. Pages
3. Design
4. Features
5. React or HTML/CSS
`;
  }

  return `Nova AI received: "${text}"`;
}

// ======================================================
// AI RESPONSE
// ======================================================

async function generateAIResponse({
  message,
  history,
  image,
  file,
}) {
  const userText =
    String(message || "").trim();

  if (
    !userText &&
    !image &&
    !file
  ) {
    return {
      reply:
        "Please write a message or upload a file.",
    };
  }

  let weatherContext = "";

  // WEATHER
  if (isWeatherRequest(userText)) {
    try {
      weatherContext =
        await getJaipurWeather();
    } catch (error) {
      console.error(
        "Weather error:",
        error.message
      );
    }
  }

  // ====================================================
  // DEMO MODE
  // ====================================================

  if (!hasGeminiKey) {
    return {
      reply:
        weatherContext +
        "\n\n" +
        createLocalReply(
          userText,
          file,
          image
        ),
    };
  }

  // ====================================================
  // PROMPT
  // ====================================================

  let prompt =
    userText ||
    "Analyze the uploaded file or image and explain what it contains.";

  if (weatherContext) {
    prompt = `
${weatherContext}

Use this live weather information when answering.

User question:
${prompt}
`;
  }

  const messages =
    convertMessagesToGemini(
      history,
      prompt
    );

  // ====================================================
  // ATTACH IMAGE
  // ====================================================

  if (image) {
    addAttachmentToGeminiMessage(
      messages,
      image
    );
  }

  // ====================================================
  // ATTACH FILE
  // ====================================================

  if (file) {
    addAttachmentToGeminiMessage(
      messages,
      file
    );
  }

  // ====================================================
  // GEMINI REQUEST
  // ====================================================

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
        process.env.GEMINI_API_KEY
      )}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `
You are Nova AI.

You are NOT ChatGPT.

Answer naturally and helpfully.

If the user writes Hindi or Hinglish,
reply in Hindi/Hinglish.

If the user writes English,
reply in English.

If an image is uploaded:
- analyze the image
- describe visible content
- identify objects
- read visible text when possible
- explain colors/design
- answer the user's question about it

If a file is uploaded:
- identify the file type
- analyze its contents when supported
- summarize it when requested
- answer questions based on the uploaded content

Never pretend that an uploaded file was analyzed if it could not be read.
`,
              },
            ],
          },

          contents: messages,

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        data
      );

      throw new Error(
        data.error?.message ||
          "Gemini request failed"
      );
    }

    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map(
          (part) =>
            part.text || ""
        )
        .join("")
        .trim();

    if (!reply) {
      throw new Error(
        "Gemini returned empty response"
      );
    }

    return {
      reply,
    };
  } catch (error) {
    console.error(
      "❌ GEMINI ERROR:",
      error.message
    );

    return {
      reply:
        `Nova AI could not process the AI request right now.\n\n` +
        createLocalReply(
          userText,
          file,
          image
        ),
    };
  }
}

// ======================================================
// CHAT API
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
      const message =
        req.body.message || "";

      let history = [];

      try {
        history = req.body.history
          ? JSON.parse(
              req.body.history
            )
          : [];
      } catch {
        history = [];
      }

      const image =
        req.files?.image?.[0] ||
        null;

      const file =
        req.files?.file?.[0] ||
        null;

      console.log("");
      console.log(
        "===================================="
      );
      console.log(
        "📩 NOVA AI REQUEST"
      );
      console.log(
        "===================================="
      );

      console.log(
        "Message:",
        message
      );

      if (image) {
        console.log(
          "🖼️ Image:",
          image.originalname
        );
      }

      if (file) {
        console.log(
          "📄 File:",
          file.originalname
        );
      }

      // =================================================
      // AI
      // =================================================

      const ai =
        await generateAIResponse({
          message,
          history,
          image,
          file,
        });

      // =================================================
      // IMAGE RESPONSE
      // =================================================

      let imageData = null;

      if (image) {
        imageData = {
          name:
            image.originalname,

          type:
            image.mimetype,

          size:
            image.size,

          url:
            `${req.protocol}://${req.get(
              "host"
            )}/uploads/${image.filename}`,
        };
      }

      // =================================================
      // FILE RESPONSE
      // =================================================

      let fileData = null;

      if (file) {
        fileData = {
          name:
            file.originalname,

          type:
            file.mimetype,

          size:
            file.size,

          url:
            `${req.protocol}://${req.get(
              "host"
            )}/uploads/${file.filename}`,
        };
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        type: "text",

        reply: ai.reply,

        image: imageData,

        file: fileData,
      });
    } catch (error) {
      console.error(
        "❌ CHAT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        reply:
          "Nova AI could not process your request.",

        error:
          error.message,
      });
    }
  }
);

// ======================================================
// 404
// ======================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
      route: req.originalUrl,
    });
  }
);

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ SERVER ERROR:",
      error
    );

    if (
      error instanceof multer.MulterError
    ) {
      return res.status(400).json({
        success: false,
        error:
          "File upload error: " +
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Internal server error",
    });
  }
);

// ======================================================
// START SERVER
// ======================================================

const server = app.listen(
  PORT,
  () => {
    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      "🚀 NOVA AI BACKEND STARTED"
    );
    console.log(
      "=========================================="
    );
    console.log(
      `🌐 http://localhost:${PORT}`
    );
    console.log(
      `🧪 http://localhost:${PORT}/api/test`
    );
    console.log(
      `💬 http://localhost:${PORT}/api/chat`
    );
    console.log(
      `📁 http://localhost:${PORT}/uploads`
    );
    console.log(
      "=========================================="
    );
    console.log("");
  }
);

server.on(
  "error",
  (error) => {
    console.error("");
    console.error(
      "❌ SERVER ERROR"
    );
    console.error(
      "=========================================="
    );

    if (
      error.code === "EADDRINUSE"
    ) {
      console.error(
        `❌ Port ${PORT} is already being used.`
      );

      console.error(
        `Close the other Node server or change PORT.`
      );
    } else {
      console.error(
        error
      );
    }

    console.error(
      "=========================================="
    );
  }
);

module.exports = app;