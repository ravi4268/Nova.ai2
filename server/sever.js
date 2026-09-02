const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");

dotenv.config({
  path: path.join(__dirname, ".env"),
  override: true,
});

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const PORT = DEFAULT_PORT;
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

// ========================================
// OPENAI SETUP
// ========================================

if (!hasOpenAIKey) {
  console.warn("⚠️ OPENAI_API_KEY is missing in .env - demo mode enabled");
}

const openai = hasOpenAIKey
  ? new OpenAIApi(
      new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      })
    )
  : null;

// ========================================
// MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ========================================
// MULTER
// ========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1000000) +
      extension;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// ========================================
// STATIC UPLOADS
// ========================================

app.use(
  "/uploads",
  express.static(uploadDir)
);

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Nova AI Backend is running 🚀",
    port: PORT,
  });
});

// ========================================
// TEST
// ========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Nova AI API is working ✅",
  });
});

app.get("/api/chat", (req, res) => {
  res.json({
    success: true,
    message: "Nova AI Chat API is working. Use POST /api/chat to send a message.",
  });
});

// ========================================
// CONVERT MESSAGES FOR OPENAI
// ========================================

function convertMessagesToOpenAI(messages, currentMessage) {
  const result = [];

  // Add previous messages
  if (Array.isArray(messages)) {
    for (const msg of messages) {
      if (msg.role && msg.content) {
        result.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: String(msg.content),
        });
      } else if (msg.user) {
        result.push({
          role: "user",
          content: String(msg.user),
        });
      } else if (msg.ai) {
        result.push({
          role: "assistant",
          content: String(msg.ai),
        });
      }
    }
  }

  // Add current message
  if (currentMessage) {
    result.push({
      role: "user",
      content: currentMessage,
    });
  }

  // Keep only last 20 exchanges (40 messages)
  return result.slice(-40);
}

function createLocalReply(message, file, image) {
  const text = String(message || "").trim();
  const lowerText = text.toLowerCase();
  const attachment = file || image;

  if (/^(hi|hello|hey|salam)\b/.test(lowerText)) {
    return "Hello! How can I help you today?";
  }

  if (/\b(thanks|thank you|shukriya)\b/.test(lowerText)) {
    return "You're welcome! What would you like to do next?";
  }

  if (/\b(show|give|write|send|provide)\b.*\b(code|example|snippet)\b|\b(code|example|snippet)\b.*\b(react|javascript|html|css|python)\b/.test(lowerText)) {
    return "React example:\n\nfunction Welcome({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\nexport default Welcome;\n\nUse it like this: <Welcome name=\"Aisha\" />. Tell me the exact feature and I can provide complete code.";
  }

  if (/\b(react|react\.js|jsx|component|hook|usestate|useeffect)\b/.test(lowerText)) {
    return "React.js is a JavaScript library for building user interfaces with reusable components. Start with components, props, state, and hooks such as useState and useEffect. Keep each component focused and render lists with stable keys.";
  }

  if (/\b(javascript|js|ecmascript|node\.js|nodejs|async|promise|array|object)\b/.test(lowerText)) {
    return "JavaScript is used for interactive web apps and backend services. Important basics include variables, functions, arrays, objects, modules, promises, async/await, and error handling. Share your code or question for a more specific explanation.";
  }

  if (/\b(cyber ?security|cybersecurity|security|ethical hacking|xss|sql injection|phishing|malware|authentication|encryption|firewall)\b/.test(lowerText)) {
    return "Cybersecurity focuses on protecting systems, applications, and data. Use strong authentication, least-privilege access, HTTPS, input validation, parameterized queries, secure headers, dependency updates, backups, and logging. Test only systems you own or have permission to assess.";
  }

  if (/\b(software engineering|software engineer|agile|scrum|testing|debugging|api|database|system design)\b/.test(lowerText)) {
    return "Software engineering combines requirements, design, implementation, testing, deployment, and maintenance. Good practice includes clear modules, code review, Git, automated tests, documentation, secure APIs, monitoring, and small maintainable changes.";
  }

  if (/\b(quiz|mcq|question|exam|interview question|test me)\b/.test(lowerText)) {
    return "Quick quiz: Which React hook stores component state? A) useEffect B) useState C) useFetch D) useRoute. Reply with A, B, C, or D and I will check your answer.";
  }

  if (/\b(world cup|worldcup|fifa|cricket world cup)\b/.test(lowerText)) {
    return "Which World Cup do you mean: FIFA football or cricket, and which year? The winner depends on the sport and tournament year.";
  }

  if (/\b(build|create|make|design)\b.*\b(website|web site|webpage|landing page|portfolio)\b|\b(website|webpage|portfolio)\b.*\b(code|build|create|make)\b/.test(lowerText)) {
    return "Here is a simple website starter:\n\nHTML:\n<h1>My Portfolio</h1>\n<p>Welcome to my website.</p>\n<button>Contact me</button>\n\nCSS:\nbody { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }\nbutton { padding: 10px 16px; background: #1769aa; color: white; border: 0; border-radius: 4px; }\n\nAdd sections for About, Skills, Projects, Experience, and Contact to complete the website.";
  }

  if (/\b(show|give|write|send|provide)\b.*\b(code|example|snippet)\b|\b(code|example|snippet)\b.*\b(react|javascript|html|css|python)\b/.test(lowerText)) {
    return "React example:\n\nfunction Welcome({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\nexport default Welcome;\n\nUse it like this: <Welcome name=\"Aisha\" />. Tell me the exact feature and I can provide complete code.";
  }

  if (/\b(make|create|write|build|generate)\b.*\b(resume|cv)\b|\b(resume|cv)\b.*\b(template|format|details)\b/.test(lowerText)) {
    return "Resume template:\n\nFULL NAME\nJob title | City | Email | Phone | LinkedIn | GitHub\n\nSUMMARY\n2-3 lines describing your experience, strongest skills, and career goal.\n\nSKILLS\nJavaScript, React.js, HTML, CSS, Node.js, Git, SQL\n\nPROJECTS\nProject name - what you built, tools used, and measurable result.\n\nEXPERIENCE\nCompany - Role - Dates\n• Achievement or responsibility with a measurable result.\n\nEDUCATION\nDegree - Institute - Year\n\nSend your name, target role, skills, projects, experience, education, email, and city to make a personalized resume.";
  }

  if (/\b(html|css|web design|frontend|front end|responsive)\b/.test(lowerText)) {
    return "HTML defines page structure and CSS controls presentation. Use semantic HTML, reusable CSS classes, responsive layouts, accessible labels, and flexible units such as rem, %, and fr for a maintainable interface.";
  }

  if (/\b(python|django|flask|pandas|machine learning|data science)\b/.test(lowerText)) {
    return "Python is useful for web development, automation, data science, and AI. Learn functions, collections, modules, exceptions, virtual environments, and testing before building larger projects.";
  }

  if (/\b(sql|mysql|postgres|postgresql|database|query|mongodb)\b/.test(lowerText)) {
    return "Databases store and organize application data. For SQL, learn SELECT, INSERT, UPDATE, DELETE, JOINs, indexes, constraints, and transactions. Use parameterized queries and least-privilege database accounts for security.";
  }

  if (/\b(git|github|version control|commit|branch|merge|pull request)\b/.test(lowerText)) {
    return "Git tracks code changes. A common workflow is: create a branch, make a small commit, push it, open a pull request, review the changes, then merge. Keep commits focused and write clear messages.";
  }

  if (/\b(ai|artificial intelligence|machine learning|chatbot|neural network)\b/.test(lowerText)) {
    return "AI systems learn patterns from data or follow programmed rules. A practical workflow is to define the goal, prepare data, choose a model, evaluate it with suitable metrics, and monitor results for errors and bias.";
  }

  if (/\b(interview|resume|cv|career|job|developer roadmap|roadmap)\b/.test(lowerText)) {
    return "For a developer interview, prepare fundamentals, two or three projects, debugging examples, Git, testing, and clear explanations of your design choices. Practice solving problems aloud and keep your resume focused on measurable results.";
  }

  if (/\b(study|study plan|learn|education|student|homework|school|college|course)\b/.test(lowerText)) {
    return "A simple study plan is: choose one clear goal, divide it into small topics, study in focused sessions, practice without notes, and review mistakes. Build a small project to turn theory into practical skills.";
  }

  if (/\b(math|mathematics|calculate|equation|algebra|percentage|formula)\b/.test(lowerText)) {
    return "I can help with maths step by step. Send the complete problem, numbers, and the answer format you need, and I will explain the method clearly.";
  }

  if (/\b(translate|translation|meaning|english meaning|urdu meaning|hindi meaning)\b/.test(lowerText)) {
    return "Sure. Send the sentence and tell me the target language, such as English, Hindi, or Urdu. I can provide a natural translation and explain difficult words.";
  }

  if (/\b(how to|help me|advice|suggestion|problem|issue|error|not working|fix)\b/.test(lowerText)) {
    return "I can help troubleshoot it. Share what you are trying to do, the exact error or result, and the relevant code or steps. I will suggest a clear solution.";
  }

  if (attachment && !text) {
    return `I received your ${image ? "image" : "file"}. Please tell me what you would like me to do with it.`;
  }

  return `I understand your message: "${text}". Please share a little more detail so I can help you better.`;
}

// ========================================
// AI RESPONSE
// ========================================

async function generateAIResponse({
  message,
  history,
  image,
  file,
}) {
  const userText = String(message || "").trim();

  if (!userText && !image && !file) {
    return { reply: "Please write something!" };
  }

  const messageForAI = userText || "Please describe the uploaded image or file.";

  if (!hasOpenAIKey || !openai) {
    return {
      reply: createLocalReply(userText, file, image),
    };
  }

  const messages = convertMessagesToOpenAI(history, messageForAI);

  // Add file info if provided
  if (file) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      lastMsg.content += `\n\n📎 File uploaded: ${file.originalname}`;
    }
  }

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      reply: response.data.choices[0].message.content,
    };
  } catch (error) {
    const status = error.response?.status;
    const reason = status === 429
      ? "OpenAI quota is exhausted or the account is not enabled for API billing"
      : "OpenAI request failed";

    console.error("OpenAI Error:", status || error.message);
    return {
      reply: createLocalReply(userText, file, image),
    };
  } 
}

// ========================================
// CHAT API
// ========================================

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
          ? JSON.parse(req.body.history)
          : [];
      } catch (error) {
        history = [];
      }

      const image =
        req.files?.image?.[0] || null;

      const file =
        req.files?.file?.[0] || null;

      console.log("");
      console.log(
        "================================="
      );

      console.log("📩 USER:", message);

      if (image) {
        console.log(
          "🖼️ IMAGE:",
          image.originalname
        );
      }

      if (file) {
        console.log(
          "📎 FILE:",
          file.originalname
        );
      }

      // ====================================
      // AI
      // ====================================

      const ai =
        await generateAIResponse({
          message,
          history,
          image,
          file,
        });

      // ====================================
      // IMAGE RESPONSE
      // ====================================

      let imageData = null;

      if (image) {
        imageData = {
          name: image.originalname,

          url:
            `http://localhost:${PORT}/uploads/` +
            image.filename,
        };
      }

      // ====================================
      // FILE RESPONSE
      // ====================================

      let fileData = null;

      if (file) {
        fileData = {
          name: file.originalname,

          url:
            `http://localhost:${PORT}/uploads/` +
            file.filename,
        };
      }

      // ====================================
      // RESPONSE
      // ====================================

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
          "Sorry 😔 I couldn't process your request.",

        error:
          error.message,
      });
    }
  }
);

// ========================================
// 404
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    route: req.originalUrl,
  });
});

// ========================================
// SERVER
// ========================================

function startServer(port) {
  const server = app.listen(port, () => {
    console.log("");
    console.log(
      "================================="
    );
    console.log(
      "🚀 NOVA AI BACKEND STARTED"
    );
    console.log(
      "================================="
    );
    console.log(
      `🌐 http://localhost:${port}`
    );
    console.log(
      `🧪 http://localhost:${port}/api/test`
    );
    console.log(
      `💬 http://localhost:${port}/api/chat`
    );
    console.log(
      "================================="
    );
    console.log("");
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(
        `⚠️ Port ${port} is busy. Retrying on ${port + 1}...`
      );
      startServer(port + 1);
      return;
    }

    console.error("Server error:", error);
    process.exit(1);
  });
}

startServer(PORT);
