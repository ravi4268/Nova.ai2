import React, { useRef, useState } from "react";
import "./Images.css";

function Images() {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);

  const fileInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // =====================================================
  // IMAGE SUGGESTIONS
  // =====================================================

  const suggestions = [
    {
      title: "Caricature",
      prompt:
        "Create a beautiful colorful cartoon caricature with a modern AI art style",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Futuristic AI",
      prompt:
        "Create a futuristic AI robot standing in a modern city with neon lights",
      image:
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Anime",
      prompt:
        "Create a high quality anime character standing under a beautiful blue sky",
      image:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Sunset",
      prompt:
        "Create a cinematic sunset over beautiful mountains with dramatic lighting",
      image:
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Ocean",
      prompt:
        "Create a beautiful peaceful ocean beach with a cinematic blue sky",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Flowers",
      prompt:
        "Create a luxurious colorful flower arrangement in a dark artistic style",
      image:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Mountain",
      prompt:
        "Create a majestic mountain landscape with clouds and cinematic lighting",
      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Cyber City",
      prompt:
        "Create a futuristic cyberpunk city with neon lights at night",
      image:
        "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Space",
      prompt:
        "Create a cinematic space scene with planets, stars and futuristic lights",
      image:
        "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Architecture",
      prompt:
        "Create a modern luxury architectural building with cinematic photography",
      image:
        "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Portrait",
      prompt:
        "Create a cinematic artistic portrait with professional studio lighting",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1000&q=90",
    },
    {
      title: "Travel",
      prompt:
        "Create a beautiful luxury travel destination with mountains and nature",
      image:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=90",
    },
  ];

  // =====================================================
  // ATTACH IMAGE
  // =====================================================

  const handleAttach = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert("Image size must be less than 20MB.");
      return;
    }

    setAttachedImage(file);
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeAttachment = () => {
    setAttachedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // VOICE INPUT
  // =====================================================

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    recognition.start();

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;

      setPrompt((previous) =>
        previous ? `${previous} ${voiceText}` : voiceText
      );
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // =====================================================
  // GENERATE IMAGE
  // =====================================================

  const generateImage = async () => {
    if (!prompt.trim() && !attachedImage) {
      alert("Please describe the image first or attach an image.");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      /*
        If your backend has a real image-generation endpoint,
        use this section.

        Example:

        const formData = new FormData();
        formData.append("prompt", prompt);

        if (attachedImage) {
          formData.append("image", attachedImage);
        }

        const response = await fetch(
          "http://localhost:5001/api/generate-image",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (data.image) {
          setGeneratedImage(data.image);
          return;
        }
      */

      // Temporary AI-style fallback
      // This keeps the UI working even when image API
      // is not connected yet.
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const randomIndex = Math.floor(
        Math.random() * suggestions.length
      );

      setGeneratedImage(suggestions[randomIndex].image);
    } catch (error) {
      console.error("Image generation error:", error);
      alert("Nova AI image generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ENTER
  // =====================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      generateImage();
    }
  };

  // =====================================================
  // SELECT CARD
  // =====================================================

  const selectSuggestion = (item) => {
    setPrompt(item.prompt);
    setGeneratedImage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // SCROLL CARDS
  // =====================================================

  const scrollSuggestions = (direction) => {
    if (!suggestionsRef.current) return;

    const amount = 360;

    suggestionsRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DOWNLOAD
  // =====================================================

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "nova-ai-image.jpg";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      // Fallback
      window.open(generatedImage, "_blank");
    }
  };

  return (
    <div className="images-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="images-header">

        <div className="images-heading">
          <h1>Images</h1>

          <p>
            Create beautiful images with Nova AI
          </p>
        </div>

        <div className="image-ai-badge">
          <span>✨</span>
          <span>Nova AI</span>
        </div>

      </header>


      {/* =================================================
          GENERATOR
      ================================================= */}

      <section className="image-generator">

        {/* ATTACHED IMAGE */}

        {attachedImage && (
          <div className="attached-image">

            <div className="attached-left">

              <img
                src={URL.createObjectURL(attachedImage)}
                alt="Uploaded"
              />

              <div>
                <strong>
                  {attachedImage.name}
                </strong>

                <small>
                  Image attached
                </small>
              </div>

            </div>

            <button
              type="button"
              onClick={removeAttachment}
            >
              ×
            </button>

          </div>
        )}


        {/* INPUT */}

        <div className="image-prompt-wrapper">

          {/* ATTACH */}

          <button
            type="button"
            className="image-attach"
            title="Attach image"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            📎
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAttach}
          />


          {/* PROMPT */}

          <input
            type="text"
            value={prompt}
            onChange={(event) =>
              setPrompt(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Describe a new image..."
            aria-label="Image prompt"
          />


          {/* MIC */}

          <button
            type="button"
            className={`image-mic ${
              isListening ? "listening" : ""
            }`}
            title={
              isListening
                ? "Listening..."
                : "Voice input"
            }
            onClick={startVoiceInput}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>


          {/* GENERATE */}

          <button
            type="button"
            className="generate-image-button"
            onClick={generateImage}
            disabled={loading}
            title="Generate image"
          >
            {loading ? "✨" : "➤"}
          </button>

        </div>


        <div className="image-prompt-note">
          ✨ Describe anything you want Nova AI to create
        </div>

      </section>


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="image-loading">

          <div className="loading-spinner">
            ✨
          </div>

          <h3>
            Nova AI is creating your image...
          </h3>

          <p>
            Please wait a moment
          </p>

        </div>
      )}


      {/* =================================================
          GENERATED IMAGE
      ================================================= */}

      {generatedImage && !loading && (
        <section className="generated-section">

          <div className="generated-header">

            <div>
              <h2>Your Image</h2>

              <p>
                Generated by Nova AI
              </p>
            </div>

            <button
              type="button"
              className="download-image"
              onClick={downloadImage}
            >
              ⬇ Download
            </button>

          </div>

          <div className="generated-image-card">

            <img
              src={generatedImage}
              alt="Nova AI Generated"
            />

            <div className="generated-overlay">
              ✨ Nova AI
            </div>

          </div>

        </section>
      )}


      {/* =================================================
          CREATE AN IMAGE
      ================================================= */}

      <section className="create-section">

        <div className="section-title-row">

          <h2>Create an image</h2>

          <div className="image-arrows">

            <button
              type="button"
              aria-label="Previous images"
              onClick={() =>
                scrollSuggestions("left")
              }
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next images"
              onClick={() =>
                scrollSuggestions("right")
              }
            >
              ›
            </button>

          </div>

        </div>


        {/* =================================================
            HORIZONTAL IMAGE SCROLL
        ================================================= */}

        <div
          className="image-suggestions"
          ref={suggestionsRef}
        >

          {suggestions.map((item, index) => (
            <button
              type="button"
              className="image-card"
              key={index}
              onClick={() =>
                selectSuggestion(item)
              }
            >

              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
              />

              <div className="image-card-overlay">

                <span>
                  {item.title}
                </span>

                <small>
                  ✨
                </small>

              </div>

            </button>
          ))}

        </div>

      </section>


      {/* =================================================
          FEATURES
      ================================================= */}

      <section className="image-features">

        <div className="image-feature">

          <div className="feature-icon">
            🎨
          </div>

          <div>
            <strong>
              Creative Images
            </strong>

            <p>
              Turn your ideas into beautiful visuals.
            </p>
          </div>

        </div>


        <div className="image-feature">

          <div className="feature-icon">
            ⚡
          </div>

          <div>
            <strong>
              Fast Generation
            </strong>

            <p>
              Generate images quickly with Nova AI.
            </p>
          </div>

        </div>


        <div className="image-feature">

          <div className="feature-icon">
            ✨
          </div>

          <div>
            <strong>
              AI Powered
            </strong>

            <p>
              Create unique images from simple prompts.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Images;