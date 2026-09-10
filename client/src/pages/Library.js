import React, { useEffect, useMemo, useState } from "react";
import "./Library.css";
import { buildProjectHtml } from "../utils/projectTemplate";

function Library() {
  const [activeTab, setActiveTab] = useState("all");
  const [activeProject, setActiveProject] = useState(() => {
    try {
      const saved = localStorage.getItem("novaActiveProject");
      const project = saved ? JSON.parse(saved) : null;
      if (project?.files?.["index.html"] && !project.files["index.html"].includes("hotel-shell-v2")) {
        project.files["index.html"] = buildProjectHtml(project.name, project.files["index.html"]);
      }
      return project;
    } catch {
      return null;
    }
  });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState(() => {
    try {
      const saved = localStorage.getItem("novaActiveProject");
      return saved ? JSON.parse(saved).aiReply || "" : "";
    } catch {
      return "";
    }
  });
  const [aiLoading, setAiLoading] = useState(false);

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("novaProjects");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];  
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [memory, setMemory] = useState("Default memory");
  const [search, setSearch] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);

  // =====================================
  // SAVE PROJECTS
  // =====================================

  useEffect(() => {
    localStorage.setItem(
      "novaProjects",
      JSON.stringify(projects)
    );
  }, [projects]);

  // =====================================
  // OPEN MODAL
  // =====================================

  const openCreateModal = () => {
    setProjectName("");
    setMemory("Default memory");
    setShowModal(true);
  };

  // =====================================
  // CLOSE MODAL
  // =====================================

  const closeCreateModal = () => {
    setShowModal(false);
    setProjectName("");
  };

  // =====================================
  // CREATE PROJECT
  // =====================================

 const createProject = () => {
  const name = projectName.trim();

  if (!name) return;

  const newProject = {
    id: Date.now(),
    name: name,
    type: "Created by you",
    modified: "Just now",
    memory: memory,
    files: {
      "index.html": createStarterHtml(name),
      "README.md": `# ${name}\n\nA responsive project created with Nova AI.`
    }
  };

  setProjects((prev) => [
    newProject,
    ...prev
  ]);

  setActiveTab("all");
  setShowModal(false);
  setProjectName("");
  openProject(newProject);
};

  function createStarterHtml(name) {
    return buildProjectHtml(name);
  }

  // =====================================
  // ENTER KEY
  // =====================================

  const handleProjectKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createProject();
    }

    if (e.key === "Escape") {
      closeCreateModal();
    }
  };

  // =====================================
  // FILTER
  // =====================================

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

  // =====================================
  // OPEN PROJECT
  // =====================================

  const openProject = (project) => {
    const hydratedProject = project.files ? { ...project, files: { ...project.files } } : {
      ...project,
      files: { "index.html": createStarterHtml(project.name), "README.md": `# ${project.name}\n\nA responsive project created with Nova AI.` }
    };
    if (!hydratedProject.files["index.html"]?.includes("hotel-shell-v2")) {
      hydratedProject.files["index.html"] = buildProjectHtml(hydratedProject.name, hydratedProject.files["index.html"]);
      setProjects((prev) => prev.map((item) => (
        item.id === hydratedProject.id ? hydratedProject : item
      )));
    }
    setActiveProject(hydratedProject);
    setAiReply(hydratedProject.aiReply || "");
    localStorage.setItem("novaActiveProject", JSON.stringify(hydratedProject));
  };

  const closeProject = () => {
    setActiveProject(null);
    localStorage.removeItem("novaActiveProject");
    setAiReply("");
    setAiPrompt("");
  };

  const previewProject = () => {
    if (!activeProject?.files?.["index.html"]) return;
    const previewUrl = URL.createObjectURL(new Blob([activeProject.files["index.html"]], { type: "text/html" }));
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const downloadProject = () => {
    if (!activeProject) return;
    const content = activeProject.files?.["index.html"] || createStarterHtml(activeProject.name);
    const downloadUrl = URL.createObjectURL(new Blob([content], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${activeProject.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "nova-project"}.html`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const askProjectAi = async (event) => {
    event.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt || aiLoading || !activeProject) return;
    setAiLoading(true);
    setAiReply("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:5001");
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Project: ${activeProject.name}. Files: ${Object.keys(activeProject.files || {}).join(", ")}. User request: ${prompt}`, history: [] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI request failed");
      setAiReply(data.reply || "Nova AI has no suggestion yet.");
    } catch (error) {
      setAiReply("AI is offline right now. Your project is still ready to preview and download. Try again when the Nova server is running.");
    } finally {
      setAiLoading(false);
      setAiPrompt("");
    }
  };

  const deleteProject = () => {
    if (!projectToDelete) return;

    setProjects((prev) =>
      prev.filter((project) => project.id !== projectToDelete.id)
    );
    setProjectToDelete(null);
  };

  if (activeProject) {
    return (
      <div className="project-workspace">
        <div className="workspace-topbar">
          <button type="button" className="back-project" onClick={closeProject}>← Projects</button>
          <div className="workspace-title"><span>📁</span><strong>{activeProject.name}</strong><small>Saved locally · {activeProject.memory}</small></div>
          <div className="workspace-actions">
            <button type="button" className="workspace-button" onClick={previewProject}>▶ Open preview</button>
            <button type="button" className="workspace-button primary" onClick={downloadProject}>↓ Download</button>
          </div>
        </div>
        <div className="workspace-grid">
          <section className="workspace-editor">
            <div className="workspace-section-heading"><span>Project files</span><small>{Object.keys(activeProject.files || {}).length} files</small></div>
            <div className="file-list">
              {Object.entries(activeProject.files || {}).map(([fileName, fileContent]) => (
                <details className="file-item" key={fileName} open={fileName === "index.html"}>
                  <summary>📄 {fileName}</summary>
                  <pre>{fileContent}</pre>
                </details>
              ))}
            </div>
            <div className="preview-card">
              <div><span className="status-dot" />Ready to run</div>
              <p>Your responsive starter is live. Open the preview to test it in a new tab.</p>
              <button type="button" className="preview-link" onClick={previewProject}>Run project ↗</button>
            </div>
          </section>
          <aside className="project-ai-panel">
            <div className="ai-panel-heading"><span className="ai-spark">✦</span><div><strong>Nova AI</strong><small>Build with your project</small></div></div>
            <div className="ai-reply">{aiReply || "Tell me what to build next. I can plan a page, improve the design, or explain any file."}</div>
            <form className="ai-form" onSubmit={askProjectAi}>
              <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Ask AI to improve this project..." rows="4" />
              <button type="submit" disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? "Thinking..." : "Ask Nova AI ✨"}</button>
            </form>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page">

      {/* =================================
          HEADER
      ================================= */}

      <div className="library-header">

        <div className="library-title">

          <h1>Projects</h1>

          <p>
            Organize your chats, files and memories.
          </p>

        </div>

        <div className="library-actions">

          {/* SEARCH */}

          <div className="search-box">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search projects"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          {/* NEW BUTTON */}

          <button
            type="button"
            className="new-project-button"
            onClick={openCreateModal}
          >
            + New
          </button>

        </div>

      </div>

      {/* =================================
          TABS
      ================================= */}

      <div className="library-tabs">

        <button
          type="button"
          className={
            activeTab === "all"
              ? "library-tab active"
              : "library-tab"
          }
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
          onClick={() =>
            setActiveTab("shared")
          }
        >
          Shared with you
        </button>

      </div>

      {/* =================================
          PROJECT TABLE HEADER
      ================================= */}

      <div className="project-header">

        <span>Name</span>

        <span>Modified</span>

      </div>

      {/* =================================
          PROJECT CONTENT
      ================================= */}

      <div className="project-container">

        {filteredProjects.length === 0 ? (

          <div className="empty-projects">

            <div className="empty-folder">
              📁
            </div>

            <h2>
              No projects yet
            </h2>

            <p>
              Create your first project to get started.
            </p>

            {/* CREATE PROJECT */}

            <button
              type="button"
              className="create-project-button"
              onClick={openCreateModal}
            >
              + Create project
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
                    onClick={() => openProject(project)}
                  >
                    <div className="project-info">

                      <div className="folder-icon">
                        📁
                      </div>

                      <div>

                        <strong>
                          {project.name}
                        </strong>

                        <small>
                          {project.type}
                        </small>

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
                    onClick={() => setProjectToDelete(project)}
                  >
                    🗑
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =================================
          CREATE PROJECT MODAL
      ================================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeCreateModal();
            }
          }}
        >

          <div className="create-modal">

            {/* MODAL HEADER */}

            <div className="modal-header">

              <h2>
                Create project
              </h2>

              <button
                type="button"
                className="close-modal"
                onClick={closeCreateModal}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* PROJECT NAME */}

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
                placeholder="Copenhagen Trip"
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

            {/* INFO */}

            <div className="project-info-box">

              <span className="info-icon">
                💡
              </span>

              <p>
                Projects keep chats, files, and
                custom instructions in one place.
                Use them for ongoing work, or just
                to keep things tidy.
              </p>

            </div>

            {/* MEMORY */}

            <div className="memory-section">

              <label>
                Memory
              </label>

              <select
                value={memory}
                onChange={(e) =>
                  setMemory(e.target.value)
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

            {/* CREATE */}

            <div className="modal-footer">

              <button
                type="button"
                className={
                  projectName.trim()
                    ? "modal-create active"
                    : "modal-create"
                }
                disabled={!projectName.trim()}
                onClick={createProject}
              >
                Create project
              </button>

            </div>

          </div>

        </div>

      )}

      {projectToDelete && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setProjectToDelete(null);
            }
          }}
        >
          <div className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-project-title">
            <div className="modal-header">
              <h2 id="delete-project-title">Delete project?</h2>
              <button
                type="button"
                className="close-modal"
                onClick={() => setProjectToDelete(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="delete-message">
              This will permanently delete <strong>{projectToDelete.name}</strong> and its project data.
            </p>

            <div className="delete-actions">
              <button
                type="button"
                className="cancel-delete"
                onClick={() => setProjectToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete"
                onClick={deleteProject}
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