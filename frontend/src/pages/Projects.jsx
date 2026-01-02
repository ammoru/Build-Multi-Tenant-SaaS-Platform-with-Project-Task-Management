import { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProjectModal from '../components/ProjectModal';
import './Projects.css';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await projectAPI.listProjects(params);
      setProjects(response.data.data.projects || []);
    } catch (error) {
      console.error('Fetch projects error:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectAPI.deleteProject(projectId);
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setEditingProject(null);
    if (refresh) {
      fetchProjects();
    }
  };

  const canEditProject = (project) => {
    return user?.role === 'tenant_admin' || project.createdBy?.id === user?.id;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'archived':
        return 'badge-secondary';
      case 'completed':
        return 'badge-info';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your organization's projects</p>
        </div>
        <button onClick={handleCreateProject} className="btn btn-primary">
          + Create Project
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects found</h3>
          <p>Create your first project to get started</p>
          <button onClick={handleCreateProject} className="btn btn-primary">
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                  {project.status}
                </span>
              </div>

              <p className="project-description">
                {project.description || 'No description'}
              </p>

              <div className="project-meta">
                <div className="meta-item">
                  <strong>Tasks:</strong> {project.completedTaskCount || 0}/
                  {project.taskCount || 0}
                </div>
                <div className="meta-item">
                  <strong>Created by:</strong> {project.createdBy?.fullName || 'Unknown'}
                </div>
              </div>

              <div className="project-actions">
                <a href={`/projects/${project.id}`} className="btn btn-sm btn-outline">
                  View Details
                </a>
                {canEditProject(project) && (
                  <>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Projects;
