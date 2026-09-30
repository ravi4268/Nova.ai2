const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, ".env"),
});

/* ======================================================
   APP
====================================================== */

const app = express();

const PORT = Number(process.env.PORT) || 5001;

/* ======================================================
   GEMINI CONFIG
====================================================== */

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "";

const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL ||
  "gemini-3.5-flash";

const GEMINI_TEXT_FALLBACK_MODEL =
  process.env.GEMINI_TEXT_FALLBACK_MODEL ||
  "gemini-3.5-flash-lite";

const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL ||
  "gemini-3.1-flash-image";

const GEMINI_INTERACTIONS_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

/* ======================================================
   UPLOAD DIRECTORY
====================================================== */

const uploadDir = path.join(
  __dirname,
  "uploads"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

/* ======================================================
   MIDDLEWARE
====================================================== */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "30mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "30mb",
  })
);

/* ======================================================
   STATIC UPLOADS
====================================================== */

app.use(
  "/uploads",
  express.static(uploadDir)
);

/* ======================================================
   MULTER
====================================================== */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const extension =
      path.extname(file.originalname) ||
      ".bin";

    const randomName =
      crypto
        .randomBytes(10)
        .toString("hex");

    const filename =
      `${Date.now()}-${randomName}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {
    const allowedImages = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const allowedFiles = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      allowedImages.includes(file.mimetype) ||
      allowedFiles.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}`
        )
      );
    }
  },
});

/* ======================================================
   HELPERS
====================================================== */

function makeAbsoluteUrl(
  req,
  relativePath
) {
  const protocol =
    req.headers["x-forwarded-proto"] ||
    req.protocol ||
    "http";

  const host =
    req.get("host") ||
    `localhost:${PORT}`;

  return `${protocol}://${host}${relativePath}`;
}

function safeFilename(filename) {
  return path.basename(filename);
}

function getUploadedUrl(
  req,
  filename
) {
  return makeAbsoluteUrl(
    req,
    `/uploads/${encodeURIComponent(
      filename
    )}`
  );
}

function getDownloadUrl(
  req,
  filename
) {
  return makeAbsoluteUrl(
    req,
    `/api/download/${encodeURIComponent(
      filename
    )}`
  );
}

function parseHistory(history) {
  if (!history) {
    return [];
  }

  try {
    if (Array.isArray(history)) {
      return history;
    }

    return JSON.parse(history);
  } catch (error) {
    return [];
  }
}

/* ======================================================
   OTP SYSTEM
====================================================== */

const otpStore = new Map();

function generateOTP() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

function normalizeIndianPhone(phone) {
  let cleanPhone =
    String(phone || "")
      .replace(/\D/g, "");

  if (cleanPhone.length === 10) {
    cleanPhone =
      "+91" + cleanPhone;
  }

  if (
    cleanPhone.length === 12 &&
    cleanPhone.startsWith("91")
  ) {
    cleanPhone =
      "+" + cleanPhone;
  }

  return cleanPhone;
}

/* ======================================================
   SEND PAYMENT OTP
====================================================== */

app.post(
  "/api/payment/send-otp",
  async (req, res) => {
    try {
      const { phone } =
        req.body || {};

      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number is required.",
        });
      }

      const cleanPhone =
        normalizeIndianPhone(phone);

      if (
        !/^\+91[6-9]\d{9}$/.test(
          cleanPhone
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid 10 digit Indian mobile number.",
        });
      }

      const otp =
        generateOTP();

      otpStore.set(
        cleanPhone,
        {
          otp: otp,

          expiresAt:
            Date.now() +
            10 * 60 * 1000,

          attempts: 0,
        }
      );

      console.log("");
      console.log(
        "======================================"
      );
      console.log(
        "          NOVA AI PAYMENT OTP"
      );
      console.log(
        "======================================"
      );
      console.log(
        "Phone:",
        cleanPhone
      );
      console.log(
        "OTP:",
        otp
      );
      console.log(
        "Expires: 10 minutes"
      );
      console.log(
        "======================================"
      );
      console.log("");

      /* =================================================
         OPTIONAL TWILIO SMS
      ================================================= */

      const twilioSid =
        process.env.TWILIO_ACCOUNT_SID;

      const twilioToken =
        process.env.TWILIO_AUTH_TOKEN;

      const twilioPhone =
        process.env.TWILIO_PHONE_NUMBER;

      if (
        twilioSid &&
        twilioToken &&
        twilioPhone
      ) {
        try {
          const twilio =
            require("twilio")(
              twilioSid,
              twilioToken
            );

          await twilio.messages.create({
            body:
              `Nova AI verification OTP: ${otp}. Valid for 10 minutes.`,

            from:
              twilioPhone,

            to:
              cleanPhone,
          });

          return res.json({
            success: true,

            message:
              "OTP sent successfully to your mobile number.",

            demo: false,
          });
        } catch (smsError) {
          console.error(
            "Twilio error:",
            smsError.message
          );

          return res.status(500).json({
            success: false,

            message:
              "SMS OTP could not be sent.",
          });
        }
      }

      /* =================================================
         DEVELOPMENT MODE
      ================================================= */

      return res.json({
        success: true,

        message:
          "OTP generated successfully.",

        demo: true,

        /*
          Development only.
          Real production app should
          send OTP through SMS provider.
        */
        otp: otp,
      });
    } catch (error) {
      console.error(
        "SEND OTP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Server error while generating OTP.",
      });
    }
  }
);

/* ======================================================
   VERIFY PAYMENT OTP
====================================================== */

app.post(
  "/api/payment/verify-otp",
  (req, res) => {
    try {
      const {
        phone,
        otp,
      } = req.body || {};

      if (!phone || !otp) {
        return res.status(400).json({
          success: false,

          message:
            "Phone number and OTP are required.",
        });
      }

      const cleanPhone =
        normalizeIndianPhone(phone);

      const savedOTP =
        otpStore.get(cleanPhone);

      if (!savedOTP) {
        return res.status(400).json({
          success: false,

          message:
            "OTP not found. Please request a new OTP.",
        });
      }

      /* =================================================
         EXPIRY
      ================================================= */

      if (
        Date.now() >
        savedOTP.expiresAt
      ) {
        otpStore.delete(
          cleanPhone
        );

        return res.status(400).json({
          success: false,

          message:
            "OTP expired. Please request a new OTP.",
        });
      }

      /* =================================================
         ATTEMPTS
      ================================================= */

      if (
        savedOTP.attempts >= 5
      ) {
        otpStore.delete(
          cleanPhone
        );

        return res.status(429).json({
          success: false,

          message:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      /* =================================================
         VERIFY
      ================================================= */

      if (
        String(otp).trim() !==
        savedOTP.otp
      ) {
        savedOTP.attempts += 1;

        return res.status(400).json({
          success: false,

          message:
            "Invalid OTP.",

          attemptsLeft:
            5 -
            savedOTP.attempts,
        });
      }

      /* =================================================
         VERIFIED
      ================================================= */

      otpStore.delete(
        cleanPhone
      );

      console.log(
        `✅ Phone verified: ${cleanPhone}`
      );

      return res.json({
        success: true,

        verified: true,

        message:
          "Phone number verified successfully.",
      });
    } catch (error) {
      console.error(
        "VERIFY OTP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Server error while verifying OTP.",
      });
    }
  }
);

/* ======================================================
   ROOT
====================================================== */

app.get(
  "/",
  (req, res) => {
    res.json({
      app: "Nova AI",

      status:
        "online",

      message:
        "Nova AI backend is running successfully.",

      port:
        PORT,

      textModel:
        GEMINI_TEXT_MODEL,

      fallbackTextModel:
        GEMINI_TEXT_FALLBACK_MODEL,

      imageModel:
        GEMINI_IMAGE_MODEL,

      geminiKey:
        GEMINI_API_KEY
          ? "configured"
          : "missing",
    });
  }
);

/* ======================================================
   TEST API
====================================================== */

app.get(
  "/api/test",
  (req, res) => {
    res.json({
      success: true,

      message:
        "Nova AI API is working.",

      port:
        PORT,

      geminiKey:
        GEMINI_API_KEY
          ? "configured"
          : "missing",

      textModel:
        GEMINI_TEXT_MODEL,

      fallbackTextModel:
        GEMINI_TEXT_FALLBACK_MODEL,

      imageModel:
        GEMINI_IMAGE_MODEL,
    });
  }
);

/* ======================================================
   GEMINI TEXT CHAT
====================================================== */

async function generateAIResponse(
  message,
  history = []
) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add GEMINI_API_KEY to server/.env"
    );
  }

  const safeHistory =
    Array.isArray(history)
      ? history.slice(-20)
      : [];

  let conversation = "";

  for (
    const item of safeHistory
  ) {
    if (!item) {
      continue;
    }

    const role =
      item.role === "assistant"
        ? "Nova AI"
        : "User";

    const text =
      typeof item.content ===
      "string"
        ? item.content.trim()
        : "";

    if (!text) {
      continue;
    }

    conversation +=
      `${role}: ${text}\n\n`;
  }

  conversation +=
    `User: ${
      message ||
      "Hello Nova AI."
    }\n\n`;

  const prompt = `
You are Nova AI, an intelligent AI assistant.

Rules:

1. Your name is Nova AI.
2. Never say you are ChatGPT.
3. If the user writes Hindi or Hinglish, reply in Hindi/Hinglish.
4. If the user writes English, reply in English.
5. Be helpful, natural and clear.
6. Answer the actual question.
7. Do not return an empty response.

Conversation:

${conversation}
`.trim();

  const models = [
    GEMINI_TEXT_MODEL,
    GEMINI_TEXT_FALLBACK_MODEL,
  ];

  let lastError = null;

  for (
    const model of models
  ) {
    try {
      console.log(
        `🤖 Trying Gemini text model: ${model}`
      );

      const response =
        await fetch(
          GEMINI_INTERACTIONS_ENDPOINT,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-goog-api-key":
                GEMINI_API_KEY,
            },

            body:
              JSON.stringify({
                model:
                  model,

                input:
                  prompt,

                generation_config: {
                  thinking_level:
                    "medium",
                },
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          `Gemini ${model} error:`,
          JSON.stringify(
            data,
            null,
            2
          )
        );

        lastError =
          new Error(
            data?.error?.message ||
              `Gemini ${model} failed`
          );

        if (
          response.status ===
            429 ||
          response.status ===
            503 ||
          data?.error?.code ===
            "service_unavailable"
        ) {
          continue;
        }

        throw lastError;
      }

      let reply =
        data?.output_text ||
        "";

      /* =================================================
         STEPS FALLBACK
      ================================================= */

      if (
        !reply &&
        Array.isArray(
          data?.steps
        )
      ) {
        for (
          const step of
            data.steps
        ) {
          if (
            !Array.isArray(
              step?.content
            )
          ) {
            continue;
          }

          for (
            const block of
              step.content
          ) {
            if (
              block?.type ===
                "text" &&
              typeof block?.text ===
                "string"
            ) {
              reply +=
                block.text;
            }
          }
        }
      }

      /* =================================================
         OUTPUTS FALLBACK
      ================================================= */

      if (
        !reply &&
        Array.isArray(
          data?.outputs
        )
      ) {
        for (
          const output of
            data.outputs
        ) {
          if (
            output?.type ===
              "text" &&
            typeof output?.text ===
              "string"
          ) {
            reply +=
              output.text;
          }

          if (
            Array.isArray(
              output?.content
            )
          ) {
            for (
              const content of
                output.content
            ) {
              if (
                content?.type ===
                  "text" &&
                typeof content?.text ===
                  "string"
              ) {
                reply +=
                  content.text;
              }
            }
          }
        }
      }

      reply =
        reply.trim();

      if (!reply) {
        throw new Error(
          `Gemini ${model} returned an empty response.`
        );
      }

      console.log(
        `✅ Nova AI response received from ${model}`
      );

      return reply;
    } catch (error) {
      console.error(
        `❌ Model ${model} failed:`,
        error.message
      );

      lastError =
        error;
    }
  }

  throw (
    lastError ||
    new Error(
      "All Gemini text models failed."
    )
  );
}

/* ======================================================
   AI IMAGE CONVERSION
====================================================== */

async function convertImageWithAI(
  imageFile,
  userPrompt
) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add GEMINI_API_KEY to server/.env"
    );
  }

  if (!imageFile) {
    throw new Error(
      "No image was uploaded."
    );
  }

  if (
    !fs.existsSync(
      imageFile.path
    )
  ) {
    throw new Error(
      "Uploaded image file was not found."
    );
  }

  const imageBuffer =
    fs.readFileSync(
      imageFile.path
    );

  const base64Image =
    imageBuffer.toString(
      "base64"
    );

  const mimeType =
    imageFile.mimetype ||
    "image/png";

  const prompt =
    userPrompt &&
    userPrompt.trim()
      ? userPrompt.trim()
      : "Convert this photo with AI.";

  const finalPrompt =
    `${prompt}

Create a polished AI-enhanced version of the provided photo.

Preserve the main subject and important visual details.

Keep the result realistic, clean and high quality.

Do not describe the image.

Generate the edited image.`;

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "       NOVA AI IMAGE CONVERSION"
  );
  console.log(
    "======================================"
  );
  console.log(
    "Image model:",
    GEMINI_IMAGE_MODEL
  );
  console.log(
    "Original:",
    imageFile.originalname
  );
  console.log(
    "Mime:",
    mimeType
  );
  console.log(
    "======================================"
  );

  const requestBody = {
    model:
      GEMINI_IMAGE_MODEL,

    input: [
      {
        type:
          "image",

        mime_type:
          mimeType,

        data:
          base64Image,
      },

      {
        type:
          "text",

        text:
          finalPrompt,
      },
    ],
  };

  const response =
    await fetch(
      GEMINI_INTERACTIONS_ENDPOINT,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-goog-api-key":
            GEMINI_API_KEY,
        },

        body:
          JSON.stringify(
            requestBody
          ),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "Gemini IMAGE API error:"
    );

    console.error(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      data?.error?.message ||
        `Gemini image API returned HTTP ${response.status}`
    );
  }

  /* =================================================
     FIND GENERATED IMAGE
  ================================================= */

  let generatedImageData =
    data?.output_image?.data ||
    null;

  let generatedMimeType =
    data?.output_image?.mime_type ||
    data?.output_image?.mimeType ||
    "image/png";

  /* =================================================
     OUTPUT ARRAY
  ================================================= */

  if (
    !generatedImageData &&
    Array.isArray(
      data?.output
    )
  ) {
    for (
      const item of
        data.output
    ) {
      if (
        (
          item?.type ===
            "image" ||
          item?.type ===
            "output_image"
        ) &&
        item?.data
      ) {
        generatedImageData =
          item.data;

        generatedMimeType =
          item.mime_type ||
          item.mimeType ||
          "image/png";

        break;
      }
    }
  }

  /* =================================================
     STEPS
  ================================================= */

  if (
    !generatedImageData &&
    Array.isArray(
      data?.steps
    )
  ) {
    for (
      const step of
        data.steps
    ) {
      if (
        !Array.isArray(
          step?.content
        )
      ) {
        continue;
      }

      for (
        const block of
          step.content
      ) {
        if (
          (
            block?.type ===
              "image" ||
            block?.type ===
              "output_image"
          ) &&
          block?.data
        ) {
          generatedImageData =
            block.data;

          generatedMimeType =
            block.mime_type ||
            block.mimeType ||
            "image/png";

          break;
        }
      }

      if (
        generatedImageData
      ) {
        break;
      }
    }
  }

  if (
    !generatedImageData
  ) {
    console.error(
      "❌ Gemini did not return image."
    );

    console.error(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    throw new Error(
      "Gemini did not return a generated image."
    );
  }

  /* =================================================
     BASE64 TO BUFFER
  ================================================= */

  let cleanBase64 =
    generatedImageData;

  if (
    cleanBase64.includes(
      "base64,"
    )
  ) {
    cleanBase64 =
      cleanBase64.split(
        "base64,"
      )[1];
  }

  const generatedBuffer =
    Buffer.from(
      cleanBase64,
      "base64"
    );

  if (
    !generatedBuffer.length
  ) {
    throw new Error(
      "Generated image data is empty."
    );
  }

  /* =================================================
     SAVE IMAGE
  ================================================= */

  const generatedFilename =
    `nova-ai-${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}.png`;

  const generatedPath =
    path.join(
      uploadDir,
      generatedFilename
    );

  fs.writeFileSync(
    generatedPath,
    generatedBuffer
  );

  console.log(
    "✅ AI image saved:",
    generatedFilename
  );

  return {
    filename:
      generatedFilename,

    mimeType:
      generatedMimeType ||
      "image/png",

    path:
      generatedPath,
  };
}

/* ======================================================
   DOWNLOAD IMAGE
====================================================== */

app.get(
  "/api/download/:filename",
  (req, res) => {
    try {
      const filename =
        safeFilename(
          req.params.filename
        );

      const filePath =
        path.join(
          uploadDir,
          filename
        );

      if (
        !fs.existsSync(
          filePath
        )
      ) {
        return res
          .status(404)
          .json({
            success: false,

            error:
              "Image file not found.",
          });
      }

      res.download(
        filePath,
        filename,
        (error) => {
          if (error) {
            console.error(
              "Download error:",
              error
            );

            if (
              !res.headersSent
            ) {
              res
                .status(500)
                .json({
                  success: false,

                  error:
                    "Could not download image.",
                });
            }
          }
        }
      );
    } catch (error) {
      console.error(
        "Download route error:",
        error
      );

      res
        .status(500)
        .json({
          success: false,

          error:
            "Download failed.",
        });
    }
  }
);

/* ======================================================
   CHAT API
====================================================== */

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
      const imageFile =
        req.files?.image?.[0] ||
        null;

      const fileFile =
        req.files?.file?.[0] ||
        null;

      const history =
        parseHistory(
          req.body?.history
        );

      let message =
        typeof req.body?.message ===
        "string"
          ? req.body.message.trim()
          : "";

      /* =================================================
         IMAGE
      ================================================= */

      if (imageFile) {
        if (!message) {
          message =
            "Convert this photo with AI.";
        }

        console.log("");
        console.log(
          "======================================"
        );
        console.log(
          "       NOVA AI IMAGE REQUEST"
        );
        console.log(
          "======================================"
        );
        console.log(
          "Message:",
          message
        );
        console.log(
          "File:",
          imageFile.originalname
        );
        console.log(
          "======================================"
        );

        const generated =
          await convertImageWithAI(
            imageFile,
            message
          );

        const originalImageUrl =
          getUploadedUrl(
            req,
            imageFile.filename
          );

        const generatedImageUrl =
          getUploadedUrl(
            req,
            generated.filename
          );

        const generatedDownloadUrl =
          getDownloadUrl(
            req,
            generated.filename
          );

        return res.json({
          success: true,

          type:
            "image",

          reply:
            "✨ Your photo has been converted with AI successfully!",

          message:
            message,

          image: {
            name:
              imageFile.originalname,

            filename:
              imageFile.filename,

            type:
              imageFile.mimetype,

            size:
              imageFile.size,

            url:
              originalImageUrl,
          },

          generatedImage: {
            name:
              generated.filename,

            filename:
              generated.filename,

            type:
              generated.mimeType,

            url:
              generatedImageUrl,

            downloadUrl:
              generatedDownloadUrl,
          },
        });
      }

      /* =================================================
         FILE
      ================================================= */

      if (fileFile) {
        const fileUrl =
          getUploadedUrl(
            req,
            fileFile.filename
          );

        let reply;

        try {
          reply =
            await generateAIResponse(
              message ||
                `A file named "${fileFile.originalname}" was uploaded. Please help with it.`,
              history
            );
        } catch (error) {
          console.error(
            "File AI error:",
            error
          );

          reply =
            `I received the file "${fileFile.originalname}".`;
        }

        return res.json({
          success: true,

          type:
            "file",

          reply:
            reply,

          file: {
            name:
              fileFile.originalname,

            filename:
              fileFile.filename,

            type:
              fileFile.mimetype,

            size:
              fileFile.size,

            url:
              fileUrl,
          },
        });
      }

      /* =================================================
         TEXT CHAT
      ================================================= */

      if (!message) {
        message =
          "Hello Nova AI.";
      }

      console.log(
        "💬 Nova AI text request:",
        message
      );

      const reply =
        await generateAIResponse(
          message,
          history
        );

      return res.json({
        success: true,

        type:
          "text",

        reply:
          reply,
      });
    } catch (error) {
      console.error("");
      console.error(
        "======================================"
      );
      console.error(
        "       NOVA AI CHAT ERROR"
      );
      console.error(
        "======================================"
      );
      console.error(
        error
      );
      console.error(
        "======================================"
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            error?.message ||
            "Nova AI server error.",

          reply:
            "Sorry, Nova AI could not process your request.",
        });
    }
  }
);

/* ======================================================
   MULTER ERROR HANDLER
====================================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      return res
        .status(400)
        .json({
          success: false,

          error:
            `Upload error: ${error.message}`,
        });
    }

    if (error) {
      console.error(
        "Server middleware error:",
        error
      );

      return res
        .status(400)
        .json({
          success: false,

          error:
            error.message ||
            "Request failed.",
        });
    }

    next();
  }
);

/* ======================================================
   404
====================================================== */

app.use(
  (req, res) => {
    res
      .status(404)
      .json({
        success: false,

        error:
          `Route not found: ${req.method} ${req.originalUrl}`,
      });
  }
);

/* ======================================================
   START SERVER
====================================================== */

const server =
  app.listen(
    PORT,
    () => {
      console.log("");
      console.log(
        "======================================"
      );
      console.log(
        "          NOVA AI BACKEND"
      );
      console.log(
        "======================================"
      );
      console.log(
        `Server: http://localhost:${PORT}`
      );
      console.log(
        `Test: http://localhost:${PORT}/api/test`
      );
      console.log(
        `OTP: POST /api/payment/send-otp`
      );
      console.log(
        `Verify: POST /api/payment/verify-otp`
      );
      console.log(
        `Uploads: http://localhost:${PORT}/uploads`
      );
      console.log(
        `Text Model: ${GEMINI_TEXT_MODEL}`
      );
      console.log(
        `Fallback Model: ${GEMINI_TEXT_FALLBACK_MODEL}`
      );
      console.log(
        `Image Model: ${GEMINI_IMAGE_MODEL}`
      );
      console.log(
        `Gemini API Key: ${
          GEMINI_API_KEY
            ? "FOUND"
            : "MISSING"
        }`
      );
      console.log(
        "======================================"
      );
      console.log("");
    }
  );

/* ======================================================
   SERVER ERROR
====================================================== */

server.on(
  "error",
  (error) => {
    if (
      error.code ===
      "EADDRINUSE"
    ) {
      console.error(
        `Port ${PORT} is already in use.`
      );

      console.error(
        "Close the other Node server or change PORT in .env."
      );

      process.exit(1);
    }

    console.error(
      "Server error:",
      error
    );
  }
);

/* ======================================================
   PROCESS ERRORS
====================================================== */

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled Promise Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught Exception:",
      error
    );
  }
);

module.exports = app