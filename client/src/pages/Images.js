import React, { useEffect, useRef, useState } from "react";
import "./Images.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001";

const suggestions = [
  {
    title: "Caricature",
    prompt: "Create a colorful cartoon caricature with a modern AI art style",
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Futuristic AI",
    prompt: "Create a futuristic AI robot in a neon-lit modern city",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Anime",
    prompt: "Create a high quality anime character under a beautiful blue sky",
    image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Sunset",
    prompt: "Create a cinematic sunset over mountains with dramatic lighting",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Ocean",
    prompt: "Create a peaceful ocean beach under a cinematic blue sky",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Flowers",
    prompt: "Create a colorful flower arrangement in a dark artistic style",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Mountain",
    prompt: "Create a majestic mountain landscape with cinematic lighting",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Cyber City",
    prompt: "Create a futuristic cyberpunk city with neon lights at night",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Space",
    prompt: "Create a cinematic space scene with planets and stars",
    image:
      "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Architecture",
    prompt: "Create a modern luxury architectural building",
    image:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Portrait",
    prompt: "Create an artistic portrait with professional studio lighting",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1000&q=90",
  },
  {
    title: "Travel",
    prompt: "Create a beautiful luxury travel destination with mountains",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=90",
  },
];

function Images() {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedPreview, setAttachedPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (!attachedImage) {
      setAttachedPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(attachedImage);
    setAttachedPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [attachedImage]);

  useEffect(() => {
    return () => {
      if (generatedImage.startsWith("blob:")) {
        URL.revokeObjectURL(generatedImage);
      }
    };
  }, [generatedImage]);

  const handleAttach = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Image size must be less than 20MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setAttachedImage(file);
    setGeneratedImage("");
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice input is not supported. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setError("Voice input failed. Please try again.");
    };

    recognition.onresult = (event) => {
      const voiceText = event.results?.[0]?.[0]?.transcript;

      if (voiceText) {
        setPrompt((previous) =>
          previous ? `${previous} ${voiceText}` : voiceText
        );
      }
    };

    try {
      recognition.start();
    } catch (voiceError) {
      console.error("Voice input error:", voiceError);
      setIsListening(false);
      setError("Could not start voice input.");
    }
  };

  const downloadImage = (imageUrl = generatedImage, mimeType = "image/png") => {
    if (!imageUrl) return;

    const extension = mimeType.includes("jpeg")
      ? "jpg"
      : mimeType.includes("webp")
        ? "webp"
        : "png";

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `nova-ai-image-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const generateImage = async () => {
    if (loading) return;

    if (!prompt.trim() && !attachedImage) {
      setError("Write a prompt or upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedImage("");

    try {
      const formData = new FormData();

      if (prompt.trim()) {
        formData.append("prompt", prompt.trim());
      }

      if (attachedImage) {
        formData.append("image", attachedImage);
      }

      const response = await fetch(
        `${API_URL.replace(/\/$/, "")}/api/images/generate`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        let message = responseText;

        try {
          const responseData = JSON.parse(responseText);
          message =
            responseData.message ||
            responseData.error ||
            responseText;
        } catch {
          // Keep the response text when it is not JSON.
        }

        const isQuotaError =
          response.status === 429 ||
          /rate.?limit|quota|free tier|limit:\s*0/i.test(message);

        if (isQuotaError) {
          throw new Error(
            "Gemini image generation is unavailable on this model's current tier. Enable billing or choose an image model available to your Google AI Studio project."
          );
        }

        throw new Error(
          message || `Image request failed (${response.status}).`
        );
      }

      const imageBlob = await response.blob();

      if (!imageBlob.size || !imageBlob.type.startsWith("image/")) {
        throw new Error("The server response did not contain a valid image.");
      }

      const imageUrl = URL.createObjectURL(imageBlob);
      setGeneratedImage(imageUrl);

      // Automatically download the generated/transformed image.
      downloadImage(imageUrl, imageBlob.type);
    } catch (generationError) {
      console.error("Image generation error:", generationError);
      setError(
        generationError.message ||
          "Image generation failed. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!loading) {
        generateImage();
      }
    }
  };

  const selectSuggestion = (item) => {
    setPrompt(item.prompt);
    setError("");
    setGeneratedImage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollSuggestions = (direction) => {
    suggestionsRef.current?.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };

  return (
    <main className="images-page">
      <header className="images-header">
        <div className="images-heading">
          <h1>Images</h1>
          <p>Create beautiful images with Nova AI</p>
        </div>

        <div className="image-ai-badge">
          <span>✨</span>
          <span>Nova AI</span>
        </div>
      </header>

      <section className="image-generator">
        {attachedImage && (
          <div className="attached-image">
            <div className="attached-left">
              <img src={attachedPreview} alt="Uploaded image preview" />
              <div>
                <strong>{attachedImage.name}</strong>
                <small>Image attached</small>
              </div>
            </div>

            <button
              type="button"
              onClick={removeAttachment}
              aria-label="Remove uploaded image"
            >
              ×
            </button>
          </div>
        )}

        <div className="image-prompt-wrapper">
          <button
            type="button"
            className="image-attach"
            title="Upload image"
            aria-label="Upload image"
            onClick={() => fileInputRef.current?.click()}
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

          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a new image..."
            aria-label="Image prompt"
            disabled={loading}
          />

          <button
            type="button"
            className={`image-mic ${isListening ? "listening" : ""}`}
            title={isListening ? "Listening..." : "Voice input"}
            onClick={startVoiceInput}
            disabled={loading}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

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
          ✨ Describe an image, or upload one for AI transformation
        </div>

        {error && (
          <p className="image-error" role="alert">
            {error}
          </p>
        )}
      </section>

      {loading && (
        <div className="image-loading">
          <div className="loading-spinner">✨</div>
          <h3>Nova AI is creating your image...</h3>
          <p>Please wait a moment</p>
        </div>
      )}

      {generatedImage && !loading && (
        <section className="generated-section">
          <div className="generated-header">
            <div>
              <h2>Your Image</h2>
              <p>Generated by Nova AI</p>
            </div>

            <button
              type="button"
              className="download-image"
              onClick={() => downloadImage()}
            >
              ⬇ Download
            </button>
          </div>

          <div className="generated-image-card">
            <img src={generatedImage} alt="AI generated result" />
            <div className="generated-overlay">✨ Nova AI</div>
          </div>
        </section>
      )}

      <section className="create-section">
        <div className="section-title-row">
          <h2>Create an image</h2>

          <div className="image-arrows">
            <button
              type="button"
              aria-label="Previous images"
              onClick={() => scrollSuggestions("left")}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next images"
              onClick={() => scrollSuggestions("right")}
            >
              ›
            </button>
          </div>
        </div>

        <div className="image-suggestions" ref={suggestionsRef}>
          {suggestions.map((item) => (
            <button
              type="button"
              className="image-card"
              key={item.title}
              onClick={() => selectSuggestion(item)}
            >
              <img src={item.image} alt={item.title} loading="lazy" />
              <div className="image-card-overlay">
                <span>{item.title}</span>
                <small>✨</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="image-features">
        <div className="image-feature">
          <div className="feature-icon">🎨</div>
          <div>
            <strong>Creative Images</strong>
            <p>Turn your ideas into beautiful visuals.</p>
          </div>
        </div>

        <div className="image-feature">
          <div className="feature-icon">⚡</div>
          <div>
            <strong>Fast Generation</strong>
            <p>Generate images quickly with Nova AI.</p>
          </div>
        </div>

        <div className="image-feature">
          <div className="feature-icon">✨</div>
          <div>
            <strong>AI Powered</strong>
            <p>Create unique images from simple prompts.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Images;