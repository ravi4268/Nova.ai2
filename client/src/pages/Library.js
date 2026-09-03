import React, { useEffect, useMemo, useState } from "react";
import "./Library.css";

function Library() {
  const [activeTab, setActiveTab] = useState("all");

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
    memory: memory
  };

  setProjects((prev) => [
    newProject,
    ...prev
  ]);

  setActiveTab("all");
  setShowModal(false);
  setProjectName("");
};

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
    alert(`Opening project: ${project.name}`);
  };

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

                <button
                  type="button"
                  className="project-row"
                  key={project.id}
                  onClick={() =>
                    openProject(project)
                  }
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

                  <span className="project-date">
                    {project.modified}
                  </span>

                </button>

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

    </div>
  );
}

export default Library;