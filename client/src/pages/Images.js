import React, { useRef, useState } from "react";
import "./Images.css";

function Images() {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);

  const fileInputRef = useRef(null);

  const suggestions = [
    {
      title: "Create a caricature",
      prompt:
        "Create a beautiful colorful cartoon caricature with a modern AI art style",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=90",
    },
    {
      title: "Futuristic AI",
      prompt:
        "Create a futuristic AI robot standing in a modern city with neon lights",
      image:
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=90",
    },
    {
      title: "Anime",
      prompt:
        "Create a high quality anime character standing under a beautiful blue sky",
      image:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=90",
    },
    {
      title: "Nature",
      prompt:
        "Create a beautiful cinematic mountain landscape with blue sky and clouds",
      image:
        "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=90",
    },
    {
      title: "Summer list",
      prompt:
        "Create a colorful summer vacation illustration with food, mountains and nature",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=90",
    },
  ];

  // ==========================================
  // SELECT IMAGE
  // ==========================================

  const handleAttach = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    setAttachedImage(file);
  };

  // ==========================================
  // REMOVE ATTACHMENT
  // ==========================================

  const removeAttachment = () => {
    setAttachedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================
  // VOICE INPUT
  // ==========================================

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
      const voiceText =
        event.results[0][0].transcript;

      setPrompt((previous) => {
        return previous
          ? `${previous} ${voiceText}`
          : voiceText;
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // ==========================================
  // GENERATE IMAGE
  // ==========================================

  const generateImage = () => {
    if (!prompt.trim() && !attachedImage) {
      alert("Please describe the image first.");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    setTimeout(() => {
      const randomIndex = Math.floor(
        Math.random() * suggestions.length
      );

      setGeneratedImage(
        suggestions[randomIndex].image
      );

      setLoading(false);
    }, 1800);
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      generateImage();
    }
  };

  // ==========================================
  // SELECT SUGGESTION
  // ==========================================

  const selectSuggestion = (item) => {
    setPrompt(item.prompt);

    setGeneratedImage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DOWNLOAD
  // ==========================================

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(
        generatedImage
      );

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = "nova-ai-image.jpg";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Image download failed.");
    }
  };

  return (
    <div className="images-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="images-header">

        <div className="images-heading">

          <h1>Images</h1>

          <p>
            Create beautiful images with Nova AI
          </p>

        </div>

        <div className="image-ai-badge">
          ✨ <span>Nova AI</span>
        </div>

      </header>


      {/* ==========================================
          PROMPT AREA
      ========================================== */}

      <section className="image-generator">

        {attachedImage && (
          <div className="attached-image">

            <div className="attached-left">

              <span className="attached-icon">
                🖼️
              </span>

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

        <div className="image-prompt-wrapper">

          {/* ATTACHMENT */}

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


          {/* TEXT INPUT */}

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


          {/* MICROPHONE */}

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
            {loading ? (
              <span className="button-loader">
                ✨
              </span>
            ) : (
              "➤"
            )}
          </button>

        </div>


        <div className="image-prompt-note">
          ✨ Describe anything you want Nova AI
          to create
        </div>

      </section>


      {/* ==========================================
          LOADING
      ========================================== */}

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


      {/* ==========================================
          GENERATED IMAGE
      ========================================== */}

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


      {/* ==========================================
          CREATE AN IMAGE
      ========================================== */}

      <section className="create-section">

        <div className="section-title-row">

          <h2>Create an image</h2>

          <div className="image-arrows">

            <button
              type="button"
              aria-label="Previous"
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next"
            >
              ›
            </button>

          </div>

        </div>


        {/* ==========================================
            IMAGE CARDS
        ========================================== */}

        <div className="image-suggestions">

          {suggestions.map(
            (item, index) => (

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

            )
          )}

        </div>

      </section>


      {/* ==========================================
          FEATURES
      ========================================== */}

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
              Turn your ideas into beautiful
              visuals.
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
              Generate images quickly with
              Nova AI.
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
              Create unique images from simple
              prompts.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Images;