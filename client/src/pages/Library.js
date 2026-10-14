import React, { useEffect, useMemo, useState } from "react";
import {
  FiArrowUpRight,
  FiFolder,
  FiLayers,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrash2,
  FiZap,
} from "react-icons/fi";
import "./Library.css";
import { buildProjectHtml } from "../utils/projectTemplate";

const DEFAULT_PROJECT_NAME = "NOVA.AI";

const buildSeedProject = ({
  name,
  type,
  description,
  accent,
  bodyHtml,
}) => ({
  id: `seed-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  name,
  type,
  memory: "Default memory",
  modified: "Today",
  description,
  accent,
  files: {
    "index.html": buildProjectHtml(name, bodyHtml),
    "README.md": `# ${name}\n\n${description}\n`,
  },
  aiReply: "",
  lastPrompt: "",
});

const createSeedProjects = () => [
  buildSeedProject({
    name: "Bloom Cafe",
    type: "Cafe & Hotel",
    description: "Luxury cafe website with warm hospitality, elegant menu sections, and a memorable guest experience.",
    accent: "#f2b84b",
    bodyHtml: `
      <section class="project-hero">
        <div class="project-badge">Freshly brewed • Open daily</div>
        <h1>Bloom Cafe</h1>
        <p>Warm interiors, seasonal plates, and a refined experience for slow mornings and lively evenings.</p>
        <div class="project-cta-row">
          <button>Book a table</button>
          <button class="ghost">View menu</button>
        </div>
      </section>
      <section class="project-grid">
        <article>
          <span>Signature menu</span>
          <h3>Chef-crafted breakfasts</h3>
          <p>Rose latte, smashed avocado toast, truffle eggs, and seasonal desserts.</p>
        </article>
        <article>
          <span>Ambience</span>
          <h3>City rooftop dining</h3>
          <p>Golden lighting, botanical textures, and a cozy social vibe that feels premium.</p>
        </article>
        <article>
          <span>Guest experience</span>
          <h3>Private events</h3>
          <p>Perfect for brunches, coffee tastings, and intimate celebrations with tailored service.</p>
        </article>
      </section>
      <section class="project-banner">
        <div>
          <span>Seasonal favourites</span>
          <h2>Our signature coffee rituals</h2>
        </div>
        <p>Handpicked beans, artisanal pastries, and beautifully plated comfort food designed for a slower rhythm.</p>
      </section>
    `,
  }),
  buildSeedProject({
    name: "Hotel Haven",
    type: "Hospitality",
    description: "Premium hotel landing page with room highlights, amenities, and guest-focused booking journeys.",
    accent: "#7ac6ff",
    bodyHtml: `
      <section class="project-hero hotel-hero">
        <div class="project-badge">Boutique stay • 4.9 guest rating</div>
        <h1>Hotel Haven</h1>
        <p>Thoughtful spaces, curated comfort, and effortless hospitality for every kind of stay.</p>
        <div class="project-cta-row">
          <button>Reserve now</button>
          <button class="ghost">Explore suites</button>
        </div>
      </section>
      <section class="project-grid hotel-grid">
        <article>
          <span>Rooms</span>
          <h3>Elegant suites</h3>
          <p>Plush bedding, calm lighting, and refined details tailored for restful nights.</p>
        </article>
        <article>
          <span>Amenities</span>
          <h3>Wellness & dining</h3>
          <p>Pool deck, spa rituals, rooftop lounge, and chef-led dining experiences.</p>
        </article>
        <article>
          <span>Location</span>
          <h3>City center</h3>
          <p>Walkable access to business districts, galleries, and local attractions.</p>
        </article>
      </section>
    `,
  }),
  buildSeedProject({
    name: "Institute Future",
    type: "Education",
    description: "Modern institute landing page featuring programs, faculty, and academic experiences for future students.",
    accent: "#8bd9b3",
    bodyHtml: `
      <section class="project-hero institute-hero">
        <div class="project-badge">Admissions open • 2026 intake</div>
        <h1>Institute Future</h1>
        <p>Empowering confident learners with practical programs, mentorship, and career-ready experiences.</p>
        <div class="project-cta-row">
          <button>Apply now</button>
          <button class="ghost">Explore programs</button>
        </div>
      </section>
      <section class="project-grid institute-grid">
        <article>
          <span>Programs</span>
          <h3>Career pathways</h3>
          <p>Technology, design, business, and innovation labs built for real-world results.</p>
        </article>
        <article>
          <span>Mentors</span>
          <h3>Guided learning</h3>
          <p>Close mentorship, project-based challenges, and support that keeps students progressing.</p>
        </article>
        <article>
          <span>Outcomes</span>
          <h3>Future-ready</h3>
          <p>Students graduate with portfolios, confidence, and the skills to make an impact.</p>
        </article>
      </section>
    `,
  }),
];

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:5000");

function Library() {
  const [activeTab, setActiveTab] = useState("all");

  const [activeProject, setActiveProject] = useState(() => {
    try {
      const saved = localStorage.getItem("novaActiveProject");

      if (saved) {
        const project = JSON.parse(saved);

        if (
          project?.files?.["index.html"] &&
          !project.files["index.html"].includes("anaya-shell-v3")
        ) {
          project.files["index.html"] = buildProjectHtml(
            project.name,
            project.files["index.html"]
          );
        }

        return project;
      }

      const seeded = createSeedProjects();
      return seeded[0];
    } catch {
      return createSeedProjects()[0];
    }
  });

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("novaProjects");
      return saved ? JSON.parse(saved) : createSeedProjects();
    } catch {
      return createSeedProjects();
    }
  });

  const [aiPrompt, setAiPrompt] = useState(() => {
    try {
      const saved = localStorage.getItem("novaActiveProject");

      if (!saved) return "";

      return JSON.parse(saved)?.lastPrompt || "";
    } catch {
      return "";
    }
  });

  const [aiReply, setAiReply] = useState(() => {
    try {
      const saved = localStorage.getItem("novaActiveProject");

      if (!saved) return "";

      return JSON.parse(saved)?.aiReply || "";
    } catch {
      return "";
    }
  });

  const [aiLoading, setAiLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [projectName, setProjectName] =
    useState(DEFAULT_PROJECT_NAME);

  const [initialPrompt, setInitialPrompt] =
    useState("");

  const [memory, setMemory] =
    useState("Default memory");

  const [search, setSearch] = useState("");

  const [aiIdea, setAiIdea] = useState("");

  const [projectToDelete, setProjectToDelete] =
    useState(null);

  // ==========================================
  // SAVE PROJECTS
  // ==========================================

  useEffect(() => {
    localStorage.setItem(
      "novaProjects",
      JSON.stringify(projects)
    );
  }, [projects]);

  // ==========================================
  // SAVE ACTIVE PROJECT
  // ==========================================

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem(
        "novaActiveProject",
        JSON.stringify(activeProject)
      );
    }
  }, [activeProject]);

  // ==========================================
  // CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    setProjectName(DEFAULT_PROJECT_NAME);
    setInitialPrompt("");
    setMemory("Default memory");
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setProjectName(DEFAULT_PROJECT_NAME);
    setInitialPrompt("");
  };

  // ==========================================
  // CREATE PROJECT
  // ==========================================

  const createProject = (promptOverride = null) => {
    const hasPromptOverride =
      typeof promptOverride === "string";
    const prompt = (
      hasPromptOverride
        ? promptOverride
        : initialPrompt
    ).trim();
    const generatedName = prompt
      .replace(/^(create|build|make|design)\s+/i, "")
      .replace(/[.!?].*$/, "")
      .trim()
      .slice(0, 56);
    const name = hasPromptOverride
      ? generatedName || "AI Project"
      : projectName.trim();

    if (!name) return;

    const newProject = {
      id: Date.now(),
      name,
      type: "Created by you",
      modified: "Just now",
      memory,

      files: {
        "index.html": createStarterHtml(name),

        "README.md": `# ${name}

A responsive project created with Nova AI.
`,
      },

      aiReply: "",
      lastPrompt: "",
    };

    setProjects((prev) => [
      newProject,
      ...prev,
    ]);

    setActiveTab("all");
    setShowModal(false);
    setProjectName("");
    setInitialPrompt("");

    openProject(newProject);

    if (prompt) {
      setAiPrompt(prompt);
      askProjectAi(null, newProject, prompt);
    }
  };

  function createStarterHtml(name) {
    return buildProjectHtml(name);
  }

  // ==========================================
  // ENTER / ESC
  // ==========================================

  const handleProjectKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createProject();
    }

    if (e.key === "Escape") {
      closeCreateModal();
    }
  };

  // ==========================================
  // FILTER PROJECTS
  // ==========================================

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (activeTab === "created") {
      result = result.filter(
        (item) => item.type === "Created by you"
      );
    }

    if (activeTab === "shared") {
      result = result.filter(
        (item) => item.type === "Shared with you"
      );
    }

    if (search.trim()) {
      const value = search.toLowerCase();

      result = result.filter((item) =>
        item.name
          .toLowerCase()
          .includes(value)
      );
    }

    return result;
  }, [projects, activeTab, search]);

  const submitAiIdea = (event) => {
    event.preventDefault();
    if (!aiIdea.trim() || aiLoading) return;
    createProject(aiIdea);
    setAiIdea("");
  };

  // ==========================================
  // OPEN PROJECT
  // ==========================================

  const openProject = (project) => {
    const hydratedProject = project.files
      ? {
          ...project,
          files: {
            ...project.files,
          },
        }
      : {
          ...project,
          files: {
            "index.html": createStarterHtml(
              project.name
            ),
            "README.md": `# ${project.name}

A responsive project created with Nova AI.
`,
          },
        };

    if (
      !hydratedProject.files["index.html"]
        ?.includes("anaya-shell-v3")
    ) {
      hydratedProject.files["index.html"] =
        buildProjectHtml(
          hydratedProject.name,
          hydratedProject.files["index.html"]
        );

      setProjects((prev) =>
        prev.map((item) =>
          item.id === hydratedProject.id
            ? hydratedProject
            : item
        )
      );
    }

    setActiveProject(hydratedProject);

    setAiReply(
      hydratedProject.aiReply || ""
    );

    setAiPrompt(
      hydratedProject.lastPrompt || ""
    );

    localStorage.setItem(
      "novaActiveProject",
      JSON.stringify(hydratedProject)
    );
  };

  // ==========================================
  // CLOSE PROJECT
  // ==========================================

  const closeProject = () => {
    setActiveProject(null);

    localStorage.removeItem(
      "novaActiveProject"
    );

    setAiReply("");
    setAiPrompt("");
  };

  // ==========================================
  // SAVE UPDATED PROJECT
  // ==========================================

  const saveUpdatedProject = (
    updatedFiles,
    reply,
    prompt,
    projectBase = activeProject
  ) => {
    const updatedProject = {
      ...projectBase,

      files: {
        ...projectBase.files,
        ...updatedFiles,
      },

      aiReply: reply,
      lastPrompt: prompt,
      modified: "Just now",
    };

    setActiveProject(updatedProject);

    setProjects((prev) =>
      prev.map((project) =>
        project.id === updatedProject.id
          ? updatedProject
          : project
      )
    );

    localStorage.setItem(
      "novaActiveProject",
      JSON.stringify(updatedProject)
    );
  };

  // ==========================================
  // PREVIEW PROJECT
  // ==========================================

  const previewProject = () => {
    if (
      !activeProject?.files?.["index.html"]
    ) {
      return;
    }

    const html =
      activeProject.files["index.html"];

    const previewUrl = URL.createObjectURL(
      new Blob([html], {
        type: "text/html",
      })
    );

    const newWindow = window.open(
      previewUrl,
      "_blank",
      "noopener,noreferrer"
    );

    if (!newWindow) {
      alert(
        "Please allow pop-ups to preview the project."
      );
    }

    setTimeout(() => {
      URL.revokeObjectURL(previewUrl);
    }, 10000);
  };

  // ==========================================
  // DOWNLOAD PROJECT
  // ==========================================

  const downloadProject = () => {
    if (!activeProject) return;

    const content =
      activeProject.files?.["index.html"] ||
      createStarterHtml(
        activeProject.name
      );

    const downloadUrl =
      URL.createObjectURL(
        new Blob([content], {
          type: "text/html",
        })
      );

    const link =
      document.createElement("a");

    link.href = downloadUrl;

    link.download =
      `${
        activeProject.name
          .replace(
            /[^a-z0-9]+/gi,
            "-"
          )
          .toLowerCase() ||
        "nova-project"
      }.html`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  };

  // ==========================================
  // ASK NOVA AI
  // ==========================================

  const askProjectAi = async (
    event,
    projectOverride = null,
    promptOverride = null
  ) => {
    event?.preventDefault();

    const prompt =
      (promptOverride ?? aiPrompt).trim();
    const projectToUpdate =
      projectOverride || activeProject;

    if (
      !prompt ||
      aiLoading ||
      !projectToUpdate
    ) {
      return;
    }

    setAiLoading(true);

    setAiReply(
      "Nova AI is analyzing your project..."
    );

    try {
      // Send COMPLETE project files to AI
      const response = await fetch(
        `${API_URL}/api/project-ai`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            projectName:
              projectToUpdate.name,

            prompt,

            files:
              projectToUpdate.files || {},
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI request failed"
        );
      }

      // =====================================
      // AI RETURNED UPDATED FILES
      // =====================================

      if (
        data.files &&
        typeof data.files === "object"
      ) {
        saveUpdatedProject(
          data.files,
          data.reply ||
            "Project updated successfully.",
          prompt,
          projectToUpdate
        );

        setAiReply(
          data.reply ||
            "Your project has been updated successfully."
        );
      } else {
        // AI reply only
        setAiReply(
          data.reply ||
            "Nova AI completed the request."
        );

        const updatedProject = {
          ...projectToUpdate,
          aiReply:
            data.reply || "",
          lastPrompt: prompt,
          modified: "Just now",
        };

        setActiveProject(
          updatedProject
        );

        setProjects((prev) =>
          prev.map((project) =>
            project.id ===
            updatedProject.id
              ? updatedProject
              : project
          )
        );
      }

      setAiPrompt("");
    } catch (error) {
      console.error(
        "Nova Project AI Error:",
        error
      );

      const isBackendUnavailable =
        /failed to fetch|networkerror|fetch failed/i.test(
          error.message || ""
        );
      const errorMessage = isBackendUnavailable
        ? `Cannot reach the Nova AI backend at ${API_URL || window.location.origin}. Start the app with "npm run dev" from the project folder, then try again.`
        : error.message;

      setAiReply(
        `❌ Nova AI could not update the project.

${errorMessage}`
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ==========================================
  // DELETE PROJECT
  // ==========================================

  const deleteProject = () => {
    if (!projectToDelete) {
      return;
    }

    setProjects((prev) =>
      prev.filter(
        (project) =>
          project.id !==
          projectToDelete.id
      )
    );

    if (
      activeProject?.id ===
      projectToDelete.id
    ) {
      closeProject();
    }

    setProjectToDelete(null);
  };

  // ==========================================
  // PROJECT WORKSPACE
  // ==========================================

  if (activeProject) {
    return (
      <div className="project-workspace">

        {/* TOP BAR */}

        <div className="workspace-topbar">

          <button
            type="button"
            className="back-project"
            onClick={closeProject}
          >
            ← Projects
          </button>

          <div className="workspace-title">

            <span>📁</span>

            <div>
              <strong>
                {activeProject.name}
              </strong>

              <small>
                  Saved locally ·{" "}
                {activeProject.memory ||
                  "Default memory"}
              </small>
            </div>

          </div>

          <div className="workspace-actions">

            <button
              type="button"
              className="workspace-button"
              onClick={previewProject}
            >
              ▶ Open preview
            </button>

            <button
              type="button"
              className="workspace-button primary"
              onClick={downloadProject}
            >
              ↓ Download
            </button>

          </div>

        </div>

        {/* WORKSPACE */}

        <div className="workspace-grid">

          {/* FILES */}

          <section className="workspace-editor">

            <div className="workspace-section-heading">

              <span>
                Project files
              </span>

              <small>
                {
                  Object.keys(
                    activeProject.files || {}
                  ).length
                }{" "}
                files
              </small>

            </div>

            <div className="file-list">

              {Object.entries(
                activeProject.files || {}
              ).map(
                ([
                  fileName,
                  fileContent,
                ]) => (

                  <details
                    className="file-item"
                    key={fileName}
                    open={
                      fileName ===
                      "index.html"
                    }
                  >

                    <summary>
                      📄 {fileName}
                    </summary>

                    <pre>
                      {fileContent}
                    </pre>

                  </details>

                )
              )}

            </div>

            {/* PREVIEW */}

            <div className="preview-card">

              <div>
                <span className="status-dot" />

                Ready to run
              </div>

              <p>
                Your responsive project
                is ready. Ask Nova AI to
                change the design or open
                the preview.
              </p>

              <button
                type="button"
                className="preview-link"
                onClick={
                  previewProject
                }
              >
                Run project ↗
              </button>

            </div>

          </section>

          {/* NOVA AI */}

          <aside className="project-ai-panel">

            <div className="ai-panel-heading">

              <span className="ai-spark">
                ✦
              </span>

              <div>

                <strong>
                  Nova AI
                </strong>

                <small>
                  Build with your project
                </small>

              </div>

            </div>

            <div className="ai-panel-divider" />

            <div className="ai-reply">

              {aiReply ? (
                <div className="ai-reply-content">
                  {aiReply}
                </div>
              ) : (
                <>
                  Tell me what to build
                  next. I can plan a page,
                  improve the design, or
                  explain any file.
                </>
              )}

            </div>

            <form
              className="ai-form"
              onSubmit={
                askProjectAi
              }
            >

              <textarea
                value={aiPrompt}
                onChange={(event) =>
                  setAiPrompt(
                    event.target.value
                  )
                }
                placeholder="Ask AI to improve this project..."
                rows={5}
                disabled={aiLoading}
              />

              <button
                type="submit"
                disabled={
                  aiLoading ||
                  !aiPrompt.trim()
                }
              >

                {aiLoading
                  ? "Nova AI is working..."
                  : "Ask Nova AI ✨"}

              </button>

            </form>

          </aside>

        </div>
      </div>
    );
  }

  // ==========================================
  // LIBRARY PAGE
  // ==========================================

  return (
    <div className="library-page">

      <header className="library-header">
        <div className="library-title">
          <span className="library-eyebrow"><FiLayers /> YOUR WORKSPACE</span>
          <h1>Project library</h1>
          <p>One home for everything you are building with Nova.</p>
        </div>
        <button
          type="button"
          className="new-project-button"
          onClick={openCreateModal}
        >
          <FiPlus /> <span>New project</span>
        </button>
      </header>

      <section className="library-ai-builder" aria-labelledby="library-ai-title">
        <div className="ai-builder-copy">
          <span className="ai-builder-kicker"><FiZap /> NOVA AI BUILDER</span>
          <h2 id="library-ai-title">What are we making today?</h2>
          <p>Describe an idea. Nova will turn it into a working project you can keep refining.</p>
        </div>
        <form className="ai-idea-form" onSubmit={submitAiIdea}>
          <label className="visually-hidden" htmlFor="library-ai-idea">Describe what Nova should build</label>
          <textarea
            id="library-ai-idea"
            value={aiIdea}
            onChange={(event) => setAiIdea(event.target.value)}
            placeholder="A calm budgeting app with monthly charts and spending categories..."
            rows={2}
          />
          <button type="submit" disabled={!aiIdea.trim() || aiLoading}>
            <FiStar /> <span>Build with AI</span> <FiArrowUpRight />
          </button>
        </form>
        <div className="ai-idea-examples" aria-label="Example ideas">
          <span>Try</span>
          {[
            "Portfolio for a photographer",
            "Meal planner for busy weeks",
            "Landing page for a coffee shop",
          ].map((idea) => (
            <button key={idea} type="button" onClick={() => setAiIdea(idea)}>
              {idea}
            </button>
          ))}
        </div>
      </section>

      <div className="library-section-heading">
        <div>
          <h2>Your projects</h2>
          <span>{projects.length} {projects.length === 1 ? "project" : "projects"}</span>
        </div>
        <label className="search-box">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">
              ×
            </button>
          )}
        </label>
      </div>

      {/* TABS */}

      <div className="library-tabs" role="tablist" aria-label="Filter projects">

        <button
          type="button"
          className={
            activeTab === "all"
              ? "library-tab active"
              : "library-tab"
          }
          role="tab"
          aria-selected={activeTab === "all"}
          onClick={() =>
            setActiveTab("all")
          }
        >
          All
        </button>

        <button
          type="button"
          className={
            activeTab === "created"
              ? "library-tab active"
              : "library-tab"
          }
          role="tab"
          aria-selected={activeTab === "created"}
          onClick={() =>
            setActiveTab("created")
          }
        >
          Created by you
        </button>

        <button
          type="button"
          className={
            activeTab === "shared"
              ? "library-tab active"
              : "library-tab"
          }
          role="tab"
          aria-selected={activeTab === "shared"}
          onClick={() =>
            setActiveTab("shared")
          }
        >
          Shared with you
        </button>

      </div>

      {/* TABLE HEADER */}

      <div className="project-header">

        <span>
          PROJECT
        </span>

        <span>
          LAST UPDATED
        </span>

      </div>

      {/* PROJECTS */}

      <div className="project-container">

        {filteredProjects.length === 0 ? (

          <div className="empty-projects">

            <div className="empty-folder"><FiFolder /></div>

            <h2>
              {search ? "No matching projects" : activeTab === "shared" ? "Nothing shared yet" : "Your workspace starts here"}
            </h2>

            <p>
              {search
                ? `No projects match “${search}”. Try another search.`
                : "Start with an idea and let Nova AI help you shape it into something real."}
            </p>

            <button
              type="button"
              className="create-project-button"
              onClick={search ? () => setSearch("") : openCreateModal}
            >
              {search ? "Clear search" : <><FiPlus /> Create a project</>}
            </button>

          </div>

        ) : (

          <div className="project-list">

            {filteredProjects.map(
              (project) => (

                <div
                  className="project-row"
                  key={project.id}
                >

                  <button
                    type="button"
                    className="project-open"
                    onClick={() =>
                      openProject(
                        project
                      )
                    }
                  >

                    <div className="project-info">

                      <div className="folder-icon"><FiFolder /></div>

                      <div className="project-meta">

                        <strong>
                          {project.name}
                        </strong>

                        <small className="project-type">
                          {project.type}
                        </small>

                        {project.description && (
                          <small className="project-description">
                            {project.description}
                          </small>
                        )}

                      </div>

                    </div>

                  </button>

                  <span className="project-date">
                    {project.modified}
                  </span>

                  <button
                    type="button"
                    className="delete-project"
                    aria-label={`Delete ${project.name}`}
                    title="Delete project"
                    onClick={() =>
                      setProjectToDelete(
                        project
                      )
                    }
                  >
                    <FiTrash2 />
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* CREATE MODAL */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeCreateModal();
            }
          }}
        >

          <div className="create-modal">

            <div className="modal-header">

              <h2>
                Create project
              </h2>

              <button
                type="button"
                className="close-modal"
                onClick={
                  closeCreateModal
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <label className="project-label">
              Project name
            </label>

            <div className="project-input">

              <span>
                😊
              </span>

              <input
                autoFocus
                type="text"
                placeholder="Anaya Wedding Hotel"
                value={projectName}
                onChange={(e) =>
                  setProjectName(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleProjectKeyDown
                }
              />

            </div>

            <label className="project-label ai-prompt-label" htmlFor="initial-project-prompt">
              What should AI build?
            </label>

            <textarea
              id="initial-project-prompt"
              className="initial-project-prompt"
              value={initialPrompt}
              onChange={(event) =>
                setInitialPrompt(event.target.value)
              }
              placeholder="Describe your website, app, or idea..."
              rows={4}
            />

            <div className="project-info-box">

              <span className="info-icon">
                💡
              </span>

              <p>
                Projects keep chats,
                files, and custom
                instructions in one
                place. Use them for
                ongoing work, or just
                to keep things tidy.
              </p>

            </div>

            <div className="memory-section">

              <label>
                Memory
              </label>

              <select
                value={memory}
                onChange={(e) =>
                  setMemory(
                    e.target.value
                  )
                }
              >

                <option>
                  Default memory
                </option>

                <option>
                  Project memory
                </option>

                <option>
                  No memory
                </option>

              </select>

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className={
                  projectName.trim()
                    ? "modal-create active"
                    : "modal-create"
                }
                disabled={
                  !projectName.trim()
                }
                onClick={
                  createProject
                }
              >
                {initialPrompt.trim()
                  ? "Create with AI"
                  : "Create project"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* DELETE MODAL */}

      {projectToDelete && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setProjectToDelete(
                null
              );
            }
          }}
        >

          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
          >

            <div className="modal-header">

              <h2>
                Delete project?
              </h2>

              <button
                type="button"
                className="close-modal"
                onClick={() =>
                  setProjectToDelete(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <p className="delete-message">

              This will permanently
              delete{" "}

              <strong>
                {projectToDelete.name}
              </strong>

              {" "}and its project
              data.

            </p>

            <div className="delete-actions">

              <button
                type="button"
                className="cancel-delete"
                onClick={() =>
                  setProjectToDelete(
                    null
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                onClick={
                  deleteProject
                }
              >
                Delete project
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Library;