import React, { useEffect, useRef, useState } from "react";
import "./Images.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:5000");

const IMAGE_IDEAS = [
  {
    title: "Nature escape",
    icon: "🌿",
    description: "Green forests, mountains, and soft sunlight",
    prompt:
      "Create a photorealistic nature landscape with lush green forest, distant mountains, wildflowers, and warm golden-hour sunlight.",
  },
  {
    title: "Tropical beach",
    icon: "🏖️",
    description: "A peaceful beach beneath a glowing sunset",
    prompt:
      "Create a photorealistic tropical beach with soft white sand, clear turquoise water, palm trees, and a beautiful warm sunset.",
  },
  {
    title: "Ocean waves",
    icon: "🌊",
    description: "Deep blue ocean and dramatic rolling waves",
    prompt:
      "Create a cinematic photorealistic ocean scene with deep blue water, dramatic rolling waves, sea spray, and a glowing horizon.",
  },
  {
    title: "Flower garden",
    icon: "🌸",
    description: "Colorful flowers glowing in soft morning light",
    prompt:
      "Generate an original photorealistic AI image of a lush flower garden filled with roses, tulips, and wildflowers, soft morning light, rich natural colors, and beautiful fine details.",
  },
  {
    title: "Indoor plants",
    icon: "🪴",
    description: "A calm room filled with beautiful green plants",
    prompt:
      "Generate an original photorealistic AI image of a cozy sunlit room styled with lush indoor plants including monstera, fiddle-leaf fig, and trailing pothos, warm natural light, and an inviting modern interior.",
  },
  {
    title: "Botanical leaves",
    icon: "🍃",
    description: "Fresh tropical leaves in a peaceful greenhouse",
    prompt:
      "Generate an original photorealistic AI image of vibrant tropical botanical leaves with delicate water droplets in a peaceful greenhouse, soft diffused sunlight, rich greens, and crisp natural detail.",
  },
];

function Images() {
  const [prompt, setPrompt] = useState(
    "Create a beautiful nature landscape with mountains, a lake, green forest, and soft natural light."
  );
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imageCount, setImageCount] = useState(1);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const imageUrls = useRef(new Set());

  useEffect(() => {
    return () => {
      imageUrls.current.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));
    };
  }, []);

  useEffect(() => {
    if (generatedImages.length && !loading) {
      document
        .querySelector(".generated-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [generatedImages.length, loading]);

  const clearGeneratedImages = () => {
    imageUrls.current.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));
    imageUrls.current.clear();
    setGeneratedImages([]);
  };

  const downloadImage = (image) => {
    if (!image?.url) return;

    const extension = image.mimeType.includes("jpeg")
      ? "jpg"
      : image.mimeType.includes("webp")
        ? "webp"
        : "png";

    const link = document.createElement("a");
    link.href = image.url;
    link.download = `nova-ai-image-${image.index + 1}-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const generateImage = async (overridePrompt = prompt) => {
    if (loading) return;

    const nextPrompt = String(overridePrompt || "").trim();

    if (!nextPrompt) {
      setError("Write a prompt first.");
      return;
    }

    setLoading(true);
    setError("");
    clearGeneratedImages();
    setGenerationProgress(0);

    try {
      const results = new Array(imageCount);
      const failures = [];
      let nextIndex = 0;

      const generateNextImage = async () => {
        while (nextIndex < imageCount) {
          const index = nextIndex;
          nextIndex += 1;

          try {
            const formData = new FormData();
            formData.append("prompt", nextPrompt);

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

              throw new Error(
                message || `Image request failed (${response.status}).`
              );
            }

            const imageBlob = await response.blob();

            if (!imageBlob.size || !imageBlob.type.startsWith("image/")) {
              throw new Error("The server response did not contain a valid image.");
            }

            const imageUrl = URL.createObjectURL(imageBlob);
            imageUrls.current.add(imageUrl);
            results[index] = {
              url: imageUrl,
              mimeType: imageBlob.type,
              index,
            };
            setGeneratedImages(results.filter(Boolean));
          } catch (generationError) {
            console.error(`Image ${index + 1} generation error:`, generationError);
            failures.push(generationError);
          } finally {
            setGenerationProgress((progress) => progress + 1);
          }
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(imageCount, 2) },
          () => generateNextImage()
        )
      );

      const completedImages = results.filter(Boolean);
      if (completedImages.length === 0) {
        throw failures[0] || new Error("Could not create the images. Please try again.");
      }

      if (failures.length) {
        setError(
          `${failures.length} of ${imageCount} images could not be created. ${failures[0].message}`
        );
      }
    } catch (generationError) {
      console.error("Image generation error:", generationError);
      setError(
        generationError instanceof TypeError
          ? "Could not connect to the image server. Please check that the server is running and try again."
          : generationError.message || "Could not create the image. Please try again."
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

  return (
    <main className="images-page">
      <header className="images-header">
        <div className="images-heading">
          <div className="images-title-row">
            <h1>AI Image Generator</h1>
            <span className="image-ai-badge">
              <span aria-hidden="true">✦</span>
              AI powered
            </span>
          </div>
          <p>Turn your ideas into images with AI.</p>
        </div>
      </header>

      <section className="image-generator">
        <div className="image-prompt-wrapper">
          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe an image to create..."
            aria-label="Image prompt"
            disabled={loading}
          />

          <button
            type="button"
            className="generate-image-button"
            onClick={() => generateImage(prompt)}
            disabled={loading}
            aria-label={loading ? "Generating image" : "Generate image"}
            title="Generate image"
          >
            {loading ? "Creating..." : "Generate"}
          </button>
        </div>

        <div className="image-generation-options">
          <p>Generate multiple AI variations and download each one.</p>
          <label htmlFor="image-count">
            Images
            <select
              id="image-count"
              value={imageCount}
              onChange={(event) => setImageCount(Number(event.target.value))}
              disabled={loading}
            >
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="image-error" role="alert">{error}</p>}
      </section>

      <section className="image-ideas" aria-labelledby="image-ideas-title">
        <div className="image-ideas-heading">
          <div>
            <h2 id="image-ideas-title">Explore image ideas</h2>
            <p>Choose a theme to generate AI images</p>
          </div>
        </div>
        <div className="image-ideas-grid">
          {IMAGE_IDEAS.map((idea, index) => (
            <button
              className={`image-idea-card image-idea-card-${index + 1}`}
              key={idea.title}
              type="button"
              onClick={() => {
                setPrompt(idea.prompt);
                generateImage(idea.prompt);
              }}
              disabled={loading}
              aria-label={`Generate ${imageCount} AI images: ${idea.title}`}
            >
              <span className="image-idea-icon" aria-hidden="true">
                {idea.icon}
              </span>
              <span className="image-idea-copy">
                <strong>{idea.title}</strong>
                <span>{idea.description}</span>
              </span>
              <span className="image-idea-action">
                {loading ? "Creating..." : "Generate"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <div className="image-loading" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>
            Creating your images... {generationProgress} of {imageCount} completed
          </p>
        </div>
      )}

      {generatedImages.length > 0 && (
        <section className="generated-section">
          <div className="generated-header">
            <div>
              <h2>Your AI images</h2>
              <p>{generatedImages.length} image{generatedImages.length === 1 ? "" : "s"} generated</p>
            </div>
          </div>
          <div className="generated-image-grid">
            {generatedImages.map((image) => (
              <article className="generated-image-item" key={image.url}>
                <div className="generated-image-card">
                  <img
                    src={image.url}
                    alt={`AI-generated variation ${image.index + 1}`}
                  />
                </div>
                <div className="generated-actions">
                  <span>Variation {image.index + 1}</span>
                  <button
                    type="button"
                    className="download-image"
                    onClick={() => downloadImage(image)}
                    aria-label={`Download AI-generated variation ${image.index + 1}`}
                  >
                    ⬇ Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}

export default Images;